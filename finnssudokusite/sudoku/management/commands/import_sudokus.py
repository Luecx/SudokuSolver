import os
import json
import zlib
import subprocess

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction

from sudoku.models import Sudoku
from sudoku.models import Tag


class Command(BaseCommand):
    help = "Import Sudoku JSON files from a folder, assign them to a user, and compute solutions via external solver."

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username of the puzzle creator")
        parser.add_argument("folder", type=str, help="Folder containing Sudoku JSON files")
        parser.add_argument("--solver", required=True, help="Path to compiled Sudoku solver executable")

    def handle(self, *args, **options):
        username = options["username"]
        folder = options["folder"]
        solver_path = options["solver"]

        if not os.path.isfile(solver_path) or not os.access(solver_path, os.X_OK):
            raise CommandError(f"Solver '{solver_path}' does not exist or is not executable.")

        if not os.path.isdir(folder):
            raise CommandError(f"Invalid folder: {folder}")

        user = User.objects.filter(username=username).first()
        if not user:
            raise CommandError(f"User '{username}' does not exist.")

        count_success = 0
        count_skipped = 0

        for root, _, files in os.walk(folder):
            for filename in files:
                if not filename.endswith(".json"):
                    continue

                path = os.path.join(root, filename)
                title = os.path.splitext(filename)[0]

                try:
                    solution = self.get_solution(solver_path, path)
                    if solution is None:
                        self.stdout.write(self.style.WARNING(f"[{filename}] Skipped — not uniquely solvable."))
                        count_skipped += 1
                        continue

                    with open(path, "r", encoding="utf-8") as f:
                        puzzle_json = json.load(f)

                    self.import_file(puzzle_json, title, user, solution)
                    self.stdout.write(self.style.SUCCESS(f"[{filename}] Imported."))
                    count_success += 1

                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"[{filename}] Failed: {e}"))
                    count_skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Imported {count_success} files. Skipped: {count_skipped}."
        ))

    def get_solution(self, solver_path, json_path):
        try:
            result = subprocess.run(
                [solver_path, "solve", json_path, "2", "1000000"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=30
            )
        except subprocess.TimeoutExpired:
            return None

        if result.returncode != 0:
            return None

        output = result.stdout
        if (
                "interrupted_by_node_limit=true" in output
                or "interrupted_by_solution_limit=true" in output
        ):
            return None

        solutions = [
            line[len("[SOLUTION]"):].strip()
            for line in output.splitlines()
            if line.startswith("[SOLUTION]")
        ]

        return solutions[0] if len(solutions) == 1 else None

    @transaction.atomic
    def import_file(self, puzzle_json, title, user, solution_string):
        tags = []
        for rule in puzzle_json['rules']:
            if 'type' in rule and rule['type']:
                tags.append(rule['type'])

        compressed = zlib.compress(json.dumps(puzzle_json).encode("utf-8"))
        sudoku = Sudoku.objects.create(
            title=title,
            created_by=user,
            created_at=timezone.now(),
            puzzle=compressed,
            solution_string=solution_string,
            is_public=True,
        )

        tag_objects = []
        for tag_name in tags:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            tag_objects.append(tag)
        sudoku.tags.set(tag_objects)
        