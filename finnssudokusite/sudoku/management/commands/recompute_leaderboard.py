from django.core.management.base import BaseCommand
from sudoku.util.leaderboard import update_all_leaderboard_entries

class Command(BaseCommand):
    help = "Recomputes the leaderboard score and solved count for all users."

    def handle(self, *args, **options):
        self.stdout.write("Recomputing all leaderboard entries using last 100 solves per user...")
        update_all_leaderboard_entries()
        self.stdout.write("Leaderboard successfully updated.")
