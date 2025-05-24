# scripts/create_random_sudokus.py
import random
import string
import json
import zlib
from django.contrib.auth.models import User
from sudoku.models import Sudoku, Tag

def random_title():
    # Better generated names using syllable-like patterns
    syllables = ['ka', 'zu', 'mi', 'ra', 'lo', 'ti', 'ne', 'sa', 'vo', 'xi']
    return ''.join(random.choices(syllables, k=random.randint(2, 4))).capitalize()

def random_puzzle_data():
    # Dummy 9x9 puzzle data
    puzzle = {
        "board": [[random.randint(0, 9) for _ in range(9)] for _ in range(9)],
        "rules": {"standard": True}
    }
    return zlib.compress(json.dumps(puzzle).encode("utf-8"))

def run():
    users = User.objects.all()
    tags = list(Tag.objects.all())
    count = 0
    for user in users:
        sudoku = Sudoku.objects.create(
            title=random_title(),
            created_by=user,
            puzzle=random_puzzle_data(),
            is_public=True,
            attempts=random.randint(1, 100),
        )
        sudoku.solves = random.randint(0, sudoku.attempts)
        if sudoku.solves > 0:
            times = [random.randint(30, 600) for _ in range(sudoku.solves)]
            sudoku.total_time = sum(times)
            sudoku.average_time = sudoku.total_time / sudoku.solves
        else:
            sudoku.total_time = 0
            sudoku.average_time = 0.0

        sudoku.ratings_count = random.randint(0, 40)
        sudoku.average_rating = round(random.uniform(1.5, 5.0), 2) if sudoku.ratings_count > 0 else 0.0
        sudoku.save()

        # Random tags
        for tag in random.sample(tags, k=random.randint(0, min(3, len(tags)))):
            sudoku.tags.add(tag)

        count += 1

    print(f"✔️ Created {count} random Sudoku puzzles.")
