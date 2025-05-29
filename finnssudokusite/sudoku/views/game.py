# sudoku/views/game.py

import json
import zlib
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.contrib.auth.decorators import login_required

from ..models import Sudoku, UserSudokuDone, UserSudokuOngoing


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


@require_POST
def save_puzzle_state(request):
    """Saves the current state of a puzzle or marks it as completed."""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({
                "status": "no_auth",
                "message": "User not authenticated - use local storage"
            })

        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data_str = request.POST.get('data')
            if not data_str:
                return JsonResponse({"status": "error", "message": "No data provided"}, status=400)
            data = json.loads(data_str)

        sudoku_id = data.get("sudoku_id")
        board_state = data.get("board_state", [])
        current_time = data.get("time", 0)
        status = data.get("status", "ongoing")
        rating = data.get("rating", None)

        if not sudoku_id:
            return JsonResponse({"status": "error", "message": "Missing sudoku_id"}, status=400)

        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)

        state_json = json.dumps(board_state)
        state_compressed = zlib.compress(state_json.encode('utf-8'))

        if status == "completed":
            done_puzzle, created = UserSudokuDone.objects.get_or_create(
                user=request.user,
                sudoku=sudoku,
                defaults={
                    'time': current_time,
                    'rating': rating,
                    'date': timezone.now(),
                    'state': state_compressed,
                }
            )

            if not created:
                done_puzzle.time = current_time
                done_puzzle.rating = rating
                done_puzzle.date = timezone.now()
                done_puzzle.state = state_compressed
                done_puzzle.save()

            UserSudokuOngoing.objects.filter(user=request.user, sudoku=sudoku).delete()

            return JsonResponse({"status": "success", "message": "completed"})

        else:
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
                ongoing.state = state_compressed
                ongoing.time = current_time
                ongoing.date = timezone.now()
                ongoing.save()

            return JsonResponse({"status": "success", "message": "State saved"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


def load_puzzle_state(request, sudoku_id):
    """Loads the saved state of a puzzle."""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({
                "status": "no_auth",
                "message": "User not authenticated - use local storage"
            })

        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)

        try:
            done_puzzle = UserSudokuDone.objects.get(user=request.user, sudoku=sudoku)
            board_state = None
            if done_puzzle.state:
                board_state = json.loads(zlib.decompress(done_puzzle.state).decode('utf-8'))

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

        try:
            ongoing = UserSudokuOngoing.objects.get(user=request.user, sudoku=sudoku)
            if ongoing.state:
                board_state = json.loads(zlib.decompress(ongoing.state).decode('utf-8'))

                return JsonResponse({
                    "status": "success",
                    "board_state": board_state,
                    "time": ongoing.time,
                    "last_saved": ongoing.date.isoformat() if ongoing.date else None
                })
        except UserSudokuOngoing.DoesNotExist:
            pass

        return JsonResponse({"status": "no_state", "message": "No saved state found"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)
