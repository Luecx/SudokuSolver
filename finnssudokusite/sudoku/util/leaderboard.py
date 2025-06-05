import math
from collections import defaultdict
from django.contrib.auth.models import User
from ..models import UserSudokuDone, CachedLeaderboardEntry

def compute_raw_score(stat):
    """
    Per-puzzle score:

    S_{u,s} = avg_t * (avg_t / user_t)

    where:
      - avg_t: the average solve time for puzzle s (always at least 1e-8 to avoid division by zero)
      - user_t: the user's actual solve time
    """
    puzzle = stat.sudoku
    if not puzzle or not puzzle.average_time or not stat.time:
        return None

    avg_t = max(puzzle.average_time, 1e-8)
    user_t = max(stat.time, 1e-8)
    return avg_t * (avg_t / user_t)


def compute_total_rating(scores):
    """
    Computes the total rating R_u = sum_{s} S_{u,s}
    using only the last 100 puzzles (or fewer if less available).

    Unlike the previous average-based rating, the total score increases
    with the number of completed puzzles. This means players who solve
    more puzzles will have a higher rating.
    """
    return sum(scores)


def build_leaderboard(user_data_map):
    """
    For each user, computes their total score from their recent puzzles.
    Normalizes the scores so that the highest total corresponds to an SPI of 100.

    SPI_u = 100 * (R_u / max_{v} R_v)
    """
    scores = {user: compute_total_rating(user_scores) for user, user_scores in user_data_map.items()}
    R_max = max(scores.values(), default=0.0)
    leaderboard = []

    for user, score in scores.items():
        spi = 100.0 * score / R_max if R_max > 0 else 0.0
        leaderboard.append({
            'user': user,
            'score': round(spi, 2),
            'solved': len(user_data_map[user])
        })

    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    return leaderboard


def compute_leaderboard_scores():
    """
    Computes the leaderboard by processing all valid puzzle completion stats.
    For each user, only the most recent 100 valid solves are used.

    Note: Using the total (i.e. sum of scores), rather than an average,
    means that a player who has completed fewer puzzles will have a lower total,
    even if their per-puzzle performance is outstanding.
    """
    stats = (
        UserSudokuDone.objects
        .select_related('user', 'sudoku')
        .filter(time__gt=0)
        .order_by('-date')  # newest first
    )

    user_data = defaultdict(list)

    for stat in stats:
        score = compute_raw_score(stat)
        if score is None or score <= 0:
            continue
        user = stat.user.username
        if len(user_data[user]) < 100:
            user_data[user].append(score)

    return build_leaderboard(user_data)


def update_all_leaderboard_entries():
    """
    Updates leaderboard entries for all users.
    For each user, only the most recent 100 puzzle solves are considered,
    summing up the scores to compute their rating.
    """
    for user in User.objects.all():
        stats = (
            UserSudokuDone.objects
            .select_related('sudoku')
            .filter(user=user, time__gt=0)
            .order_by('-date')[:100]
        )

        # Compute the per-puzzle raw scores (ignoring any invalid or non-positive scores)
        scores = [compute_raw_score(stat) for stat in stats if compute_raw_score(stat)]
        scores = [s for s in scores if s > 0]

        final_score = compute_total_rating(scores)
        CachedLeaderboardEntry.objects.update_or_create(
            user=user,
            defaults={
                "score": final_score,
                "solved": len(scores)
            }
        )


def update_leaderboard_entry(user):
    """
    Updates the leaderboard entry for a single user based on their most recent 100 solves.
    Here the rating is the sum of per-puzzle scores.
    """
    stats = (
        UserSudokuDone.objects
        .select_related('sudoku')
        .filter(user=user, time__gt=0)
        .order_by('-date')[:100]
    )

    scores = [compute_raw_score(stat) for stat in stats if compute_raw_score(stat)]
    scores = [s for s in scores if s > 0]

    final_score = compute_total_rating(scores)
    CachedLeaderboardEntry.objects.update_or_create(
        user=user,
        defaults={
            "score": final_score,
            "solved": len(scores)
        }
    )
