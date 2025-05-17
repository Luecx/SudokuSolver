#include "board.h"

namespace sudoku {

bool Board::is_valid_move(const CellIdx& idx, Number number) const {
    const Cell& cell = grid_.at(idx.r).at(idx.c);
    return cell.value == EMPTY && cell.candidates.test(number);
}

bool Board::valid() const {
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            const Cell& cell = grid_[r][c];
            if (cell.value == EMPTY && cell.candidates.count() == 0)
                return false;
        }
    }

    for (const auto& handler : handlers_) {
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
    Snapshot snapshot;
    snapshot.reserve(board_size_);

    for (Row r = 0; r < board_size_; ++r) {
        std::vector<std::pair<Number, NumberSet>> row_snapshot;
        row_snapshot.reserve(board_size_);
        for (Col c = 0; c < board_size_; ++c) {
            const Cell& cell = grid_[r][c];
            row_snapshot.emplace_back(cell.value, cell.candidates);
        }
        snapshot.push_back(std::move(row_snapshot));
    }

    history_.push(std::move(snapshot));
}

bool Board::pop_history() {
    if (history_.empty())
        return false;

    const Snapshot& snapshot = history_.top();
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            grid_[r][c].value = snapshot[r][c].first;
            grid_[r][c].candidates = snapshot[r][c].second;
        }
    }

    history_.pop();
    return true;
}

bool Board::set_cell(const CellIdx& idx, Number number, bool force) {
    if (!force && !is_valid_move(idx, number))
        return false;

    if (!force)
        push_history();

    Cell& cell = grid_[idx.r][idx.c];
    cell.value = number;
    cell.candidates = NumberSet(board_size_, number);

    process_rule_number_changed(idx);
    process_rule_candidates();

    if (!force && !valid()) {
        pop_history();
        return false;
    }

    return true;
}


void Board::process_rule_number_changed(const CellIdx& idx) {
    for (const auto& handler : handlers_) {
        if (handler) {
            handler->number_changed(idx);
        }
    }
}

void Board::process_rule_candidates() {
    bool changed = true;
    while (changed) {
        changed = false;
        for (const auto& handler : handlers_) {
            if (handler) {
                changed |= handler->candidates_changed();
            }
        }
    }
}

} // namespace sudoku
