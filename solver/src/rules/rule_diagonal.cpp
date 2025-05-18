#include "rule_diagonal.h"
#include "../board/board.h"

namespace sudoku {

bool RuleDiagonal::number_changed(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);

    const int board_size = board_->size();
    bool changed = false;

    NumberSet rm(board_size);
    rm.add(cell.value);

    NumberSet keep = ~rm;

    if (diagonal_ && pos.r == pos.c) {
        for (int i = 0; i < board_size; ++i) {
            Cell &diag_cell = board_->get_cell({i, i});
            if (diag_cell.is_solved())
                continue;

            NumberSet before = diag_cell.candidates;
            diag_cell.candidates &= keep;
            if (diag_cell.candidates != before)
                changed = true;
        }
    }

    if (anti_diagonal_ && pos.r + pos.c == board_size - 1) {
        for (int i = 0; i < board_size; ++i) {
            Cell &anti_diag_cell = board_->get_cell({i, board_size - 1 - i});
            if (anti_diag_cell.is_solved())
                continue;

            NumberSet before = anti_diag_cell.candidates;
            anti_diag_cell.candidates &= keep;
            if (anti_diag_cell.candidates != before)
                changed = true;
        }
    }

    return changed;
}

bool RuleDiagonal::valid() {
    if (diagonal_ && !check_unique_diagonal(true))
        return false;
    if (anti_diagonal_ && !check_unique_diagonal(false))
        return false;
    return true;
}

void RuleDiagonal::from_json(JSON &json) {
    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("diagonal"))
        diagonal_ = json["fields"]["diagonal"].get<bool>();
    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("antiDiagonal"))
        anti_diagonal_ = json["fields"]["antiDiagonal"].get<bool>();
}

// private member function

bool RuleDiagonal::check_unique_diagonal(bool is_main) {
    const int board_size = board_->size();

    NumberSet seen(board_size);

    for (int i = 0; i < board_size; ++i) {
        Cell &cell = is_main ? board_->get_cell({i, i}) : board_->get_cell({i, board_size - 1 - i});
        if (!cell.is_solved())
            continue;

        if (seen.test(cell.value))
            return false; // duplicate found
        seen.add(cell.value);
    }

    return true; // unique
}

} // namespace sudoku
