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

JSON RuleStandard::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Standard";
    json["fields"] = JSON(JSON::object{});
    json["rules"] = JSON::array{};
    return json;
}

} // namespace sudoku
