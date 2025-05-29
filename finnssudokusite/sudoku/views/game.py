"""
views_game.py

Handles rendering and API logic for Sudoku gameplay.

Includes:
- Rendering the Sudoku game page (generic or puzzle-specific)
- Saving in-progress puzzle state
- Marking puzzles as completed
- Loading prior saved state (completed or ongoing)

Board data is always stored and transmitted as a compressed string (zlib).
Parsing is handled client-side.

Expected request JSON:
- sudoku_id: int (required)
- board_state: str (raw encoded board string)
- time: int (optional, in seconds)
- rating: int (optional, 1–5)

Responses use JSON:
- status: "success", "error", "completed", "no_state"
- message: optional text
- board_state: str (raw board string)
"""

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
    """
    Renders the generic Sudoku game page without loading a specific puzzle.
    """
    return render(request, "sudoku/game.html")


def play_sudoku(request, sudoku_id):
    """
    Renders the game page for a specific Sudoku puzzle.

    Context passed to template:
    - puzzle_data_json: JSON string with:
        - id: int
        - title: str
        - board: str (raw board string)
        - solution: str (flattened solution string)
    - page_title: str
    - creator_name: str
    """
    sudoku = get_object_or_404(Sudoku, pk=sudoku_id)

    try:
        puzzle_data = _decompress(sudoku.puzzle)
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
    Saves an in-progress puzzle to UserSudokuOngoing.

    Request:
    - JSON with: sudoku_id (int), board_state (str), time (int)

    Behavior:
    - Creates or updates ongoing save
    - Also marks whether this puzzle was already completed

    Response:
    - { status: "success", message: str } on success
    - { status: "error", message: str } on failure
    """
    try:
        data = _parse_request_data(request)
        sudoku = get_object_or_404(Sudoku, pk=data["sudoku_id"])

        state_compressed = _compress(data["board_state"])
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
    Marks a puzzle as completed, updates aggregates, removes ongoing save.

    Request:
    - JSON with: sudoku_id (int), board_state (str), time (int), rating (optional int)

    Behavior:
    - Creates or updates UserSudokuDone
    - Updates Sudoku.solve stats (solve count, time, rating avg)
    - Deletes any ongoing state for this user

    Response:
    - { status: "success", message: str }
    - { status: "error", message: str } on failure
    """
    try:
        data = _parse_request_data(request)
        sudoku = get_object_or_404(Sudoku, pk=data["sudoku_id"])

        state_compressed = _compress(data["board_state"])
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
            sudoku.solves += 1
            sudoku.sum_time += time
            if rating is not None:
                sudoku.sum_ratings += rating
                sudoku.ratings_count += 1
        else:
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
    Returns the most recent puzzle state (completed or ongoing).

    Returns JSON:
    - If completed:
        {
            status: "completed",
            message: "Puzzle already completed",
            board_state: str,
            completion_time: int,
            rating: int or null,
            completed_date: ISO string
        }

    - If ongoing:
        {
            status: "success",
            board_state: str,
            time: int,
            last_saved: ISO string,
            was_previously_completed: bool
        }

    - If no data found:
        { status: "no_state", message: str }

    - On failure:
        { status: "error", message: str }
    """
    try:
        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)

        try:
            done = UserSudokuDone.objects.get(user=request.user, sudoku=sudoku)
            board_state = _decompress(done.state) if done.state else None

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

        try:
            ongoing = UserSudokuOngoing.objects.get(user=request.user, sudoku=sudoku)
            board_state = _decompress(ongoing.state) if ongoing.state else None

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


@login_required
def get_ongoing_state(request, sudoku_id):
    """
    Loads the ongoing puzzle state for the user, if it exists.

    Returns:
    - If found:
        {
            "status": "success",
            "board_state": str,
            "time": int,
            "last_saved": ISO string,
            "was_previously_completed": bool
        }
    - If not:
        {
            "status": "no_state",
            "message": "No ongoing state found"
        }
    - On failure:
        {
            "status": "error",
            "message": str
        }
    """
    try:
        sudoku      = get_object_or_404(Sudoku, pk=sudoku_id)

        ongoing     = UserSudokuOngoing.objects.get(user=request.user, sudoku=sudoku)
        board_state = _decompress(ongoing.state) if ongoing.state else None

        return JsonResponse({
            "status": "success",
            "board_state": board_state,
            "time": ongoing.time,
            "last_saved": ongoing.date.isoformat() if ongoing.date else None,
            "was_previously_completed": ongoing.was_previously_completed,
        })

    except UserSudokuOngoing.DoesNotExist:
        return JsonResponse({"status": "no_state", "message": "No ongoing state found"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


@login_required
def has_solved(request, sudoku_id):
    """
    Checks whether the logged-in user has completed the given puzzle.

    Returns:
    {
        "status": "success",
        "solved": true | false
    }
    """
    try:
        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)
        solved = UserSudokuDone.objects.filter(user=request.user, sudoku=sudoku).exists()
        return JsonResponse({"status": "success", "solved": solved})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


# --- Internal utility functions --- #

def _parse_request_data(request):
    """
    Parses a request containing JSON or form-encoded puzzle data.

    Returns:
    - {
        sudoku_id: int,
        board_state: str,
        time: int,
        rating: int | None
      }

    Raises:
    - ValueError if data is missing or invalid
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
        "board_state": data.get("board_state", ""),
        "time": data.get("time", 0),
        "rating": data.get("rating", None),
    }


def _compress(board_str):
    """
    Compresses board data to zlib bytes.

    - board_str: str
    - Returns: bytes
    """
    return zlib.compress(board_str.encode('utf-8'))


def _decompress(blob):
    """
    Decompresses zlib-compressed board state.

    - blob: bytes
    - Returns: str
    """
    return zlib.decompress(blob).decode('utf-8')
