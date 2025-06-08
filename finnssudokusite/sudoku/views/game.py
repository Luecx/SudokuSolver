import zlib
import json
import traceback
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.db import transaction

from ..models import Sudoku, UserSudokuDone, UserSudokuOngoing
from ..util.leaderboard import update_leaderboard_entry
from ..util.decorators import login_required_json

def game(request):
    return render(request, "sudoku/game/game.html")

def play_sudoku(request, sudoku_id):
    sudoku = get_object_or_404(Sudoku, pk=sudoku_id)
    try:
        puzzle_data = _decompress(sudoku.puzzle)
    except Exception:
        raise Http404("Invalid puzzle data.")
    return render(request, "sudoku/game/game.html", {
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
@login_required_json
def save_ongoing_state(request):
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
@login_required_json
@transaction.atomic
def mark_sudoku_completed(request):
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

        try:
            update_leaderboard_entry(request.user)
        except Exception as e:
            print("ERROR during mark_sudoku_completed:")
            traceback.print_exc()
            return JsonResponse({"status": "error", "message": str(e)}, status=400)

        return JsonResponse({"status": "success", "message": "Puzzle marked as completed"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

@login_required_json
def load_puzzle_state(request, sudoku_id):
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

@login_required_json
def get_ongoing_state(request, sudoku_id):
    try:
        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)
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
        return JsonResponse({"status": "no_state", "message": "No ongoing state found"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

@login_required_json
def has_solved(request, sudoku_id):
    try:
        sudoku = get_object_or_404(Sudoku, pk=sudoku_id)
        solved = UserSudokuDone.objects.filter(user=request.user, sudoku=sudoku).exists()
        return JsonResponse({"status": "success", "solved": solved})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

# --- Internal utility functions --- #

def _parse_request_data(request):
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
    if not isinstance(board_str, str):
        board_str = json.dumps(board_str)
    return zlib.compress(board_str.encode('utf-8'))

def _decompress(blob):
    return zlib.decompress(blob).decode('utf-8')
