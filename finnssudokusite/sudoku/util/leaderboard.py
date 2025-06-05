import math
from collections import defaultdict
from django.contrib.auth.models import User
from ..models import UserSudokuDone, CachedLeaderboardEntry


def compute_raw_score(stat):
    """
    S_{u,s} = avg_t * (avg_t / user_t)
    """
    puzzle = stat.sudoku
    if not puzzle or not puzzle.average_time or not stat.time:
        return None

    avg_t = max(puzzle.average_time, 1e-8)
    user_t = max(stat.time, 1e-8)
    return avg_t * (avg_t / user_t)


def compute_adjusted_rating(scores):
    """
    Computes adjusted rating R_u = avg(S_{u,s})
    """
    if not scores:
        return 0.0
    return sum(scores) / len(scores)


def build_leaderboard(user_data_map):
    scores = {user: compute_adjusted_rating(user_scores) for user, user_scores in user_data_map.items()}
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
    for user in User.objects.all():
        stats = (
            UserSudokuDone.objects
            .select_related('sudoku')
            .filter(user=user, time__gt=0)
            .order_by('-date')[:100]
        )

        scores = [compute_raw_score(stat) for stat in stats if compute_raw_score(stat)]
        scores = [s for s in scores if s > 0]

        final_score = compute_adjusted_rating(scores)
        CachedLeaderboardEntry.objects.update_or_create(
            user=user,
            defaults={
                "score": final_score,
                "solved": len(scores)
            }
        )


def update_leaderboard_entry(user):
    """
    Updates the leaderboard entry for a single user based on their last 100 solves.
    """
    stats = (
        UserSudokuDone.objects
        .select_related('sudoku')
        .filter(user=user, time__gt=0)
        .order_by('-date')[:100]
    )

    scores = [compute_raw_score(stat) for stat in stats if compute_raw_score(stat)]
    scores = [s for s in scores if s > 0]

    final_score = compute_adjusted_rating(scores)
    CachedLeaderboardEntry.objects.update_or_create(
        user=user,
        defaults={
            "score": final_score,
            "solved": len(scores)
        }
    )
