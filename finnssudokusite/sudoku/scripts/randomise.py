import random
import string
from sudoku.models import Sudoku

def random_title():
    return "Puzzle {}-{}".format(random.randint(100, 999), ''.join(random.choices(string.ascii_uppercase, k=3)))

def run():
    sudokus = Sudoku.objects.all()
    count = 0
    for s in sudokus:
        s.title = random_title()
        s.attempts = random.randint(1, 100)
        s.solves = random.randint(0, s.attempts)

        if s.solves > 0:
            times = [random.randint(20, 600) for _ in range(s.solves)]
            s.total_time = sum(times)
            s.average_time = s.total_time / s.solves
        else:
            s.total_time = 0
            s.average_time = 0.0

        s.ratings_count = random.randint(0, 50)
        s.average_rating = round(random.uniform(1.0, 5.0), 2) if s.ratings_count > 0 else 0.0

        s.save()
        count += 1

    print("✔️ Randomised {} Sudoku entries.".format(count))
