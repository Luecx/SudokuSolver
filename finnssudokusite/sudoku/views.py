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

from .models import Sudoku, UserSudokuStats
from .forms import UserRegisterForm
from .models import Tag
from collections import defaultdict, OrderedDict
from django.contrib.auth import get_user_model
import math
from datetime import datetime, timezone


def puzzles_view(request):
    sudokus = Sudoku.objects.all().select_related("created_by")
    return render(request, 'sudoku/puzzles.html', {'sudokus': sudokus})


def leaderboard(request):

    HALF_LIFE_DAYS = 60          # recency half‑life
    LAMBDA_VOL      = 0.04       # volume boost coefficient
    ALPHA, BETA     = 1, 2       # Bayesian smoothing for difficulty
    DIFF_EXP        = 1.7        # exponent in difficulty weight

    """Render the leaderboard using the Sudoku Power Index (SPI)."""

    # Pull all successful solve records (best_time > 0) in one query
    stats = (
        UserSudokuStats.objects
        .select_related('user', 'sudoku')
        .filter(best_time__gt=0)
    )

    now = datetime.now(timezone.utc)
    players = defaultdict(lambda: {'P': 0.0, 'N': 0.0, 'solved': 0})

    for stat in stats:
        puzzle = stat.sudoku

        # Sanity checks
        if (puzzle.average_time or 0) <= 0 or not stat.last_attempt:
            continue

        # 1. Recency weight (solve‑date to today)
        days_since = (now - stat.last_attempt).days
        w_rec = 2 ** (-days_since / HALF_LIFE_DAYS)

        # 2. Difficulty weight (Bayesian‑smoothed solve rate)
        solves   = puzzle.solves or 0
        attempts = puzzle.attempts or 0
        q = (solves + ALPHA) / (attempts + ALPHA + BETA)
        w_diff = 1 + (1 - q) ** DIFF_EXP

        # 3. Speed bonus (only positive if faster‑than‑average)
        user_t = stat.best_time
        avg_t  = puzzle.average_time
        if user_t > 0 and avg_t > 0:
            try:
                delta_speed = max(0.0, math.log(avg_t / user_t))
            except (ValueError, ZeroDivisionError):
                delta_speed = 0.0
        else:
            delta_speed = 0.0

        # Raw per‑puzzle points
        p_ui = w_rec * w_diff * (1 + delta_speed)

        rec = players[stat.user.username]
        rec['P']      += p_ui        # strength sum
        rec['N']      += w_rec       # volume (also recency‑weighted)
        rec['solved'] += 1

    # 4. Convert to raw ratings and find max
    raw_scores = {}
    R_max = 0.0
    for user, data in players.items():
        P, N = data['P'], data['N']
        try:
            R = P * (1 + LAMBDA_VOL * math.sqrt(N))
        except ValueError:
            R = 0.0

        if isinstance(R, complex):
            R = R.real

        raw_scores[user] = {
            'R': R,
            'solved': data['solved']
        }
        if isinstance(R_max, complex):
            R_max = R_max.real
        R_max = max(R_max, R)

    # 5. Final SPI (0‑100 scale)
    leaderboard_data = []
    for user, vals in raw_scores.items():
        spi = 100 * vals['R'] / R_max if R_max else 0
        leaderboard_data.append({
            'user': user,
            'score': round(spi, 2),
            'solved': vals['solved']
        })

    leaderboard_data.sort(key=lambda x: x['score'], reverse=True)

    return render(request, "sudoku/leaderboard.html", {
        "leaderboard": leaderboard_data
    })


def index(request):
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


@login_required
def profile(request):
    if request.method == 'POST':
        form = PasswordChangeForm(user=request.user, data=request.POST)
        if form.is_valid():
            form.save()
            update_session_auth_hash(request, form.user)
            return redirect('profile')
    else:
        form = PasswordChangeForm(user=request.user)

    solved_stats = (
        UserSudokuStats.objects
        .filter(user=request.user, best_time__gt=0)
        .select_related("sudoku")
        .order_by("-date_solved")
    )

    attempted_stats = (
        UserSudokuStats.objects
        .filter(user=request.user, attempts__gt=0)
        .select_related("sudoku")
        .order_by("-last_attempt")
    )

    created_puzzles = (
        Sudoku.objects
        .filter(created_by=request.user)
        .order_by("-id")
    )

    all_tags = Tag.objects.order_by("name")


    return render(request, 'sudoku/profile.html', {
        'form': form,
        'solved_stats': solved_stats,
        'attempted_stats': attempted_stats,
        'created_puzzles': created_puzzles,
        'all_tags': all_tags,
    })


def register(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False
            user.save()

            current_site = get_current_site(request)
            subject = 'Activate your Sudoku account'
            message = render_to_string('sudoku/account_activation_email.html', {
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
            })
            send_mail(subject, message, 'noreply@sudoku.com', [user.email])
            return render(request, 'sudoku/activation_sent.html')
    else:
        form = UserRegisterForm()
    return render(request, 'sudoku/register.html', {'form': form})


def activate(request, uid, token):
    try:
        uid = force_str(urlsafe_base64_decode(uid))
        user = get_user_model().objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return render(request, 'sudoku/activation_success.html')
    else:
        return render(request, 'sudoku/activation_invalid.html')



def creator(request):
    rule_handlers = [
        {"id": "kropki_white", "label": "White Kropki"},
        {"id": "kropki_black", "label": "Black Kropki"},
        {"id": "v", "label": "V Rule"},
        {"id": "x", "label": "X Rule"},
        {"id": "arrow", "label": "Arrow Rule"},
        {"id": "sandwich", "label": "Sandwich"},
    ]
    return render(request, "sudoku/creator.html", {"rule_handlers": rule_handlers})