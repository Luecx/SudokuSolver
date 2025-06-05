"""
Leaderboard computation using the Sudoku Power Index (SPI).

This module computes user scores and rankings based on:
- Per-puzzle speed vs average time
- Only most recent 100 solves
- Weighted geometric mean of performance
- Volume correction to down-weight small sample sizes
- Final normalization to 0–100 SPI scale
"""

import math
from collections import defaultdict
from django.contrib.auth.models import User
from ..models import UserSudokuDone, CachedLeaderboardEntry

MAX_RECENT = 100
LAMBDA = 0.2
EPS = 1e-8


def compute_raw_score(stat):
    puzzle = stat.sudoku
    if not puzzle or not puzzle.average_time or not stat.time:
        return None
    avg_t = max(puzzle.average_time, EPS)
    user_t = max(stat.time, EPS)
    return avg_t * (avg_t / user_t)


def compute_geometric_mean(log_sum, count):
    if count == 0:
        return 0.0
    return math.exp(log_sum / count)


def compute_volume_weight(n_solves):
    return 1.0 - math.exp(-LAMBDA * n_solves)


def compute_adjusted_rating(log_sum, count):
    R_u = compute_geometric_mean(log_sum, count)
    V_u = compute_volume_weight(count)
    return R_u * V_u


def update_leaderboard_entry(user):
    stats = (
        UserSudokuDone.objects
        .select_related("sudoku")
        .filter(user=user, time__gt=0)
        .order_by("-date")[:MAX_RECENT]
    )

    log_sum = 0.0
    count = 0

    for stat in stats:
        score = compute_raw_score(stat)
        if score is None or score <= 0:
            continue
        log_sum += math.log(score)
        count += 1

    adjusted = compute_adjusted_rating(log_sum, count) if count else 0.0

    CachedLeaderboardEntry.objects.update_or_create(
        user=user,
        defaults={"score": adjusted, "solved": count}
    )


def update_all_leaderboard_entries():
    for user in User.objects.all():
        update_leaderboard_entry(user)


def compute_leaderboard_scores():
    entries = CachedLeaderboardEntry.objects.select_related("user").all()
    max_score = max((entry.score for entry in entries), default=EPS)
    leaderboard = []

    for entry in entries:
        spi = 100.0 * entry.score / max_score
        leaderboard.append({
            "user": entry.user.username,
            "score": round(spi, 2),
            "solved": entry.solved,
        })

    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    return leaderboard
