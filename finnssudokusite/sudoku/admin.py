# sudoku/admin.py

from django.contrib import admin, messages
from django.core.management import call_command
from .models import CachedLeaderboardEntry
from .util.leaderboard import update_all_leaderboard_entries

@admin.register(CachedLeaderboardEntry)
class CachedLeaderboardEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "score", "solved", "updated_at")
    actions = ["recompute_leaderboard", "run_migrate"]

    def recompute_leaderboard(self, request, queryset):
        update_all_leaderboard_entries()
        self.message_user(request, "Leaderboard has been recomputed.", level=messages.SUCCESS)

    recompute_leaderboard.short_description = "Recompute full leaderboard"
