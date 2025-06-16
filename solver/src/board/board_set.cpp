#include "board.h"

namespace sudoku {

bool Board::is_valid_move(const CellIdx &idx, Number number) const {
    const Cell &cell = grid_.at(idx.r).at(idx.c);
    return cell.value == EMPTY && cell.candidates.test(number);
}

bool Board::valid() const {
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            const Cell &cell = grid_[r][c];
            if (cell.value == EMPTY && cell.candidates.count() == 0)
                return false;
        }
    }

    for (const auto &handler: handlers_) {
        if (handler && !handler->valid())
            return false;
    }

    return true;
}

bool Board::is_solved() const {
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            if (grid_[r][c].value == EMPTY)
                return false;
        }
    }
    return true;
}

void Board::push_history() {
    assert(history_top_ + 1 < static_cast<int>(snapshot_pool_.size()));
    ++history_top_;
    Snapshot &snap = snapshot_pool_[history_top_];

    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            const Cell &cell = grid_[r][c];
            int idx = r * board_size_ + c;
            snap[idx].value = cell.value;
            snap[idx].candidate_bits = cell.candidates.raw();
        }
    }
}

bool Board::pop_history() {
    if (history_top_ < 0)
        return false;

    const Snapshot &snap = snapshot_pool_[history_top_];
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            int idx = r * board_size_ + c;
            grid_[r][c].value = snap[idx].value;
            grid_[r][c].candidates = NumberSet(board_size_, snap[idx].candidate_bits);
        }
    }

    --history_top_;
    return true;
}

bool Board::set_cell(const CellIdx &idx, Number number, bool force) {
    if (!force && !is_valid_move(idx, number))
        return false;

    if (!force)
        push_history();

    Cell &cell = get_cell(idx);
    cell.set_value(number);

    process_rule_number_changed(idx);
    process_rule_candidates();

    if (!force && !valid()) {
        pop_history();
        return false;
    }

    return true;
}


void Board::process_rule_number_changed(const CellIdx &idx) {
    for (const auto &handler: handlers_) {
        if (handler) {
            handler->number_changed(idx);
        }
    }
}

void Board::process_rule_candidates() {
    bool changed = true;
    while (changed) {
        changed = false;
        for (const auto &handler: handlers_) {
            if (handler) {
                changed |= handler->candidates_changed();
            }
        }
    }
}

} // namespace sudoku
