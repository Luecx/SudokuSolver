from django.db.models import F, FloatField, ExpressionWrapper
from django.db.models.functions import NullIf
from django.core.paginator import Paginator
from django.shortcuts import render
from ..models import Sudoku, Tag

SORT_FIELDS = {
    "title": "title",
    "creator": "created_by__username",
    "solves": "solves",
    "rating": "avg_rating_db",
    "time": "avg_time_db",
}

def puzzles_view(request):
    query = request.GET.get("q", "").strip()
    tag_names = request.GET.getlist("tags")
    sort_by = request.GET.get("sort_by", "title")
    sort_order = request.GET.get("sort_order", "asc")

    # Safely map sort fields
    sort_field = SORT_FIELDS.get(sort_by, "title")
    if sort_order == "desc":
        sort_field = f"-{sort_field}"

    sudokus = (
        Sudoku.objects
        .filter(is_public=True)
        .select_related("created_by")
        .prefetch_related("tags")
        .annotate(
            avg_rating_db=ExpressionWrapper(
                F("sum_ratings") / NullIf(F("ratings_count"), 0),
                output_field=FloatField()
            ),
            avg_time_db=ExpressionWrapper(
                F("sum_time") / NullIf(F("solves"), 0),
                output_field=FloatField()
            )
        )
    )

    if query:
        sudokus = sudokus.filter(title__icontains=query)

    if tag_names:
        sudokus = sudokus.filter(tags__name__in=tag_names).distinct()

    sudokus = sudokus.order_by(sort_field)

    paginator = Paginator(sudokus, 50)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    # Add tag_names for each puzzle
    for s in page_obj:
        s.tag_names = [tag.name for tag in s.tags.all()]

    all_tags = Tag.objects.all().order_by("name")

    return render(request, "sudoku/puzzles.html", {
        "page_obj": page_obj,
        "query": query,
        "selected_tags": tag_names,
        "all_tags": all_tags,
        "current_sort_by": sort_by,
        "current_sort_order": sort_order,
    })
