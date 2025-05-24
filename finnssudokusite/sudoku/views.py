from django.shortcuts import render, redirect
from django.contrib.auth import login, update_session_auth_hash, get_user_model
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.decorators import login_required
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.timezone import make_aware, is_naive
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db import models
from django.db.models import Count
from django.db.models import Q
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_POST
from datetime import datetime, timezone
from .models import Sudoku, UserSudokuOngoing, UserSudokuFinished, Tag
from .forms import UserRegisterForm
from .util.leaderboard import compute_leaderboard_scores
import json
import zlib
# === General Views === #


def index(request):
    """Main landing page showing all Sudoku puzzles and user stats if logged in."""
    # Remove the Count annotations since we can't count across databases with IDs
    sudokus = Sudoku.objects.all()
    
    user_stats = {}
    if request.user.is_authenticated:
        # Get ongoing puzzles from ongoing_db
        ongoing_stats = UserSudokuOngoing.objects.using('ongoing_db').filter(user_id=request.user.id)
        ongoing_dict = {us.sudoku_id: 'ongoing' for us in ongoing_stats}
        
        # Get completed puzzles from finished_db - get best time for each puzzle
        finished_stats = UserSudokuFinished.objects.using('finished_db').filter(
            user_id=request.user.id
        ).values('sudoku_id').annotate(
            best_time=models.Min('completion_time')
        )
        finished_dict = {us['sudoku_id']: us['best_time'] for us in finished_stats}
        
        # Combine the stats
        user_stats = {**ongoing_dict, **finished_dict}

    return render(request, 'sudoku/index.html', {
        'sudokus': sudokus,
        'user_stats': user_stats,
    })


def game(request):
    """Renders the general Sudoku game page."""
    return render(request, "sudoku/game.html")


def puzzles_view(request):
    query = request.GET.get("q", "").strip()
    tag_names = request.GET.getlist("tags")  # List of selected tags

    sudokus = Sudoku.objects.filter(is_public=True).select_related(
        "created_by").prefetch_related("tags")

    if query:
        sudokus = sudokus.filter(title__icontains=query)

    if tag_names:
        sudokus = sudokus.filter(tags__name__in=tag_names).distinct()

    paginator = Paginator(sudokus, 50)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    for sudoku in page_obj:
        sudoku.tag_names = [tag.name for tag in sudoku.tags.all()]

    all_tags = Tag.objects.all()
    return render(request, 'sudoku/puzzles.html', {
        "page_obj": page_obj,
        "query": query,
        "selected_tags": tag_names,
        "all_tags": all_tags,
    })


def leaderboard(request):
    """Displays the leaderboard."""
    leaderboard_data = compute_leaderboard_scores()
    return render(request, "sudoku/leaderboard.html", {
        "leaderboard": leaderboard_data
    })


def creator(request):
    """Sudoku puzzle creator view."""
    return render(request, "sudoku/creator/creator.html")


@login_required
@require_POST
def save_sudoku(request):
    """Handles saving a new Sudoku puzzle."""
    try:
        data = json.loads(request.body)
        title = data.get("title", "Untitled Sudoku")
        board_object = data.get("board", {})
        tag_names = data.get("tags", [])

        if not board_object:
            return JsonResponse({"status": "error", "message": "No board data provided."}, status=400)

        # Compress board data
        board_json = json.dumps(board_object)
        board_zip = zlib.compress(board_json.encode('utf-8'))

        # Create Sudoku
        sudoku = Sudoku.objects.create(
            title=title,
            puzzle=board_zip,
            created_by=request.user,
            is_public=True,
        )

        # Attach tags (create if missing)
        for tag_name in tag_names:
            tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
            sudoku.tags.add(tag_obj)

        return JsonResponse({"status": "success", "sudoku_id": sudoku.id})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


def play_sudoku(request, sudoku_id):
    """Play a specific Sudoku puzzle."""
    try:
        sudoku = Sudoku.objects.get(pk=sudoku_id)
    except Sudoku.DoesNotExist:
        raise Http404("Sudoku not found.")

    try:
        # Decompress the puzzle JSON
        puzzle_data = json.loads(
            zlib.decompress(sudoku.puzzle).decode('utf-8'))
    except Exception:
        raise Http404("Invalid puzzle data.")

    return render(request, "sudoku/game.html", {
        "puzzle_data_json": json.dumps({
            "id": sudoku.id,
            "title": sudoku.title,
            "board": puzzle_data,
        }),
    })

# === Profile Views === #

@login_required
def profile(request):
    """Authenticated user's profile page."""
    if request.method == 'POST':
        form = PasswordChangeForm(user=request.user, data=request.POST)
        if form.is_valid():
            form.save()
            update_session_auth_hash(request, form.user)
    else:
        form = PasswordChangeForm(user=request.user)

  # Query ongoing puzzles from ongoing_db
    ongoing_puzzles = UserSudokuOngoing.objects.using('ongoing_db').filter(
        user_id=request.user.id
    )
    
    # Get sudoku IDs and fetch the sudokus separately from default database
    ongoing_sudoku_ids = [puzzle.sudoku_id for puzzle in ongoing_puzzles]
    ongoing_sudokus = {s.id: s for s in Sudoku.objects.filter(id__in=ongoing_sudoku_ids).select_related('created_by').prefetch_related('tags')}
    
    # Filter out puzzles where sudoku doesn't exist and attach sudoku objects
    valid_ongoing_puzzles = []
    for puzzle in ongoing_puzzles:
        sudoku = ongoing_sudokus.get(puzzle.sudoku_id)
        if sudoku:  # Only include if sudoku exists
            puzzle.sudoku = sudoku
            valid_ongoing_puzzles.append(puzzle)
        else:
            print(f"Warning: Sudoku {puzzle.sudoku_id} not found for ongoing puzzle")
    
    # Query completed puzzles from finished_db (without cross-database joins)
    completed_puzzles = UserSudokuFinished.objects.using('finished_db').filter(
        user_id=request.user.id  # Changed from user=request.user
    ).order_by('-completed_at')
    
    # Get sudoku IDs and fetch the sudokus separately from default database
    completed_sudoku_ids = [puzzle.sudoku_id for puzzle in completed_puzzles]
    completed_sudokus = {s.id: s for s in Sudoku.objects.filter(id__in=completed_sudoku_ids).prefetch_related('tags')}
    
    # Attach sudoku objects to completed puzzles
    for puzzle in completed_puzzles:
        puzzle.sudoku = completed_sudokus.get(puzzle.sudoku_id)

    created_puzzles = Sudoku.objects.filter(created_by=request.user)

    return render(request, 'sudoku/profile/profile.html', {
        'form': form,
        'ongoing_puzzles': valid_ongoing_puzzles,  # Use filtered list
        'completed_puzzles': completed_puzzles,  # Change this line
        'created_puzzles': created_puzzles.order_by("-id"),
    })


def user_profile(request, username):
    """Public profile view for another user."""
    if request.user.username == username:
        return redirect('profile')

    User = get_user_model()
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        raise Http404("User does not exist.")

    # Query ongoing puzzles from ongoing_db (without cross-database joins)
    ongoing_puzzles = UserSudokuOngoing.objects.using('ongoing_db').filter(
        user_id=target_user.id  # Changed from user=target_user
    )
    
    # Get sudoku IDs and fetch the sudokus separately from default database
    ongoing_sudoku_ids = [puzzle.sudoku_id for puzzle in ongoing_puzzles]
    ongoing_sudokus = {s.id: s for s in Sudoku.objects.filter(id__in=ongoing_sudoku_ids).prefetch_related('tags')}
    
    # Attach sudoku objects to ongoing puzzles
    for puzzle in ongoing_puzzles:
        puzzle.sudoku = ongoing_sudokus.get(puzzle.sudoku_id)
    
    # Query completed puzzles from finished_db (without cross-database joins)
    completed_puzzles = UserSudokuFinished.objects.using('finished_db').filter(
        user_id=target_user.id  # Changed from user=target_user
    ).order_by('-completed_at')
    
    # Get sudoku IDs and fetch the sudokus separately from default database
    completed_sudoku_ids = [puzzle.sudoku_id for puzzle in completed_puzzles]
    completed_sudokus = {s.id: s for s in Sudoku.objects.filter(id__in=completed_sudoku_ids).prefetch_related('tags')}
    
    # Attach sudoku objects to completed puzzles
    for puzzle in completed_puzzles:
        puzzle.sudoku = completed_sudokus.get(puzzle.sudoku_id)
    
    created_puzzles = Sudoku.objects.filter(created_by=target_user)
    all_tags = Tag.objects.order_by("name")

    leaderboard = compute_leaderboard_scores()
    rank, score = None, None
    for i, entry in enumerate(leaderboard):
        if entry['user'] == target_user.username:
            rank = i + 1
            score = entry['score']
            break

    return render(request, 'sudoku/profile/user_profile.html', {
        'target_user': target_user,
        'ongoing_puzzles': ongoing_puzzles,
        'completed_puzzles': completed_puzzles,
        'created_puzzles': created_puzzles.order_by("-id"),
        'all_tags': all_tags,
        'rank': rank,
        'score': score,
        'done_count': completed_puzzles.count(),
        'attempt_count': ongoing_puzzles.count(),
        'last_login': target_user.last_login,
    })

# === Auth Views === #


def register(request):
    """Handles user registration and sends activation email."""
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False
            user.save()

            current_site = get_current_site(request)
            subject = 'Activate your Sudoku account'
            message = render_to_string('sudoku/login/account_activation_email.html', {
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
            })
            send_mail(subject, message, 'noreply@sudoku.com', [user.email])
            return render(request, 'sudoku/login/activation_sent.html')
    else:
        form = UserRegisterForm()

    return render(request, 'sudoku/login/register.html', {'form': form})


def activate(request, uid, token):
    """Verifies activation email and activates the user."""
    try:
        uid = force_str(urlsafe_base64_decode(uid))
        user = get_user_model().objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return render(request, 'sudoku/login/activation_success.html')
    else:
        return render(request, 'sudoku/login/activation_invalid.html')


def game_selection_view(request):
    return render(request, 'sudoku/game_selection.html')
