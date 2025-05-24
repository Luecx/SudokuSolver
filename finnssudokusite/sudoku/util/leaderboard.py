"""
Leaderboard computation using the Sudoku Power Index (SPI).

This module computes user scores and rankings based on:
- Recency of solves (exponential decay)
- Puzzle difficulty (based on solve ratio)
- Speed (bonus for fast solves)
- Volume (small bonus for playing more puzzles)

If no puzzles have been played, the leaderboard will be empty.
"""

import math
from collections import defaultdict
from datetime import datetime, timezone
from django.utils.timezone import make_aware, is_naive
from ..models import UserSudokuDone


# === Constants === #
HALF_LIFE_DAYS = 60       # Half-life for recency weight
LAMBDA_VOL = 0.04         # Volume bonus factor
ALPHA, BETA = 1, 2        # Difficulty smoothing constants
DIFF_EXP = 1.7            # Exponent in difficulty formula


def _compute_weights(stat, now):
    """Compute recency, difficulty, and speed weights for a given stat record."""
    puzzle = stat.sudoku

    # Recency weight: exponential decay using stat.date
    if not stat.date:
        return None

    last_solve = stat.date
    if is_naive(last_solve):
        last_solve = make_aware(last_solve, timezone=timezone.utc)

    days_since = (now - last_solve).days
    w_rec = 2 ** (-days_since / HALF_LIFE_DAYS)

    # Difficulty weight: based on solve ratio
    solves = min(puzzle.solves or 0, puzzle.attempts or 0)
    attempts = puzzle.attempts or 0
    q = (solves + ALPHA) / (attempts + ALPHA + BETA)
    w_diff = 1 + (1 - q) ** DIFF_EXP

    # Speed bonus: positive only if faster than average
    user_t = max(stat.time, 1e-8)
    avg_t = max(puzzle.average_time or 0, 1e-8)

    try:
        delta_speed = max(0.0, math.log(avg_t / user_t))
    except Exception:
        delta_speed = 0.0

    return w_rec, w_diff, delta_speed


def _compute_raw_scores(stats, now):
    """Aggregate raw performance scores for each user."""
    players = defaultdict(lambda: {'P': 0.0, 'N': 0.0, 'solved': 0})

    for stat in stats:
        puzzle = stat.sudoku
        if not puzzle or (puzzle.average_time or 0) <= 0:
            continue

        weights = _compute_weights(stat, now)
        if not weights:
            continue

        w_rec, w_diff, delta_speed = weights
        p_ui = w_rec * w_diff * (1 + delta_speed)

        user_record = players[stat.user.username]
        user_record['P'] += p_ui
        user_record['N'] += w_rec
        user_record['solved'] += 1

    return players


def _convert_to_leaderboard(players):
    """Convert raw scores to leaderboard entries with SPI normalized to 100."""
    raw_scores = {}
    R_max = 0.0

    for user, data in players.items():
        P, N = data['P'], data['N']
        sqrt_N = math.sqrt(N) if N >= 0 else 0
        R = P * (1 + LAMBDA_VOL * sqrt_N)
        R = R.real if isinstance(R, complex) else R

        raw_scores[user] = {'R': R, 'solved': data['solved']}
        R_max = max(R_max, R)

    leaderboard = []
    for user, vals in raw_scores.items():
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
    Computes the leaderboard using all solve records with time > 0.

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
    raw_players = _compute_raw_scores(stats, now)
    return _convert_to_leaderboard(raw_players)
