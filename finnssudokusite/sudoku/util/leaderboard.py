"""
Leaderboard computation using the Sudoku Power Index (SPI).

This module computes user scores and rankings based on:
- Per-puzzle speed vs average time
- Recency (exponential decay, α = 0.95)
- Weighted geometric mean of performance
- Volume correction to down-weight small sample sizes
- Final normalization to 0–100 SPI scale
"""

import math
from collections import defaultdict
from datetime import datetime
from django.utils import timezone
from django.utils.timezone import make_aware, is_naive
from django.contrib.auth.models import User
from ..models import UserSudokuDone, CachedLeaderboardEntry

# === Constants === #
ALPHA = 0.95  # Recency decay base
LAMBDA = 0.2  # Volume weight sharpness
EPS = 1e-8    # Avoid divide-by-zero and log(0)


# === Scoring Functions === #

def compute_raw_score(stat):
    """
    Computes S_{u,s} = avg_t * (avg_t / user_t)
    Independent of recency.
    """
    puzzle = stat.sudoku
    if not puzzle or not puzzle.average_time or not stat.time:
        return None

    avg_t = max(puzzle.average_time, EPS)
    user_t = max(stat.time, EPS)
    return avg_t * (avg_t / user_t)


def compute_recency_weight(stat, now):
    """
    Computes w(Δ_s) = α^Δ for a given solve.
    """
    if not stat.date:
        return None

    solve_time = stat.date
    if is_naive(solve_time):
        solve_time = make_aware(solve_time, timezone=timezone.utc)
    delta_days = (now - solve_time).days
    return ALPHA ** delta_days


def collect_weighted_logs(stats, now):
    """
    Gathers log(S_{u,s}) × weight and total weight per user.
    Returns: dict[user] = { 'sum_log': float, 'sum_weight': float, 'count': int }
    """
    users = defaultdict(lambda: {'sum_log': 0.0, 'sum_weight': 0.0, 'count': 0})

    for stat in stats:
        score = compute_raw_score(stat)
        weight = compute_recency_weight(stat, now)

        if score is None or weight is None or score <= 0:
            continue

        user = stat.user.username
        users[user]['sum_log'] += weight * math.log(score)
        users[user]['sum_weight'] += weight
        users[user]['count'] += 1

    return users


def compute_geometric_mean(sum_log, sum_weight):
    """
    R_u = exp(sum(w_i * log(S_i)) / sum(w_i))
    """
    if sum_weight <= 0:
        return 0.0
    return math.exp(sum_log / sum_weight)


def compute_volume_weight(n_solves):
    """
    V_u = 1 - exp(-λ * N)
    """
    return 1.0 - math.exp(-LAMBDA * n_solves)


def compute_adjusted_rating(user_data):
    """
    Final adjusted rating: R'_u = R_u × V_u
    """
    R_u = compute_geometric_mean(user_data['sum_log'], user_data['sum_weight'])
    V_u = compute_volume_weight(user_data['count'])
    return R_u * V_u


# === Leaderboard Generation === #

def build_leaderboard(user_data_map):
    """
    Normalize adjusted scores to max = 100 and return sorted leaderboard.
    """
    scores = {
        user: compute_adjusted_rating(data)
        for user, data in user_data_map.items()
    }

    R_max = max(scores.values(), default=0.0)
    leaderboard = []

    for user, R_u_primed in scores.items():
        spi = 100.0 * R_u_primed / R_max if R_max > 0 else 0.0
        leaderboard.append({
            'user': user,
            'score': round(spi, 2),
            'solved': user_data_map[user]['count']
        })

    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    return leaderboard


# === Entry Point === #

def compute_leaderboard_scores():
    """
    Computes the Sudoku Power Index leaderboard.

    Returns:
        A sorted list of dicts with:
        {
            'user': str,
            'score': float (0–100),
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
    user_data = collect_weighted_logs(stats, now)
    return build_leaderboard(user_data)

def update_leaderboard_entry(user):
    """
    Recomputes and updates a single user's leaderboard score and solve count.
    """
    stats = (
        UserSudokuDone.objects
        .select_related('sudoku')
        .filter(user=user, time__gt=0)
    )

    now = timezone.now()
    sum_log = 0.0
    sum_weight = 0.0
    count = 0

    for stat in stats:
        score = compute_raw_score(stat)
        weight = compute_recency_weight(stat, now)
        if score is None or weight is None or score <= 0:
            continue
        sum_log += weight * math.log(score)
        sum_weight += weight
        count += 1

    if count == 0:
        adjusted = 0.0
    else:
        R_u = compute_geometric_mean(sum_log, sum_weight)
        V_u = compute_volume_weight(count)
        adjusted = R_u * V_u

    CachedLeaderboardEntry.objects.update_or_create(
        user=user,
        defaults={
            "score": adjusted,
            "solved": count
        }
    )

def update_all_leaderboard_entries():
    now = timezone.now()
    for user in User.objects.all():
        stats = UserSudokuDone.objects.select_related("sudoku").filter(user=user, time__gt=0)

        sum_log = 0.0
        sum_weight = 0.0
        count = 0

        for stat in stats:
            score = compute_raw_score(stat)
            weight = compute_recency_weight(stat, now)
            if score is None or weight is None or score <= 0:
                continue
            sum_log += weight * math.log(score)
            sum_weight += weight
            count += 1

        if count == 0:
            final_score = 0.0
        else:
            R_u = compute_geometric_mean(sum_log, sum_weight)
            V_u = compute_volume_weight(count)
            final_score = R_u * V_u

        CachedLeaderboardEntry.objects.update_or_create(
            user=user,
            defaults={
                "score": final_score,
                "solved": count
            }
        )
