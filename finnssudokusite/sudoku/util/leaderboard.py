import math
from collections import defaultdict
from django.contrib.auth.models import User
from ..models import UserSudokuDone, CachedLeaderboardEntry
from django.db import transaction

def compute_raw_score(stat):
    """
    Per-puzzle score:

    S_{u,s} = max(1, log_base_1.2(avg_t / 20)) * clamp(avg_t / user_t, 0.5, 2)

    where:
      - avg_t: the average solve time for puzzle s (in seconds)
      - user_t: the user's actual solve time (in seconds)
    """
    puzzle = stat.sudoku
    if not puzzle or not puzzle.average_time or not stat.time:
        return None

    avg_t = max(puzzle.average_time, 1e-8)
    user_t = max(stat.time, 1e-8)

    try:
        log_term = math.log(avg_t / 20, 1.2)
    except ValueError:
        log_term = 0  # fallback for very small avg_t

    weight = max(1.0, log_term)
    speed_factor = max(0.5, min(avg_t / user_t, 2.0))

    return weight * speed_factor


def compute_total_rating(scores):
    """
    Computes the total rating R_u = sum_{s} S_{u,s}
    """
    return sum(scores)


def build_leaderboard(user_data_map):
    """
    Computes SPI-normalized leaderboard entries from per-user score lists.

    SPI_u = 100 * (R_u / max_{v} R_v)
    """
    scores = {
        user: compute_total_rating(user_scores)
        for user, user_scores in user_data_map.items()
    }

    R_max = max(scores.values(), default=0.0)
    leaderboard = []

    for user, score in scores.items():
        spi = 100.0 * score / R_max if R_max > 0 else 0.0
        leaderboard.append({
            "user": user,
            "score": round(spi, 2),
            "solved": len(user_data_map[user]),
        })

    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    return leaderboard


def compute_leaderboard_scores():
    """
    Computes leaderboard scores for all users using their latest 100 solves.
    """
    stats = (
        UserSudokuDone.objects
        .select_related("user", "sudoku")
        .filter(time__gt=0)
        .order_by("-date")
    )

    user_data = defaultdict(list)

    for stat in stats:
        score = compute_raw_score(stat)
        if score and score > 0:
            username = stat.user.username
            if len(user_data[username]) < 100:
                user_data[username].append(score)

    return build_leaderboard(user_data)


def update_all_leaderboard_entries():
    """
    Updates or creates CachedLeaderboardEntry for each user,
    using their most recent 100 solves.
    """
    for user in User.objects.all():
        stats = (
            UserSudokuDone.objects
            .select_related("sudoku")
            .filter(user=user, time__gt=0)
            .order_by("-date")[:100]
        )

        scores = []
        for stat in stats:
            score = compute_raw_score(stat)
            if score and score > 0:
                scores.append(score)

        final_score = compute_total_rating(scores)
        CachedLeaderboardEntry.objects.update_or_create(
            user=user,
            defaults={
                "score": final_score,
                "solved": len(scores),
            }
        )
        # print(f"[update] {user.username}: {final_score:.2f} pts from {len(scores)} solves")

    update_all_leaderboard_ranks()


def update_leaderboard_entry(user):
    """
    Updates the CachedLeaderboardEntry for a single user.
    """
    stats = (
        UserSudokuDone.objects
        .select_related("sudoku")
        .filter(user=user, time__gt=0)
        .order_by("-date")[:100]
    )

    scores = []
    for stat in stats:
        score = compute_raw_score(stat)
        if score and score > 0:
            scores.append(score)

    final_score = compute_total_rating(scores)
    CachedLeaderboardEntry.objects.update_or_create(
        user=user,
        defaults={
            "score": final_score,
            "solved": len(scores),
        }
    )
    update_all_leaderboard_ranks()

from django.db import transaction
def update_all_leaderboard_ranks():
    with transaction.atomic():
        entries = CachedLeaderboardEntry.objects.select_for_update().order_by("-score")
        for idx, entry in enumerate(entries, start=1):
            entry.rank = idx
        CachedLeaderboardEntry.objects.bulk_update(entries, ["rank"])
