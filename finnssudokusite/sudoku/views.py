from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, update_session_auth_hash, get_user_model
from django.contrib.auth.forms import PasswordChangeForm, AuthenticationForm, PasswordResetForm, UserCreationForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.decorators import login_required
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.timezone import make_aware, is_naive
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Count
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_POST
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime
from .models import Sudoku, UserSudokuDone, UserSudokuOngoing, Tag
from .forms import UserRegisterForm
from .util.leaderboard import compute_leaderboard_scores
import json
import zlib


# === General Views === #

def index(request):
    """Main landing page showing all Sudoku puzzles and user stats if logged in."""
    sudokus = Sudoku.objects.annotate(
        attempts_count=Count('attempts'),
        solves_count=Count('solves')
    )
    user_stats = {}
    if request.user.is_authenticated:
        stats = UserSudokuDone.objects.filter(user=request.user)
        user_stats = {us.sudoku_id: us.time for us in stats}

    return render(request, 'sudoku/index.html', {
        'sudokus': sudokus,
        'user_stats': user_stats,
    })


def game(request):
    """Renders the general Sudoku game page (without specific puzzle loaded)."""
    return render(request, "sudoku/game.html")



def puzzles_view(request):
    query = request.GET.get("q", "").strip()
    tag_names = request.GET.getlist("tags")

    sudokus = Sudoku.objects.filter(is_public=True).select_related("created_by").prefetch_related("tags")

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

    for entry in leaderboard_data:
        entry["user"] = User.objects.get(username=entry["user"])

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
        board_json = data.get("board")
        solution_str = data.get("solution")
        tag_names = data.get("tags", [])

        # Validate board is a JSON string
        if not isinstance(board_json, str):
            return JsonResponse({"status": "error", "message": "Board must be a JSON string."}, status=400)

        # Validate solution
        if not isinstance(solution_str, str):
            return JsonResponse({"status": "error", "message": "Invalid or missing solution string."}, status=400)

        # Compress the board string
        board_zip = zlib.compress(board_json.encode("utf-8"))

        # Save to database
        sudoku = Sudoku.objects.create(
            title=title,
            puzzle=board_zip,
            solution_string=solution_str,
            created_by=request.user,
            is_public=True,
        )

        # Add tags
        for tag_name in tag_names:
            tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
            sudoku.tags.add(tag_obj)

        return JsonResponse({"status": "success", "sudoku_id": sudoku.id})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


def play_sudoku(request, sudoku_id):
    """Play a specific Sudoku puzzle."""
    sudoku = get_object_or_404(Sudoku, pk=sudoku_id)

    try:
        puzzle_data = zlib.decompress(sudoku.puzzle).decode('utf-8')
    except Exception:
        raise Http404("Invalid puzzle data.")

    return render(request, "sudoku/game.html", {
        "puzzle_data_json": json.dumps({
            "id": sudoku.id,
            "title": sudoku.title,
            "board": puzzle_data,
            "solution": sudoku.solution_string,
        }),
        "page_title": sudoku.title,
        "creator_name": sudoku.created_by.username if sudoku.created_by else "Unknown",
    })

# === Profile Views === #

@login_required
def profile(request):
    """Authenticated user's profile page including created, done, and ongoing puzzles."""
    if request.method == 'POST':
        form = PasswordChangeForm(user=request.user, data=request.POST)
        if form.is_valid():
            form.save()
            update_session_auth_hash(request, form.user)
            return redirect('profile')
    else:
        form = PasswordChangeForm(user=request.user)

    solved_stats = UserSudokuDone.objects.filter(user=request.user, time__gt=0).select_related("sudoku")
    attempted_stats = UserSudokuDone.objects.filter(user=request.user, sudoku__isnull=False).select_related("sudoku")
    created_puzzles = Sudoku.objects.filter(created_by=request.user).select_related("created_by")
    ongoing_stats = UserSudokuOngoing.objects.filter(user=request.user).select_related("sudoku")

    all_tags = Tag.objects.order_by("name")

    return render(request, 'sudoku/profile/profile.html', {
        'form': form,
        'solved_stats': solved_stats.order_by("-date"),
        'attempted_stats': attempted_stats.order_by("-date"),
        'created_puzzles': created_puzzles.order_by("-id"),
        'ongoing_stats': ongoing_stats.order_by("-date"),
        'all_tags': all_tags,
    })


def user_profile(request, username):
    """Other user's public profile with solved and attempted puzzles."""
    target_user = get_object_or_404(User, username=username)

    # All attempted
    attempted_stats = (
        UserSudokuDone.objects
        .filter(user=target_user)
        .select_related("sudoku")
        .order_by("-date")
    )

    # Subset that is done (time > 0)
    solved_stats = attempted_stats.filter(time__gt=0)

    created_puzzles = (
        Sudoku.objects
        .filter(created_by=target_user)
        .order_by("-id")
    )

    context = {
        "target_user": target_user,
        "last_login": target_user.last_login,
        "done_count": solved_stats.count(),
        "attempt_count": attempted_stats.count(),
        "solved_stats": solved_stats,
        "attempted_stats": attempted_stats,
        "created_puzzles": created_puzzles,
    }

    return render(request, "sudoku/profile/profile_detail.html", context)


# === Finished and Ongoing Puzzles === #

@require_POST
def save_puzzle_state(request):
    """Saves the current state of a puzzle or marks it as completed."""
    try:
        # Handle non-authenticated users
        if not request.user.is_authenticated:
            return JsonResponse({
                "status": "no_auth",
                "message": "User not authenticated - use local storage"
            })
        
        data = {}
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            # Handle FormData from sendBeacon
            data_str = request.POST.get('data')
            if data_str:
                data = json.loads(data_str)
            else:
                return JsonResponse({"status": "error", "message": "No data provided"}, status=400)

        sudoku_id = data.get("sudoku_id")
        board_state = data.get("board_state")
        current_time = data.get("time", 0)
        status = data.get("status", "ongoing")  # "ongoing" or "completed"
        rating = data.get("rating", None)
        
        if not sudoku_id:
            return JsonResponse({"status": "error", "message": "Missing sudoku_id"}, status=400)
        
        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)
        
        if status == "completed":
            # Prepare the final state for completed puzzle
            board_state = board_state or []
            state_json = json.dumps(board_state)
            state_compressed = zlib.compress(state_json.encode('utf-8'))
            
            # Mark puzzle as completed
            done_puzzle, created = UserSudokuDone.objects.get_or_create(
                user=request.user,
                sudoku=sudoku,
                defaults={
                    'time': current_time,
                    'rating': rating,
                    'date': timezone.now(),
                    'state': state_compressed,  # Save the final state
                }
            )
            
            if not created:
                # Update existing record (in case user completed it multiple times)
                done_puzzle.time = current_time
                done_puzzle.rating = rating
                done_puzzle.date = timezone.now()
                done_puzzle.state = state_compressed  # Update the final state
                done_puzzle.save()
            
            # Remove the ongoing puzzle record since it's now completed
            try:
                ongoing = UserSudokuOngoing.objects.get(user=request.user, sudoku=sudoku)
                ongoing.delete()
            except UserSudokuOngoing.DoesNotExist:
                pass  # No ongoing record to delete
            
            return JsonResponse({"status": "success", "message": "completed"})
        
        else:
            # state can be empty, assume user sets numbers and then unsets them again to the original state
            board_state = board_state or [] 
            
            state_json = json.dumps(board_state)
            state_compressed = zlib.compress(state_json.encode('utf-8'))
            
            # Update or create the ongoing puzzle record
            ongoing, created = UserSudokuOngoing.objects.get_or_create(
                user=request.user,
                sudoku=sudoku,
                defaults={
                    'state': state_compressed,
                    'time': current_time,
                    'date': timezone.now(),
                }
            )
            
            if not created:
                # Update existing record
                ongoing.state = state_compressed
                ongoing.time = current_time
                ongoing.date = timezone.now()
                ongoing.save()
            
            return JsonResponse({"status": "success", "message": "State saved"})
        
    except Exception as e:
        print(f"Error saving puzzle state: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

def load_puzzle_state(request, sudoku_id):
    """Loads the saved state of a puzzle."""
    try:
        # Handle non-authenticated users
        if not request.user.is_authenticated:
            return JsonResponse({
                "status": "no_auth",
                "message": "User not authenticated - use local storage"
            })
        
        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)
        
        # First check if puzzle is already completed
        try:
            done_puzzle = UserSudokuDone.objects.get(user=request.user, sudoku=sudoku)
            
            board_state = None
            if done_puzzle.state:
                state_json = zlib.decompress(done_puzzle.state).decode('utf-8')
                board_state = json.loads(state_json)
            
            return JsonResponse({
                "status": "completed",
                "message": "Puzzle already completed",
                "board_state": board_state,
                "completion_time": done_puzzle.time,
                "rating": done_puzzle.rating,
                "completed_date": done_puzzle.date.isoformat() if done_puzzle.date else None
            })
        except UserSudokuDone.DoesNotExist:
            pass
        
        # Check for ongoing state
        try:
            ongoing = UserSudokuOngoing.objects.get(user=request.user, sudoku=sudoku)
            
            if ongoing.state:
                state_json = zlib.decompress(ongoing.state).decode('utf-8')
                board_state = json.loads(state_json)
                
                return JsonResponse({
                    "status": "success",
                    "board_state": board_state,
                    "time": ongoing.time,
                    "last_saved": ongoing.date.isoformat() if ongoing.date else None
                })
            else:
                return JsonResponse({"status": "no_state", "message": "No saved state found"})
                
        except UserSudokuOngoing.DoesNotExist:
            return JsonResponse({"status": "no_state", "message": "No saved state found"})
            
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


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



def modal_login(request):
    form = AuthenticationForm()
    return render(request, 'sudoku/modals/login.html', {'form': form})

def modal_register(request):
    form = UserCreationForm()
    return render(request, 'sudoku/modals/register.html', {'form': form})

def modal_forgot_password(request):
    form = PasswordResetForm()
    return render(request, 'sudoku/modals/forgot_password.html', {'form': form})


#nur zum Testen
def help(request):
    return render(request, 'sudoku/help.html')
