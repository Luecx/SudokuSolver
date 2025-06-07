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
    Represents a published Sudoku puzzle.

    - Stores the puzzle data (as compressed JSON), the solution, and metadata like title and tags.
    - Maintains aggregate statistics for performance:
        * solves: how many users completed this puzzle
        * sum_time: sum of all completion times (in seconds)
        * sum_ratings: sum of all submitted ratings
        * ratings_count: how many ratings were submitted
    - Averages are calculated from these sums on-demand.
    """

    # --- Metadata ---
    title           = models.CharField(max_length=100)
    created_by      = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="sudokus_created"
    )
    created_at      = models.DateTimeField(default=timezone.now)
    last_attempted  = models.DateTimeField(null=True, blank=True)

    # --- Puzzle data ---
    puzzle          = models.BinaryField(null=True, blank=True)     # Compressed JSON (zlib)
    solution_string = models.TextField(null=True, blank=True)       # Flat 81-character string
    is_public       = models.BooleanField(default=True)
    canonical_hash  = models.CharField(
        max_length=64, unique=True, db_index=True, null=True, blank=True
    )

    # --- Tags ---
    tags = models.ManyToManyField(Tag, blank=True, related_name="sudokus")

    # --- Aggregated statistics ---
    solves          = models.PositiveIntegerField(default=0)        # Total completed
    sum_time        = models.PositiveBigIntegerField(default=0)     # Sum of solve times in seconds
    sum_ratings     = models.PositiveBigIntegerField(default=0)     # Sum of all ratings
    ratings_count   = models.PositiveIntegerField(default=0)        # Number of ratings submitted

    def __str__(self):
        return self.title

    @property
    def average_time(self):
        """
        Returns the average solve time in seconds, or 0 if not solved yet.
        """
        return self.sum_time / self.solves if self.solves else 0

    @property
    def average_rating(self):
        """
        Returns the average rating (1-10), or 0 if no ratings were submitted.
        """
        return self.sum_ratings / self.ratings_count if self.ratings_count else 0


class AbstractUserSudoku(models.Model):
    """
    Abstract base class for user–sudoku relationships,
    shared by both ongoing and completed puzzle models.
    """
    user   = models.ForeignKey(User, on_delete=models.CASCADE)
    sudoku = models.ForeignKey(Sudoku, on_delete=models.CASCADE)
    time   = models.PositiveIntegerField(default=0)  # Time in seconds
    date   = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True


class UserSudokuDone(AbstractUserSudoku):
    """
    Represents a completed Sudoku puzzle by a specific user.
    Stores final state, time spent, and optional rating.
    """
    rating  = models.PositiveSmallIntegerField(null=True, blank=True)
    state   = models.BinaryField(null=True, blank=True)

    # Needed for reverse lookup like sudoku.user_sudoku_done.all()
    sudoku = models.ForeignKey(Sudoku, on_delete=models.CASCADE, related_name='user_sudoku_done')

    class Meta:
        unique_together = ('user', 'sudoku')

    def __str__(self):
        return f"Done: {self.sudoku} by {self.user}"


class UserSudokuOngoing(AbstractUserSudoku):
    """
    Represents an in-progress Sudoku puzzle by a specific user.
    Stores current state and time spent so far.

    - `was_previously_completed` marks whether this ongoing entry is a replay of a completed puzzle.
    - This helps the frontend prevent resubmission of time/rating.
    """
    state = models.BinaryField(null=True, blank=True)
    was_previously_completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'sudoku')

    def __str__(self):
        return f"Ongoing: {self.sudoku} by {self.user}"


class CachedLeaderboardEntry(models.Model):
    """
    Precomputed leaderboard score and rank for each user.
    Updated periodically (e.g., every 2 minutes).
    """
    user   = models.OneToOneField(User, on_delete=models.CASCADE, related_name="leaderboard_cache")
    score  = models.FloatField()
    solved = models.PositiveIntegerField()
    updated_at = models.DateTimeField(auto_now=True)
    rank = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} ({self.score:.2f} pts)"
