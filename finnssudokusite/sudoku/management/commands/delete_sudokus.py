import re
from django.core.management.base import BaseCommand
from sudoku.models import Sudoku


class Command(BaseCommand):
    help = "Delete Sudoku puzzles by title using regex filters."

    def add_arguments(self, parser):
        parser.add_argument("--match-regex", type=str, required=True,
                            help="Regex pattern to match puzzle titles to delete.")
        parser.add_argument("--exclude-regex", type=str,
                            help="Regex pattern to exclude puzzle titles from deletion.")
        parser.add_argument("--dry-run", action="store_true",
                            help="Preview puzzles that would be deleted without actually deleting them.")

    def handle(self, *args, **options):
        match_pattern = options["match_regex"]
        exclude_pattern = options["exclude_regex"]
        dry_run = options["dry_run"]

        try:
            match_re = re.compile(match_pattern)
        except re.error as e:
            self.stderr.write(f"❌ Invalid match regex: {e}")
            return

        exclude_re = None
        if exclude_pattern:
            try:
                exclude_re = re.compile(exclude_pattern)
            except re.error as e:
                self.stderr.write(f"❌ Invalid exclude regex: {e}")
                return

        all_sudokus = Sudoku.objects.all()
        to_delete = []

        for sudoku in all_sudokus:
            if match_re.search(sudoku.title):
                if exclude_re and exclude_re.search(sudoku.title):
                    continue
                to_delete.append(sudoku)

        if dry_run:
            self.stdout.write(f"[DRY RUN] {len(to_delete)} Sudoku puzzles would be deleted:")
            for s in to_delete:
                self.stdout.write(f" - {s.title}")
        else:
            titles = [s.title for s in to_delete]
            Sudoku.objects.filter(title__in=titles).delete()
            self.stdout.write(f"✅ Deleted {len(titles)} Sudoku puzzles.")
