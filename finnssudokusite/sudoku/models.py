from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Sudoku(models.Model):
    title = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sudokus_created")

    # Sudoku content
    puzzle_string = models.TextField(default='0'*81)
    solution_string = models.TextField(default='0'*81)
    difficulty = models.CharField(max_length=50, blank=True)
    is_public = models.BooleanField(default=True)

    # Tags (for filtering)
    tags = models.ManyToManyField(Tag, blank=True, related_name="sudokus")

    # Stats (aggregated from UserSudokuStats)
    attempts = models.PositiveIntegerField(default=0)
    solves = models.PositiveIntegerField(default=0)
    total_time = models.PositiveIntegerField(default=0)
    average_time = models.FloatField(default=0.0)
    average_rating = models.FloatField(default=0.0)
    ratings_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)
    last_attempted = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class UserSudokuStats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sudoku_stats")
    sudoku = models.ForeignKey(Sudoku, on_delete=models.CASCADE, related_name="user_stats")

    # Performance
    attempts = models.PositiveIntegerField(default=0)
    best_time = models.PositiveIntegerField(default=0)  # in seconds; 0 = not solved
    last_time = models.PositiveIntegerField(default=0)  # time for most recent solve/attempt

    # Timestamps
    first_attempt = models.DateTimeField(null=True, blank=True)
    last_attempt = models.DateTimeField(null=True, blank=True)
    date_solved = models.DateTimeField(null=True, blank=True)

    # Feedback
    rating = models.PositiveSmallIntegerField(null=True, blank=True)  # 1–5 stars
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ('user', 'sudoku')

    @property
    def solved(self):
        return self.best_time > 0
