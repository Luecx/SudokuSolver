#include <utility>

#include "../board/board.h"
#include "rule_arrow.h"


namespace sudoku {

// RuleCage methods

bool RuleArrow::number_changed(CellIdx pos) {
    bool changed = false;

    for (auto &arrow_pair: arrow_pairs_) {
        const Region<CellIdx> &base = arrow_pair.base;
        const Region<CellIdx> &path = arrow_pair.arrow_path;

        // check if the changed cell is in the base or path
        if (!base.has(pos) && !path.has(pos))
            continue;

        changed |= determine_base_options(arrow_pair);
        changed |= determine_path_options(arrow_pair);
    }

    return changed;
}

bool RuleArrow::candidates_changed() {
    bool changed = false;

    for (auto &arrow_pair: arrow_pairs_) {
        changed |= determine_base_options(arrow_pair);
        changed |= determine_path_options(arrow_pair);
    }

    return changed;
}

bool RuleArrow::valid() {
    for (const auto &arrow_pair: arrow_pairs_) {
        const Region<CellIdx> &base = arrow_pair.base;
        const Region<CellIdx> &path = arrow_pair.arrow_path;

        auto [base_lb, base_ub] = bounds_base(base);
        auto [path_lb, path_ub] = bounds_path(path);

        if (base_ub < path_lb || base_lb > path_ub)
            return false;
    }

    return true;
}

void RuleArrow::from_json(JSON &json) {
    arrow_pairs_.clear();

    if (board_->size() != 9)
        return; // arrow rules only supported for 9x9 boards

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("base"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> base = Region<CellIdx>::from_json(rule["fields"]["base"]);
        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);

        if (base.size() > 0 && path.size() > 0) {
            ArrowPair arrow_pair;
            arrow_pair.base = base;
            arrow_pair.arrow_path = path;

            arrow_pairs_.push_back(arrow_pair);
        }
    }
}

// private member functions

// we need to differentiate between a few cases, one is estimating the possible numbers in the base
// and the other is the possible numbers inside the path
bool RuleArrow::determine_base_options(ArrowPair &arrow_pair) {
    bool changed = false;

    Region<CellIdx> &base = arrow_pair.base;
    Region<CellIdx> &path = arrow_pair.arrow_path;

    // we first need to estimate the possible range of numbers in the path
    auto [path_lb, path_ub] = bounds_path(path);

    // next, we need to differentiate between the amount of base cells
    if (base.size() == 1) {
        Cell &cell = board_->get_cell(base.items()[0]);
        if (cell.is_solved())
            return false;
        changed |= cell.only_allow_candidates(NumberSet::greaterThan(path_lb, cell.max_number));
    } else {
        Cell &cell1 = board_->get_cell(base.items()[0]);
        Cell &cell2 = board_->get_cell(base.items()[1]);
        if (cell1.is_solved() && cell2.is_solved())
            return false;

        NumberSet cands1(cell1.max_number);
        NumberSet cands2(cell2.max_number);

        for (int i = path_lb; i <= path_ub; ++i) {
            if (i > 10)
                cands1.add(i / 10);
            if (i % 10 > 0)
                cands2.add(i % 10);
        }

        changed |= cell1.only_allow_candidates(cands1);
        changed |= cell2.only_allow_candidates(cands2);
    }

    return changed;
}

// this function is used to determine the possible numbers in the path
bool RuleArrow::determine_path_options(ArrowPair &arrow_pair) {
    bool changed = false;

    Region<CellIdx> &base = arrow_pair.base;
    Region<CellIdx> &path = arrow_pair.arrow_path;

    auto [base_lb, base_ub] = bounds_base(base);
    auto [path_lb, path_ub] = bounds_path(path);

    // go through each empty cell in the path
    for (const auto &pos: path.items()) {
        Cell &cell = board_->get_cell(pos);
        if (cell.is_solved())
            continue;

        // compute the lb and ub of the remaining cells
        int rest_lb = path_lb - cell.candidates.lowest();
        int rest_ub = path_ub - cell.candidates.highest();

        int lb = std::max(base_lb - rest_lb, 1);
        int ub = std::min(base_ub - rest_ub, cell.max_number - 1);

        NumberSet mask = NumberSet::greaterThan(lb - 1, cell.max_number) & NumberSet::lessThan(ub + 1, cell.max_number);
        changed |= cell.only_allow_candidates(mask);
    }

    return changed;
}

std::pair<int, int> RuleArrow::bounds_base(const Region<CellIdx> &base) {
    int lb = 0;
    int ub = 0;

    // if there are two base cells, we need to determine the range of numbers
    if (base.size() == 2) {
        Cell &cell1 = board_->get_cell(base.items()[0]);
        Cell &cell2 = board_->get_cell(base.items()[1]);

        int cell1_lowest = cell1.is_solved() ? cell1.value : cell1.candidates.lowest();
        int cell2_lowest = cell2.is_solved() ? cell2.value : cell2.candidates.lowest();
        lb = cell1_lowest * 10 + cell2_lowest;

        int cell1_highest = cell1.is_solved() ? cell1.value : cell1.candidates.highest();
        int cell2_highest = cell2.is_solved() ? cell2.value : cell2.candidates.highest();
        ub = cell1_highest * 10 + cell2_highest;
    } else {
        Cell &cell = board_->get_cell(base.items()[0]);
        lb = cell.is_solved() ? cell.value : cell.candidates.lowest();
        ub = cell.is_solved() ? cell.value : cell.candidates.highest();
    }

    return {lb, ub};
}

std::pair<int, int> RuleArrow::bounds_path(const Region<CellIdx> &path) { return {lowerbound(path), upperbound(path)}; }

int RuleArrow::lowerbound(const Region<CellIdx> &path) {
    int sum = 0;
    for (const auto &pos: path.items()) {
        Cell &cell = board_->get_cell(pos);
        sum += cell.is_solved() ? cell.value : cell.candidates.lowest();
    }
    return std::min(sum, 99);
}

int RuleArrow::upperbound(const Region<CellIdx> &path) {
    int sum = 0;
    for (const auto &pos: path.items()) {
        Cell &cell = board_->get_cell(pos);
        sum += cell.is_solved() ? cell.value : cell.candidates.highest();
    }
    return std::min(sum, 99);
}

} // namespace sudoku
