# sudoku/views/all.py

import json
import zlib
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, update_session_auth_hash, get_user_model
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.decorators import login_required
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils import timezone
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Count
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_POST
from django.contrib.auth.models import User

from ..models import Sudoku, UserSudokuDone, UserSudokuOngoing, Tag
from ..forms import UserRegisterForm
from ..util.leaderboard import compute_leaderboard_scores


def index(request):
    sudokus = Sudoku.objects.annotate(
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


def contact_view(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        message = request.POST.get('message', '').strip()

        if name and message:
            send_mail(
                f"Neue Kontaktanfrage von {name}",
                f"Name: {name}\n\nNachricht:\n{message}",
                settings.DEFAULT_FROM_EMAIL,
                ['hello@sudokusphere.com']
            )
            return HttpResponse("OK")  # Keine Umleitung, nur Antwort
        return HttpResponse("Fehler", status=400)
    return render(request, 'index.html')

def game(request):
    return render(request, "sudoku/game/game.html")


def puzzles_view(request):
    query = request.GET.get("q", "").strip()
    tag_names = request.GET.getlist("tags")

    sudokus = Sudoku.objects.filter(is_public=True).select_related("created_by").prefetch_related("tags")

    if query:
        sudokus = sudokus.filter(title__icontains=query)

    if tag_names:
        sudokus = sudokus.filter(tags__name__in=tag_names).distinct()

    sudokus = sudokus.order_by('-id')
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

def creator(request):
    return render(request, "sudoku/creator/creator.html")


@login_required
@require_POST
def save_sudoku(request):
    try:
        data = json.loads(request.body)

        title = data.get("title", "Untitled Sudoku")
        board_json = data.get("board")
        solution_str = data.get("solution")
        tag_names = data.get("tags", [])

        if not isinstance(board_json, str):
            return JsonResponse({"status": "error", "message": "Board must be a JSON string."}, status=400)

        if not isinstance(solution_str, str):
            return JsonResponse({"status": "error", "message": "Invalid or missing solution string."}, status=400)

        board_zip = zlib.compress(board_json.encode("utf-8"))

        sudoku = Sudoku.objects.create(
            title=title,
            puzzle=board_zip,
            solution_string=solution_str,
            created_by=request.user,
            is_public=True,
        )

        for tag_name in tag_names:
            tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
            sudoku.tags.add(tag_obj)

        return JsonResponse({"status": "success", "sudoku_id": sudoku.id})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


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
    target_user = get_object_or_404(User, username=username)
    attempted_stats = UserSudokuDone.objects.filter(user=target_user).select_related("sudoku").order_by("-date")
    solved_stats = attempted_stats.filter(time__gt=0)
    created_puzzles = Sudoku.objects.filter(created_by=target_user).order_by("-id")

    return render(request, "sudoku/profile/profile_detail.html", {
        "target_user": target_user,
        "last_login": target_user.last_login,
        "done_count": solved_stats.count(),
        "attempt_count": attempted_stats.count(),
        "solved_stats": solved_stats,
        "attempted_stats": attempted_stats,
        "created_puzzles": created_puzzles,
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
            message = render_to_string('sudoku/login/account_activation_email.html', {
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
            })
            send_mail(subject, message, 'noreply@sudoku.com', [user.email])
            return render(request, 'sudoku/login/activation_sent.html')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return render(request, 'sudoku/login/register.html', {'form': form})
    else:
        form = UserRegisterForm()

    return render(request, 'sudoku/login/register.html', {'form': form})


def activate(request, uid, token):
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


def help(request):
    return render(request, 'sudoku/help.html')
