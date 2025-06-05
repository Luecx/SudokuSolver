import math
from collections import defaultdict
from django.contrib.auth.models import User
from ..models import UserSudokuDone, CachedLeaderboardEntry

LAMBDA = 0.2  # Volume weight

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

def compute_volume_weight(n):
    return 1.0 - math.exp(-LAMBDA * n)

def compute_adjusted_rating(scores):
    """
    Computes adjusted rating R'_u = avg(S_{u,s}) * V_u
    """
    if not scores:
        return 0.0
    R_u = sum(scores) / len(scores)
    V_u = compute_volume_weight(len(scores))
    return R_u * V_u

def build_leaderboard(user_data_map):
    scores = {user: compute_adjusted_rating(scores) for user, scores in user_data_map.items()}
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
