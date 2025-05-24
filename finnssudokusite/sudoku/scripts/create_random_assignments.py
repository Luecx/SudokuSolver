# scripts/assign_sudoku_progress.py
import random
from django.contrib.auth.models import User
from django.utils import timezone
from sudoku.models import Sudoku, UserSudokuDone, UserSudokuOngoing

def run():
    users = list(User.objects.all())
    sudokus = list(Sudoku.objects.all())

    done_count = 0
    ongoing_count = 0

    for user in users:
        # Random finished puzzles
        for sudoku in random.sample(sudokus, k=random.randint(1, 4)):
            if not UserSudokuDone.objects.filter(user=user, sudoku=sudoku).exists():
                UserSudokuDone.objects.create(
                    user=user,
                    sudoku=sudoku,
                    time=random.randint(30, 600),
                    date=timezone.now(),
                    rating=random.choice([None] + list(range(1, 6)))
                )
                done_count += 1

        # Random ongoing puzzles
        for sudoku in random.sample(sudokus, k=random.randint(0, 2)):
            if not UserSudokuOngoing.objects.filter(user=user, sudoku=sudoku).exists():
                UserSudokuOngoing.objects.create(
                    user=user,
                    sudoku=sudoku,
                    time=random.randint(10, 300),
                    date=timezone.now(),
                    state=b"dummy_state_bytes"
                )
                ongoing_count += 1

    print(f"✔️ Assigned {done_count} done and {ongoing_count} ongoing Sudoku entries.")
