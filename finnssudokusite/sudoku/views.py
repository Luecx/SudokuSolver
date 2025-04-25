from django.shortcuts import render, redirect
from django.contrib.auth import login, update_session_auth_hash, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.db.models import Count
from django.utils.timezone import make_aware, is_naive
from django.http import Http404
from datetime import datetime, timezone

from .models import Sudoku, UserSudokuStats, Tag
from .forms import UserRegisterForm
from .util.leaderboard import compute_leaderboard_scores


# === General Views === #
def index(request):
    """Main landing page showing all Sudoku puzzles and user stats if logged in."""
    sudokus = Sudoku.objects.annotate(
        attempts_count=Count('attempts'),
        solves_count=Count('solves')
    )
    user_stats = {}
    if request.user.is_authenticated:
        stats = UserSudokuStats.objects.filter(user=request.user)
        user_stats = {us.sudoku_id: us.best_time for us in stats}

    return render(request, 'sudoku/index.html', {
        'sudokus': sudokus,
        'user_stats': user_stats,
    })

def playboard(request):
    """Renders the interactive Sudoku playboard page."""
    return render(request, "sudoku/playboard/playboard.html")

def puzzles_view(request):
    """Displays all puzzles available to play."""
    sudokus = Sudoku.objects.all().select_related("created_by")
    return render(request, 'sudoku/puzzles.html', {'sudokus': sudokus})


def leaderboard(request):
    """Renders the leaderboard using the computed Sudoku Power Index (SPI)."""
    leaderboard_data = compute_leaderboard_scores()
    return render(request, "sudoku/leaderboard.html", {
        "leaderboard": leaderboard_data
    })


def creator(request):
    """View to access the puzzle creator interface."""
    return render(request, "sudoku/creator/creator.html")


# === Profile Views === #
@login_required
def profile(request):
    """Authenticated user's own profile page."""
    if request.method == 'POST':
        form = PasswordChangeForm(user=request.user, data=request.POST)
        if form.is_valid():
            form.save()
            update_session_auth_hash(request, form.user)
            return redirect('profile')
    else:
        form = PasswordChangeForm(user=request.user)

    solved_stats = UserSudokuStats.objects.filter(user=request.user, best_time__gt=0).select_related("sudoku")
    attempted_stats = UserSudokuStats.objects.filter(user=request.user, attempts__gt=0).select_related("sudoku")
    created_puzzles = Sudoku.objects.filter(created_by=request.user)
    all_tags = Tag.objects.order_by("name")

    return render(request, 'sudoku/profile/profile.html', {
        'form': form,
        'solved_stats': solved_stats.order_by("-date_solved"),
        'attempted_stats': attempted_stats.order_by("-last_attempt"),
        'created_puzzles': created_puzzles.order_by("-id"),
        'all_tags': all_tags,
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

    solved_stats = UserSudokuStats.objects.filter(user=target_user, best_time__gt=0).select_related("sudoku")
    attempted_stats = UserSudokuStats.objects.filter(user=target_user, attempts__gt=0).select_related("sudoku")
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
        'solved_stats': solved_stats.order_by("-date_solved"),
        'attempted_stats': attempted_stats.order_by("-last_attempt"),
        'created_puzzles': created_puzzles.order_by("-id"),
        'all_tags': all_tags,
        'rank': rank,
        'score': score,
        'done_count': solved_stats.count(),
        'attempt_count': attempted_stats.count(),
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
    """Verifies email activation token and activates user."""
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