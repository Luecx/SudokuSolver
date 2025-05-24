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
from ..models import UserSudokuFinished


# === Constants === #
HALF_LIFE_DAYS = 60       # Half-life for recency weight
LAMBDA_VOL = 0.04         # Volume bonus factor
ALPHA, BETA = 1, 2        # Difficulty smoothing constants
DIFF_EXP = 1.7            # Exponent in difficulty formula


def _compute_weights(finished_record, now):
    """Compute recency, difficulty, and speed weights for a given finished record."""
    puzzle = finished_record.sudoku

    # Recency weight: exponential decay
    completed_at = finished_record.completed_at
    if not completed_at:
        return None

    if is_naive(completed_at):
        completed_at = make_aware(completed_at, timezone=timezone.utc)

    days_since = (now - completed_at).days
    w_rec = 2 ** (-days_since / HALF_LIFE_DAYS)

    # Difficulty weight: based on solve ratio
    solves = min(puzzle.solves or 0, puzzle.attempts or 0)
    attempts = puzzle.attempts or 0
    q = (solves + ALPHA) / (attempts + ALPHA + BETA)
    w_diff = 1 + (1 - q) ** DIFF_EXP

    # Speed bonus: positive only if faster than average
    user_t = max(finished_record.completion_time, 1e-8)
    avg_t = max(puzzle.average_time or 0, 1e-8)

    try:
        delta_speed = max(0.0, math.log(avg_t / user_t))
    except Exception:
        delta_speed = 0.0

    return w_rec, w_diff, delta_speed


def _compute_raw_scores(finished_records, now):
    """Aggregate raw performance scores for each user."""
    players = defaultdict(lambda: {'P': 0.0, 'N': 0.0, 'solved': 0})

    for record in finished_records:
        puzzle = record.sudoku

        if (puzzle.average_time or 0) <= 0:
            continue

        weights = _compute_weights(record, now)
        if not weights:
            continue

        w_rec, w_diff, delta_speed = weights
        p_ui = w_rec * w_diff * (1 + delta_speed)

        user_record = players[record.user.username]
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
        if isinstance(R, complex):
            R = R.real

        raw_scores[user] = {'R': R, 'solved': data['solved']}
        R_max = max(R_max, R.real if isinstance(R_max, complex) else R)

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
    Computes the leaderboard using all completed puzzle records.

    Returns:
        A sorted list of dictionaries:
            {
                'user': username,
                'score': float (0-100),
                'solved': int (count of puzzles solved)
            }
        If no data is available, returns an empty list.
    """
    # Get best completion for each user-puzzle pair from finished_db
    from django.db.models import Min
    
    finished_records = (
        UserSudokuFinished.objects
        .using('finished_db')
        .select_related('user', 'sudoku')
        .values('user', 'sudoku')
        .annotate(best_completion_time=Min('completion_time'))
    )

    if not finished_records.exists():
        return []

    # Get the actual records with best times
    best_records = []
    for record in finished_records:
        best_record = (
            UserSudokuFinished.objects
            .using('finished_db')
            .select_related('user', 'sudoku')
            .filter(
                user=record['user'],
                sudoku=record['sudoku'],
                completion_time=record['best_completion_time']
            )
            .first()
        )
        if best_record:
            best_records.append(best_record)

    now = datetime.now(timezone.utc)
    raw_players = _compute_raw_scores(best_records, now)
    return _convert_to_leaderboard(raw_players)