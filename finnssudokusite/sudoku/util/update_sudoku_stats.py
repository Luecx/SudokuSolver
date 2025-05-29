def update_sudoku_stats(sudoku, *, new_time=None, new_rating=None, old_rating=None):
    """
    Update a Sudoku instance with new solve time or rating.

    Args:
        sudoku       : Sudoku instance (must already be saved).
        new_time     : Time taken for this solve (int, in seconds), or None.
        new_rating   : New rating value (int: 1–5), or None.
        old_rating   : If the user is updating a previous rating, provide old value (int: 1–5).
    """
    updated = False

    # Update average_time
    if new_time is not None:
        count = sudoku.solves
        new_avg = (
                (sudoku.average_time * count + new_time) / (count + 1)
        )
        sudoku.average_time = new_avg
        sudoku.solves += 1
        updated = True

    # Update average_rating
    if new_rating is not None:
        if old_rating is None:
            # First time rating
            count = sudoku.ratings_count
            new_avg = (
                    (sudoku.average_rating * count + new_rating) / (count + 1)
            )
            sudoku.average_rating = new_avg
            sudoku.ratings_count += 1
        else:
            # Updated rating
            count = sudoku.ratings_count
            if count > 0:
                new_avg = (
                        (sudoku.average_rating * count - old_rating + new_rating) / count
                )
                sudoku.average_rating = new_avg
        updated = True

    if updated:
        sudoku.save()
