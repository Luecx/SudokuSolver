#include "rule_standard.h"
#include "../board/board.h"

namespace sudoku {

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

    if (board_->use_smart_hints()) {
        changed |= apply_pointing();
    }

    return changed;
}

bool RuleStandard::candidates_changed() {
    bool changed = false;
    const int board_size = board_->size();

    for (int i = 0; i < board_size; i++) {
        auto row = board_->get_row(i);
        auto col = board_->get_col(i);
        changed |= rule_utils::hidden_singles(board_, row);
        changed |= rule_utils::hidden_singles(board_, col);
    }

    const int block_size = board_->block_size();
    for (int br = 0; br < board_size; br += block_size)
        for (int bc = 0; bc < board_size; bc += block_size) {
            auto block = board_->get_block(br, bc);
            changed |= rule_utils::hidden_singles(board_, block);
        }

    if (board_->use_smart_hints()) {
        changed |= apply_pointing();
    }

    return changed;
}

bool RuleStandard::valid() {
    const int board_size = board_->size();
    for (int i = 0; i < board_size; i++) {
        if (!rule_utils::is_group_valid(board_->get_row(i)))
            return false;
        if (!rule_utils::is_group_valid(board_->get_col(i)))
            return false;
    }

    const int block_size = board_->block_size();
    for (int br = 0; br < board_size; br += block_size)
        for (int bc = 0; bc < board_size; bc += block_size)
            if (!rule_utils::is_group_valid(board_->get_block(br, bc)))
                return false;

    return true;
}


// ---------------------------------------------
// PRIVATE MEMBER FUNCTION
// ---------------------------------------------
bool RuleStandard::apply_pointing() {
    bool changed = false;
    const int board_size = board_->size();
    const int block_size = board_->block_size();
    const int max_val = board_size;

    for (int br = 0; br < board_size; br += block_size) {
        for (int bc = 0; bc < board_size; bc += block_size) {
            auto &block = board_->get_block(br, bc);

            // Track which row and column each number appears in
            std::vector<int> row_of(max_val + 1, -1);
            std::vector<int> col_of(max_val + 1, -1);

            for (auto* cell : block) {
                if (cell->is_solved()) continue;
                const Row r = cell->pos.r;
                const Col c = cell->pos.c;

                for (Number n : cell->get_candidates()) {
                    // Row tracking
                    if (row_of[n] == -1) {
                        row_of[n] = r;
                    } else if (row_of[n] != r) {
                        row_of[n] = board_size; // invalid
                    }

                    // Col tracking
                    if (col_of[n] == -1) {
                        col_of[n] = c;
                    } else if (col_of[n] != c) {
                        col_of[n] = board_size; // invalid
                    }
                }
            }

            // Eliminate from rows or columns outside the block
            for (Number n = 1; n <= max_val; ++n) {
                if (row_of[n] >= 0 && row_of[n] < board_size) {
                    for (auto* cell : board_->get_row(row_of[n])) {
                        if (!cell->is_solved() &&
                            !(std::find(block.begin(), block.end(), cell) != block.end())) {
                            changed |= cell->remove_candidate(n);
                        }
                    }
                }

                if (col_of[n] >= 0 && col_of[n] < board_size) {
                    for (auto* cell : board_->get_col(col_of[n])) {
                        if (!cell->is_solved() &&
                            !(std::find(block.begin(), block.end(), cell) != block.end())) {
                            changed |= cell->remove_candidate(n);
                        }
                    }
                }
            }
        }
    }

    return changed;
}

} // namespace sudoku
