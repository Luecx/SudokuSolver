"""
Leaderboard computation using the Sudoku Power Index (SPI).

This module computes user scores and rankings based on:
- Recency of solves (exponential decay with alpha = 0.95)
- Puzzle difficulty (average time as proxy)
- Speed (relative to average)
- Geometric mean across all puzzles

If no puzzles have been played, the leaderboard will be empty.
"""

import math
from collections import defaultdict
from datetime import datetime, timezone
from django.utils.timezone import make_aware, is_naive
from ..models import UserSudokuDone


# === Constants === #
ALPHA = 0.95  # Recency decay base (stronger decay)
EPS = 1e-8    # Small number to avoid divide-by-zero


def _compute_contribution(stat, now):
    """Compute score S_{u,s} for a given puzzle solve."""
    puzzle = stat.sudoku
    if not stat.date or not puzzle or not puzzle.average_time:
        return None

    # Recency weight
    solve_time = stat.date
    if is_naive(solve_time):
        solve_time = make_aware(solve_time, timezone=timezone.utc)
    days_since = (now - solve_time).days
    w_rec = ALPHA ** days_since

    # Difficulty (proxy): average time
    avg_t = max(puzzle.average_time, EPS)
    user_t = max(stat.time, EPS)

    # Final contribution
    score = w_rec * avg_t * (avg_t / user_t)
    return score


def _compute_user_scores(stats, now):
    """Collect all scores S_{u,s} per user."""
    user_scores = defaultdict(list)

    for stat in stats:
        score = _compute_contribution(stat, now)
        if score is not None:
            user_scores[stat.user.username].append(score)

    return user_scores


def _geometric_mean(values):
    """Compute geometric mean of a list of values."""
    if not values:
        return 0.0
    log_sum = sum(math.log(v) for v in values if v > 0)
    return math.exp(log_sum / len(values))


def _normalize_scores(user_scores):
    """Convert raw geometric means to leaderboard entries."""
    ratings = {}
    R_max = 0.0

    for user, scores in user_scores.items():
        R_u = _geometric_mean(scores)
        ratings[user] = {
            'R': R_u,
            'solved': len(scores)
        }
        R_max = max(R_max, R_u)

    leaderboard = []
    for user, vals in ratings.items():
        spi = 100 * vals['R'] / R_max if R_max > 0 else 0
        leaderboard.append({
            'user': user,
            'score': round(spi, 2),
            'solved': vals['solved']
        })

    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    return leaderboard


def compute_leaderboard_scores():
    """
    Computes the leaderboard using all valid solve records.

    Returns:
        A sorted list of dictionaries:
            {
                'user': username,
                'score': float (0-100),
                'solved': int
            }
    """
    stats = (
        UserSudokuDone.objects
        .select_related('user', 'sudoku')
        .filter(time__gt=0)
    )

    if not stats.exists():
        return []

    now = datetime.now(timezone.utc)
    user_scores = _compute_user_scores(stats, now)
    return _normalize_scores(user_scores)
