from django.core.paginator import Paginator
from django.shortcuts import render
from django.contrib.auth.models import User
from ..models import CachedLeaderboardEntry

SORT_MAP = {
    "rank": "rank",
    "username": "user__username",
    "score": "score",  # raw score — normalized for display only
    "solved": "solved",
}

def leaderboard(request):
    query      = request.GET.get("q", "").strip()
    sort_by    = request.GET.get("sort_by", "rank")
    sort_order = request.GET.get("sort_order", "asc")
    page_num   = request.GET.get("page", 1)

    # Get global top 3 (by stored rank)
    top_3 = list(
        CachedLeaderboardEntry.objects
        .select_related("user")
        .order_by("rank")[:3]
    )
    top_3_max = max((entry.score for entry in top_3), default=1e-8)
    for entry in top_3:
        entry.normalized_score = round((entry.score / top_3_max) * 10000, 2) if top_3_max > 0 else 0.0

    # Now build queryable base (may filter or sort later)
    entries = CachedLeaderboardEntry.objects.select_related("user")

    if query:
        entries = entries.filter(user__username__icontains=query)

    # Apply sorting
    order_field = SORT_MAP.get(sort_by, "rank")
    if sort_order == "desc":
        order_field = f"-{order_field}"
    entries = entries.order_by(order_field)

    # Normalize score for display
    entry_list = list(entries)
    max_score = max((entry.score for entry in entry_list), default=1e-8)
    for entry in entry_list:
        entry.normalized_score = round((entry.score / max_score) * 10000, 2) if max_score > 0 else 0.0

    # Paginate
    paginator = Paginator(entry_list, 25)
    page_obj = paginator.get_page(page_num)

    return render(request, "sudoku/leaderboard/leaderboard.html", {
        "page_obj": page_obj,
        "query": query,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "top_3": top_3,  # Always global best 3
    })
