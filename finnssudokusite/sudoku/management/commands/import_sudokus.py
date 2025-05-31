import os
import json
import zlib

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction

from sudoku.models import Sudoku


class Command(BaseCommand):
    help = "Import Sudoku JSON files (raw puzzle data) from a folder, assigning them to a given user."

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username of the puzzle creator")
        parser.add_argument("folder", type=str, help="Folder containing Sudoku JSON files")

    def handle(self, *args, **options):
        username = options["username"]
        folder = options["folder"]

        if not os.path.isdir(folder):
            raise CommandError(f"Invalid folder: {folder}")

        user = User.objects.filter(username=username).first()
        if not user:
            raise CommandError(f"User '{username}' does not exist.")

        count_success = 0
        count_failed = 0

        for root, _, files in os.walk(folder):
            for filename in files:
                if not filename.endswith(".json"):
                    continue

                path = os.path.join(root, filename)
                title = os.path.splitext(filename)[0]

                try:
                    with open(path, "r", encoding="utf-8") as f:
                        puzzle_json = json.load(f)
                    self.import_file(puzzle_json, title, user)
                    self.stdout.write(self.style.SUCCESS(f"[{filename}] Imported."))
                    count_success += 1
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"[{filename}] Failed: {e}"))
                    count_failed += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Imported {count_success} files. Failed: {count_failed}."
        ))

    @transaction.atomic
    def import_file(self, puzzle_json, title, user):
        compressed = zlib.compress(json.dumps(puzzle_json).encode("utf-8"))
        dummy_solution = ",".join(["1"] * 81)

        Sudoku.objects.create(
            title=title,
            created_by=user,
            created_at=timezone.now(),
            puzzle=compressed,
            solution_string=dummy_solution,
            is_public=True,
        )
