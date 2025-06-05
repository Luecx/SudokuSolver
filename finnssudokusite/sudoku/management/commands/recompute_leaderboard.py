from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.models import User
from sudoku.models import CachedLeaderboardEntry, UserSudokuDone
from sudoku.util.leaderboard import (
    compute_raw_score,
    compute_volume_weight,
)

class Command(BaseCommand):
    help = "Recomputes the leaderboard score and solved count for all users."

    def handle(self, *args, **options):
        entries = []

        self.stdout.write("Updating leaderboard entries...")

        for user in User.objects.all():
            stats = (
                UserSudokuDone.objects
                .select_related('sudoku')
                .filter(user=user, time__gt=0)
                .order_by('-date')[:100]
            )

            scores = [compute_raw_score(stat) for stat in stats if compute_raw_score(stat)]
            scores = [s for s in scores if s > 0]

            if not scores:
                final_score = 0.0
            else:
                avg_score = sum(scores) / len(scores)
                volume = compute_volume_weight(len(scores))
                final_score = avg_score * volume

            entries.append((user, final_score, len(scores)))

        with transaction.atomic():
            for user, score, solved in entries:
                CachedLeaderboardEntry.objects.update_or_create(
                    user=user,
                    defaults={"score": score, "solved": solved}
                )

        self.stdout.write(f"Updated {len(entries)} leaderboard entries.")
