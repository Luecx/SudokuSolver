from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User

from sudoku.models import CachedLeaderboardEntry, UserSudokuDone
from sudoku.util.leaderboard import (
    compute_raw_score,
    compute_recency_weight,
    compute_geometric_mean,
    compute_volume_weight,
)

import math

class Command(BaseCommand):
    help = "Recomputes the leaderboard score and solved count for all users."

    def handle(self, *args, **options):
        now = timezone.now()
        entries = []
        users = User.objects.all()

        self.stdout.write("Updating leaderboard entries...")

        for user in users:
            stats = (
                UserSudokuDone.objects
                .select_related('sudoku')
                .filter(user=user, time__gt=0)
            )

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

            entries.append((user, final_score, count))

        with transaction.atomic():
            for user, score, solved in entries:
                CachedLeaderboardEntry.objects.update_or_create(
                    user=user,
                    defaults={
                        "score": score,
                        "solved": solved
                    }
                )

        self.stdout.write(f"Updated {len(entries)} leaderboard entries.")
