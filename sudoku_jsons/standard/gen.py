import json
import os
from dokusan import generators

# Output directory
output_dir = "sudoku_jsons_unique"
os.makedirs(output_dir, exist_ok=True)

def parse_dokusan_grid(grid):
    """Convert 81-char puzzle string to 9x9 list."""
    board = [[0] * 9 for _ in range(9)]
    for i, val in enumerate(str(grid)):
        r, c = divmod(i, 9)
        board[r][c] = int(val)
    return board

def sudoku_to_json_format(board):
    fixed_cells = [
        {"r": r, "c": c, "value": val}
        for r in range(9) for c in range(9)
        if (val := board[r][c]) != 0
    ]
    return {
        "fixedCells": fixed_cells,
        "rules": [
            {
                "type": "Standard",
                "fields": {},
                "rules": []
            }
        ]
    }

# Generate 50 puzzles with unique solutions
for i in range(50):
    puzzle_str = generators.random_sudoku(avg_rank=100)  # 100 = moderate difficulty
    board = parse_dokusan_grid(puzzle_str)
    puzzle_json = sudoku_to_json_format(board)
    filename = os.path.join(output_dir, f"standard-{i+1:02d}.json")
    with open(filename, "w") as f:
        json.dump(puzzle_json, f, indent=4)

print(f"✅ 50 unique Sudoku puzzles written to: {output_dir}/")
