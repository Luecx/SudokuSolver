import zlib
import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.decorators import login_required

from ..models import Sudoku, UserSudokuDone, UserSudokuOngoing

def game(request):
    """Renders the general Sudoku game page (without specific puzzle loaded)."""
    return render(request, "sudoku/game.html")


def play_sudoku(request, sudoku_id):
    """Renders the game page for a specific Sudoku puzzle."""
    sudoku = get_object_or_404(Sudoku, pk=sudoku_id)

    try:
        puzzle_data = _decompress_board(sudoku.puzzle)
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
@login_required
def save_ongoing_state(request):
    """
    Saves an ongoing Sudoku state (not yet completed).
    Creates or updates a UserSudokuOngoing entry.
    Sets 'was_previously_completed' if user has already completed this puzzle.
    """
    try:
        data = _parse_request_data(request)
        sudoku = get_object_or_404(Sudoku, pk=data["sudoku_id"])

        state_compressed = _compress_board(data["board_state"])
        time = data["time"]

        was_previously_completed = UserSudokuDone.objects.filter(user=request.user, sudoku=sudoku).exists()

        ongoing, created = UserSudokuOngoing.objects.get_or_create(
            user=request.user,
            sudoku=sudoku,
            defaults={
                "state": state_compressed,
                "time": time,
                "date": timezone.now(),
                "was_previously_completed": was_previously_completed,
            }
        )

        if not created:
            ongoing.state = state_compressed
            ongoing.time = time
            ongoing.date = timezone.now()
            ongoing.was_previously_completed = was_previously_completed
            ongoing.save()

        return JsonResponse({"status": "success", "message": "Ongoing state saved"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


@require_POST
@login_required
@transaction.atomic
def mark_sudoku_completed(request):
    """
    Marks a Sudoku as completed.
    Saves to UserSudokuDone, updates Sudoku aggregate statistics,
    and removes any ongoing entry.
    """
    try:
        data = _parse_request_data(request)
        sudoku = get_object_or_404(Sudoku, pk=data["sudoku_id"])

        state_compressed = _compress_board(data["board_state"])
        time = data["time"]
        rating = data.get("rating", None)

        done, created = UserSudokuDone.objects.select_for_update().get_or_create(
            user=request.user,
            sudoku=sudoku,
            defaults={
                "time": time,
                "rating": rating,
                "date": timezone.now(),
                "state": state_compressed,
            }
        )

        if created:
            # First-time solve — update aggregates
            sudoku.solves += 1
            sudoku.sum_time += time
            if rating is not None:
                sudoku.sum_ratings += rating
                sudoku.ratings_count += 1
        else:
            # Updating an existing solve — adjust delta
            sudoku.sum_time += time - done.time
            if rating is not None:
                if done.rating is not None:
                    sudoku.sum_ratings += rating - done.rating
                else:
                    sudoku.sum_ratings += rating
                    sudoku.ratings_count += 1
            elif done.rating is not None:
                sudoku.sum_ratings -= done.rating
                sudoku.ratings_count -= 1

            done.time = time
            done.rating = rating
            done.state = state_compressed
            done.date = timezone.now()
            done.save()

        sudoku.last_attempted = timezone.now()
        sudoku.save()

        UserSudokuOngoing.objects.filter(user=request.user, sudoku=sudoku).delete()

        return JsonResponse({"status": "success", "message": "Puzzle marked as completed"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


@login_required
def load_puzzle_state(request, sudoku_id):
    """
    Loads the current state of a puzzle, either from the completed or ongoing state.
    """
    try:
        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)

        # Try completed first
        try:
            done = UserSudokuDone.objects.get(user=request.user, sudoku=sudoku)
            board_state = _decompress_board(done.state) if done.state else None

            return JsonResponse({
                "status": "completed",
                "message": "Puzzle already completed",
                "board_state": board_state,
                "completion_time": done.time,
                "rating": done.rating,
                "completed_date": done.date.isoformat() if done.date else None
            })
        except UserSudokuDone.DoesNotExist:
            pass

        # Try ongoing
        try:
            ongoing = UserSudokuOngoing.objects.get(user=request.user, sudoku=sudoku)
            board_state = _decompress_board(ongoing.state) if ongoing.state else None

            return JsonResponse({
                "status": "success",
                "board_state": board_state,
                "time": ongoing.time,
                "last_saved": ongoing.date.isoformat() if ongoing.date else None,
                "was_previously_completed": ongoing.was_previously_completed,
            })
        except UserSudokuOngoing.DoesNotExist:
            return JsonResponse({"status": "no_state", "message": "No saved state found"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)




# --- Internal utility functions --- #

def _parse_request_data(request):
    """
    Parses JSON body from request and extracts necessary fields.
    Raises KeyError or ValueError on failure.
    """
    if request.content_type == 'application/json':
        data = json.loads(request.body)
    else:
        data_str = request.POST.get("data")
        if not data_str:
            raise ValueError("Missing request data")
        data = json.loads(data_str)

    if "sudoku_id" not in data:
        raise ValueError("Missing sudoku_id")

    return {
        "sudoku_id": data["sudoku_id"],
        "board_state": data.get("board_state", ""),  # ✅ Already a string
        "time": data.get("time", 0),
        "rating": data.get("rating", None),
    }


def _compress_board(board_data):
    """
    Compresses a board state using zlib.
    Converts to JSON string if not already a string.
    """
    if isinstance(board_data, str):
        board_str = board_data
    else:
        board_str = json.dumps(board_data)
    
    return zlib.compress(board_str.encode('utf-8'))


def _decompress_board(blob):
    """
    Decompresses a zlib blob to retrieve the board state string.
    """
    return zlib.decompress(blob).decode('utf-8')
