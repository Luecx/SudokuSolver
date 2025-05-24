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

class UserSudokuOngoing(models.Model):
    """
    Tracks ongoing Sudoku attempts with saved progress.
    """
    # Store IDs instead of foreign keys for cross-database compatibility
    user_id = models.PositiveIntegerField()  # Reference to User.id
    sudoku_id = models.PositiveIntegerField()  # Reference to Sudoku.id

    # Performance
    attempts  = models.PositiveIntegerField(default=0)
    current_time = models.PositiveIntegerField(default=0)
    total_time   = models.PositiveIntegerField(default=0)

    # Timestamps
    first_attempt = models.DateTimeField(null=True, blank=True)
    last_attempt  = models.DateTimeField(auto_now=True)
    started_at    = models.DateTimeField(auto_now_add=True)
    
    # Saved game state
    saved_board_state = models.BinaryField(null=True, blank=True)
    completion_percentage = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ('user_id', 'sudoku_id')

    def __str__(self):
        return f"User {self.user_id} - Sudoku {self.sudoku_id} (Ongoing)"


class UserSudokuFinished(models.Model):
    """
    Tracks completed Sudoku puzzles.
    """
    # Store IDs instead of foreign keys
    user_id = models.PositiveIntegerField()
    sudoku_id = models.PositiveIntegerField()

    saved_board_state = models.BinaryField(null=True, blank=True)

    # Performance
    attempts_to_solve = models.PositiveIntegerField(default=1)
    completion_time   = models.PositiveIntegerField()
    total_time_spent  = models.PositiveIntegerField(default=0)

    # Timestamps
    started_at   = models.DateTimeField()
    completed_at = models.DateTimeField(auto_now_add=True)

    # User feedback
    rating  = models.PositiveSmallIntegerField(null=True, blank=True, choices=[
        (1, '1 Star'), (2, '2 Stars'), (3, '3 Stars'), (4, '4 Stars'), (5, '5 Stars'),
    ])
    comment = models.TextField(blank=True)

    class Meta:
        ordering = ['-completed_at']
        indexes = [
            models.Index(fields=['user_id', 'completed_at']),
            models.Index(fields=['sudoku_id', 'completion_time']),
        ]

    def __str__(self):
        return f"User {self.user_id} - Sudoku {self.sudoku_id} (Completed {self.completed_at.date()})"

    @property
    def completion_time_formatted(self):
        """Returns completion time in MM:SS format."""
        minutes = self.completion_time // 60
        seconds = self.completion_time % 60
        return f"{minutes:02d}:{seconds:02d}"
    
"""
NOTES:
- related_name="..." allows you to do things like:
    tag_instance.sudokus.all()          # All sudokus with a specific tag
    user_instance.sudoku_stats.all()    # All sudoku stats for a user
    sudoku_instance.user_stats.all()    # All user stats for a sudoku

- puzzle field is now a BinaryField to store zipped JSON (use Python's zlib + json libs).
- difficulty can be derived later (e.g., via attempts/solves).
"""
