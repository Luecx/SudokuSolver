#include "rule_standard.h"
#include "../board/board.h"

namespace sudoku {

// standard helpers

bool hidden_singles(Board *board_, std::vector<Cell *>& unit) {
    bool changed = false;

    const int board_size = board_->size();

    NumberSet seen_once(board_size);
    NumberSet seen_twice(board_size);

    for (const auto &c: unit) {
        seen_twice |= (seen_once & c->candidates);
        seen_once |= c->candidates;
    }

    NumberSet unique = seen_once & ~seen_twice;

    for (auto &c: unit)
        if (!c->is_solved()) {
            NumberSet pick = c->get_candidates() & unique;
            if (pick.count() == 1)
                changed |= c->remove_candidates(~pick);
        }

    return changed;
}

// very slow!
bool pointing(Board *board_) {
    bool changed = false;
    const int block_size = board_->block_size();
    const int board_size = board_->size();

    for (int br = 0; br < board_size; br += block_size)
        for (int bc = 0; bc < board_size; bc += block_size) {
            auto block = board_->get_block(br, bc);
            for (Number d = 1; d <= board_size; d++) {
                int row_mask = 0, col_mask = 0;
                for (const auto &c: block)
                    if (!c->is_solved() && c->get_candidates().test(d)) {
                        row_mask |= 1 << (c->pos.r - br);
                        col_mask |= 1 << (c->pos.c - bc);
                    }

                // check for row pointing
                if (row_mask == 1 || row_mask == 2 || row_mask == 4) {
                    int local = (row_mask == 1) ? 0 : (row_mask == 2) ? 1 : 2;
                    int global = br + local;
                    for (auto &peer: board_->get_row(global))
                        if (peer->pos.c / block_size != bc / block_size)
                            changed = peer->remove_candidate(d) || changed;
                }

                // check for column pointing
                if (col_mask == 1 || col_mask == 2 || col_mask == 4) {
                    int local = (col_mask == 1) ? 0 : (col_mask == 2) ? 1 : 2;
                    int global = bc + local;
                    for (auto &peer: board_->get_col(global))
                        if (peer->pos.r / block_size != br / block_size)
                            changed = peer->remove_candidate(d) || changed;
                }
            }
        }

    return changed;
}

bool is_group_valid(const std::vector<Cell *>& unit) {
    const int unit_size = unit.size();

    NumberSet seen(unit_size);
    seen.clear();
    NumberSet combined(unit_size);

    for (const auto &c: unit) {
        if (c->is_solved()) {
            if (seen.test(c->value))
                return false;
            seen.add(c->value);
            combined |= NumberSet(c->max_number, c->value);
        } else {
            combined |= c->get_candidates();
        }
    }

    return combined == NumberSet::full(unit_size);
}


// RuleStandard methods

bool RuleStandard::number_changed(CellIdx pos) {
    auto &cell = board_->get_cell(pos);
    bool changed = false;

    NumberSet rm(cell.max_number, cell.value);

    for (auto &c: board_->get_row(pos.r))
        if (!c->is_solved())
            changed |= c->remove_candidates(rm);
    for (auto &c: board_->get_col(pos.c))
        if (!c->is_solved())
            changed |= c->remove_candidates(rm);
    for (auto &c: board_->get_block(pos.r, pos.c))
        if (!c->is_solved())
            changed |= c->remove_candidates(rm);

    return changed;
}

bool RuleStandard::candidates_changed() {
    bool changed = false;
    const int board_size = board_->size();

    for (int i = 0; i < board_size; i++) {
        auto row = board_->get_row(i);
        auto col = board_->get_col(i);
        changed |= hidden_singles(board_, row);
        changed |= hidden_singles(board_, col);
    }

    const int block_size = board_->block_size();
    for (int br = 0; br < board_size; br += block_size)
        for (int bc = 0; bc < board_size; bc += block_size) {
            auto block = board_->get_block(br, bc);
            changed |= hidden_singles(board_, block);
        }

    return changed;
}

bool RuleStandard::valid() {
    const int board_size = board_->size();
    for (int i = 0; i < board_size; i++) {
        if (!is_group_valid(board_->get_row(i)))
            return false;
        if (!is_group_valid(board_->get_col(i)))
            return false;
    }

    const int block_size = board_->block_size();
    for (int br = 0; br < board_size; br += block_size)
        for (int bc = 0; bc < board_size; bc += block_size)
            if (!is_group_valid(board_->get_block(br, bc)))
                return false;

    return true;
}

} // namespace sudoku
