from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Tag(models.Model):
    """
    Tag model.
    Each tag represents a category or feature of a Sudoku (e.g., 'Diagonal', 'Thermo', 'Killer').
    Related to Sudoku via a Many-to-Many relationship.
    """
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Sudoku(models.Model):
    """
    Sudoku puzzle model.

    - puzzle: Stores zipped JSON containing the puzzle definition.
    - solution_string: Stores the solution as an 81-character string (row-wise).
    - is_public: Whether the Sudoku is visible to everyone.
    - tags: Types/features of this Sudoku (linked to Tag model).
    - Stats: Auto-updated from user stats.
    - created_by: Optional link to the creator (user).
    """

    # Metadata
    title          = models.CharField(max_length=100)
    created_by     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="sudokus_created")
    created_at     = models.DateTimeField(default=timezone.now)
    last_attempted = models.DateTimeField(null=True, blank=True)

    # Puzzle content
    puzzle          = models.BinaryField(null=True, blank=True)
    is_public       = models.BooleanField(default=True)
    # field to support uniqueness checking
    canonical_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        null=True,
        blank=True
    )

    # Tags (types/features)
    tags = models.ManyToManyField(Tag, blank=True, related_name="sudokus")  # related_name = access all sudokus of a tag

    # Aggregate stats
    attempts       = models.PositiveIntegerField(default=0)
    solves         = models.PositiveIntegerField(default=0)
    total_time     = models.PositiveIntegerField(default=0)  # Sum of all solve times (in seconds)
    average_time   = models.FloatField(default=0.0)          # Average time to solve (in seconds)
    average_rating = models.FloatField(default=0.0)          # Average user rating (1-5 stars)
    ratings_count  = models.PositiveIntegerField(default=0)  # Number of ratings

    def __str__(self):
        return self.title


class AbstractUserSudoku(models.Model):
    user   = models.ForeignKey(User, on_delete=models.CASCADE)
    sudoku = models.ForeignKey(Sudoku, on_delete=models.CASCADE)
    time   = models.PositiveIntegerField(default=0)
    date   = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

class UserSudokuDone(AbstractUserSudoku):
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    state = models.BinaryField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'sudoku')

class UserSudokuOngoing(AbstractUserSudoku):
    state = models.BinaryField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'sudoku')


"""
NOTES:
- related_name="..." allows you to do things like:
    tag_instance.sudokus.all()          # All sudokus with a specific tag
    user_instance.sudoku_stats.all()    # All sudoku stats for a user
    sudoku_instance.user_stats.all()    # All user stats for a sudoku

- puzzle field is now a BinaryField to store zipped JSON (use Python's zlib + json libs).
- difficulty can be derived later (e.g., via attempts/solves).
"""
