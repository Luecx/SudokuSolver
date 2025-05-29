import sys
import sqlite3
import argparse
import re
from collections import defaultdict
from tabulate import tabulate


def load_user_map(cursor, user_filter):
    cursor.execute("SELECT id, username FROM auth_user")
    return {
        row[0]: row[1]
        for row in cursor.fetchall()
        if re.search(user_filter, row[1], re.IGNORECASE)
    }


def load_sudoku_map(cursor, puzzle_filter):
    cursor.execute("SELECT id, title FROM sudoku_sudoku")
    return {
        row[0]: row[1]
        for row in cursor.fetchall()
        if re.search(puzzle_filter, row[1], re.IGNORECASE)
    }


def fetch_status(cursor, table, mark):
    cursor.execute(f"SELECT user_id, sudoku_id FROM {table}")
    return {(user_id, sudoku_id): mark for user_id, sudoku_id in cursor.fetchall()}


def merge_status(done, ongoing):
    status = defaultdict(str)
    for key, val in done.items():
        status[key] += val
    for key, val in ongoing.items():
        if 'D' in status[key]:
            status[key] = 'DO'
        else:
            status[key] += val
    return status


def build_table(users, sudokus, status):
    headers = ["Sudoku Title"] + [users[uid] for uid in sorted(users)]
    table = []

    for sid in sorted(sudokus):
        row = [sudokus[sid]]
        for uid in sorted(users):
            row.append(status.get((uid, sid), ""))
        table.append(row)

    return headers, table


def main():
    parser = argparse.ArgumentParser(description="Print Sudoku status matrix")
    parser.add_argument("db_path", help="Path to the Django SQLite DB")
    parser.add_argument("--user", default=".*", help="Regex to filter usernames")
    parser.add_argument("--puzzle", default=".*", help="Regex to filter puzzle titles")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db_path)
    cursor = conn.cursor()

    users = load_user_map(cursor, args.user)
    sudokus = load_sudoku_map(cursor, args.puzzle)

    if not users:
        print("No users matched the filter.")
        return
    if not sudokus:
        print("No puzzles matched the filter.")
        return

    done = fetch_status(cursor, "sudoku_usersudokudone", "D")
    ongoing = fetch_status(cursor, "sudoku_usersudokuongoing", "O")
    status = merge_status(done, ongoing)

    headers, table = build_table(users, sudokus, status)

    print(tabulate(table, headers=headers, tablefmt="grid"))

    conn.close()


if __name__ == "__main__":
    main()
