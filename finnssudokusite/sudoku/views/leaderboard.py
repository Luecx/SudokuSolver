from django.core.paginator import Paginator
from django.shortcuts import render
from django.contrib.auth.models import User
from ..models import CachedLeaderboardEntry

SORT_MAP = {
    "rank": "rank",  # will sort by dynamically computed rank
    "username": "user__username",
    "score": "normalized_score",  # also dynamically computed
    "solved": "solved",
}

def leaderboard(request):
    query      = request.GET.get("q", "").strip()
    sort_by    = request.GET.get("sort_by", "rank")
    sort_order = request.GET.get("sort_order", "asc")
    page_num   = request.GET.get("page", 1)

    entries = CachedLeaderboardEntry.objects.select_related("user")

    if query:
        entries = entries.filter(user__username__icontains=query)

    entries = list(entries)

    # Normalize scores
    max_score = max((entry.score for entry in entries), default=1e-8)
    for entry in entries:
        entry.normalized_score = round((entry.score / max_score) * 100, 2) if max_score > 0 else 0.0

    # Assign dynamic rank (always sort by score descending)
    ranked = sorted(entries, key=lambda x: x.normalized_score, reverse=True)
    for idx, entry in enumerate(ranked, start=1):
        entry.rank = idx

    # Sort for current view
    reverse = sort_order == "desc"
    if sort_by == "score":
        entries.sort(key=lambda x: x.normalized_score, reverse=reverse)
    elif sort_by == "username":
        entries.sort(key=lambda x: x.user.username.lower(), reverse=reverse)
    elif sort_by == "solved":
        entries.sort(key=lambda x: x.solved, reverse=reverse)
    elif sort_by == "rank":
        entries.sort(key=lambda x: x.rank, reverse=reverse)

    # Paginate
    paginator = Paginator(entries, 25)
    page_obj = paginator.get_page(page_num)

    return render(request, "sudoku/leaderboard/leaderboard.html", {
        "page_obj": page_obj,
        "query": query,
        "sort_by": sort_by,
        "sort_order": sort_order,
    })
