#include "rule_irregular.h"
#include "../board/board.h"
#include "rule_standard.h"



namespace sudoku {

bool RuleIrregular::number_changed(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);
    bool changed = false;

    NumberSet rm(cell.max_number, cell.value);

    for (auto &c: board_->get_row(pos.r))
        if (!c->is_solved())
            changed |= c->remove_candidates(rm);
    for (auto &c: board_->get_col(pos.c))
        if (!c->is_solved())
            changed |= c->remove_candidates(rm);

    for (const auto &region: m_regions) {
        if (!region.has(pos))
            continue;

        for (const auto &item: region.items()) {
            Cell &target = board_->get_cell(item);
            if (!target.is_solved())
                changed |= target.remove_candidates(rm);
        }
    }

    return changed;
}

bool RuleIrregular::candidates_changed() {
    bool changed = false;

    const int board_size = board_->size();
    for (int i = 0; i < board_size; i++) {
        changed |= hidden_singles(board_, board_->get_row(i));
        changed |= hidden_singles(board_, board_->get_col(i));
    }

    for (auto &unit: m_irregular_units)
        changed |= hidden_singles(board_, unit);

    return changed;
}

bool RuleIrregular::valid() {
    const int board_size = board_->size();
    for (int i = 0; i < board_size; i++) {
        if (!is_group_valid(board_->get_row(i)))
            return false;
        if (!is_group_valid(board_->get_col(i)))
            return false;
    }

    for (const auto &unit: m_irregular_units)
        if (!is_group_valid(unit))
            return false;

    return true;
}

void RuleIrregular::from_json(JSON &json) {
    m_regions.clear();
    m_irregular_units.clear();

    for (int i = 1; i <= 9; ++i) {
        std::string region_key = "region" + std::to_string(i);
        Region<CellIdx> region = Region<CellIdx>::from_json(json["fields"][region_key]);
        if (region.size() > 0) {
            m_regions.push_back(region);
            // create a unit for each region
            std::vector<Cell *> unit;
            for (const auto &pos: region.items()) {
                Cell &cell = board_->get_cell(pos);
                unit.push_back(&cell);
            }
            m_irregular_units.push_back(unit);
        }
    }
}

// private member functions


} // namespace sudoku
