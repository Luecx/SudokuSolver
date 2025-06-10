#include "rule_dutch_flat.h"
#include "../board/board.h"

namespace sudoku {

bool RuleDutchFlat::number_changed(CellIdx pos) { return enforce_dutch_flat(pos); }

bool RuleDutchFlat::candidates_changed() {
    bool changed = false;
    for (Row r = 0; r < board_->size(); ++r)
        for (Col c = 0; c < board_->size(); ++c)
            changed |= enforce_dutch_flat(CellIdx(r, c));
    return changed;
}

bool RuleDutchFlat::valid() {
    for (Row r = 0; r < board_->size(); ++r) {
        for (Col c = 0; c < board_->size(); ++c) {
            CellIdx pos(r, c);
            Cell &cell = board_->get_cell(pos);
            if (cell.value != 5)
                continue;

            bool has_valid_neighbor = false;

            Cell *above_cell = get_above_cell(pos);
            if (above_cell != nullptr && above_cell->candidates.test(1)) {
                has_valid_neighbor = true;
            }

            Cell *below_cell = get_below_cell(pos);
            if (below_cell != nullptr && below_cell->candidates.test(9)) {
                has_valid_neighbor = true;
            }

            if (!has_valid_neighbor) {
                // If the cell is 5, but neither above is 1 nor below is 9, it's invalid
                return false;
            }
        }
    }
    return true;
}

// private member function

bool RuleDutchFlat::enforce_dutch_flat(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);
    if (!cell.is_solved() || cell.value != 5)
        return false;

    bool changed = false;

    Cell *above_cell = get_above_cell(pos);
    Cell *below_cell = get_below_cell(pos);

    NumberSet above_allowed(cell.max_number, Number(1));
    NumberSet below_allowed(cell.max_number, Number(9));

    // if above cell doenst exist, below must have 9
    if (above_cell == nullptr) {
        return below_cell->only_allow_candidates(below_allowed);
    }
    // if below cell doesnt exist, above must have 1
    if (below_cell == nullptr) {
        return above_cell->only_allow_candidates(above_allowed);
    }
    // if above cell doesnt have 1 in the candidates, below must have 9
    if (!above_cell->candidates.test(1)) {
        changed |= below_cell->only_allow_candidates(below_allowed);
    }
    // if below cell doesnt have 9 in the candidates, above must have 1
    if (!below_cell->candidates.test(9)) {
        changed |= above_cell->only_allow_candidates(above_allowed);
    }

    return changed;
}

Cell *RuleDutchFlat::get_above_cell(CellIdx pos) {
    int above_row = pos.r - 1;
    if (above_row >= 0)
        return &board_->get_cell(CellIdx(above_row, pos.c));
    return nullptr;
}

Cell *RuleDutchFlat::get_below_cell(CellIdx pos) {
    int below_row = pos.r + 1;
    if (below_row < board_->size())
        return &board_->get_cell(CellIdx(below_row, pos.c));
    return nullptr;
}

} // namespace sudoku
