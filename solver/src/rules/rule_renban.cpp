#include "rule_renban.h"
#include "../board/board.h"


namespace sudoku {

bool RuleRenban::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &path: renban_paths_) {
        if (!path.has(pos))
            continue;
        changed |= enforce_renban(path);
    }
    return changed;
}

bool RuleRenban::candidates_changed() {
    bool changed = false;
    for (const auto &path: renban_paths_)
        changed |= enforce_renban(path);
    return changed;
}

void RuleRenban::update_impact(ImpactMap &map) {
    for (const auto &path: renban_paths_) {
        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                continue;
            map.increment(pos);
        }
    }
}

bool RuleRenban::valid() {
    for (const auto &path: renban_paths_) {
        solved_values_.clear();

        bool all_solved = true;
        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (!cell.is_solved()) {
                all_solved = false;
                break;
            }
            solved_values_.push_back(cell.value);
        }

        if (!all_solved)
            continue;

        std::sort(solved_values_.begin(), solved_values_.end());
        for (size_t i = 1; i < solved_values_.size(); i++)
            if (solved_values_[i] != solved_values_[i - 1] + 1)
                return false;
    }

    return true;
}

void RuleRenban::from_json(JSON &json) {
    renban_paths_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1)
            renban_paths_.push_back(path);
    }
}

// private member functions

void RuleRenban::init_all_consecutive_ranges(int length) {
    ranges_.clear();
    const int board_size = board_->size();

    for (int start = 1; start <= board_size - length + 1; start++) {
        ranges_.emplace_back(); // add an empty vector to ranges_
        for (int i = 0; i < length; i++)
            ranges_.back().push_back(start + i);
    }
}

void RuleRenban::init_ranges_including_values(int length, int min_value, int max_value) {
    ranges_.clear();
    solved_values_.clear();
    const int board_size = board_->size();

    int min_start = std::max(1, max_value - length + 1);
    int max_start = std::min(board_size - length + 1, min_value);

    for (int start = min_start; start <= max_start; start++) {
        potential_range_.clear();
        for (int i = 0; i < length; i++)
            potential_range_.push_back(start + i);

        bool all_included = true;
        for (int val: solved_values_) {
            if (std::find(potential_range_.begin(), potential_range_.end(), val) == potential_range_.end()) {
                all_included = false;
                break;
            }
        }

        if (all_included)
            ranges_.push_back(std::move(potential_range_));
    }
}

bool RuleRenban::enforce_renban(const Region<CellIdx> &path) {
    const int board_size = board_->size();
    const int length = path.size();

    bool changed = false;

    int min_value = board_size + 1;
    int max_value = 0;

    // collect solved values
    solved_values_.clear();
    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);

        if (!cell.is_solved())
            continue;

        int val = cell.value;
        min_value = std::min(min_value, val);
        max_value = std::max(max_value, val);

        solved_values_.push_back(cell.value);
    }

    if (!solved_values_.empty())
        init_ranges_including_values(length, min_value, max_value);
    else
        init_all_consecutive_ranges(length);

    NumberSet allowed(board_size);
    for (const auto &range: ranges_)
        for (int v: range)
            allowed.add(v);

    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);
        if (cell.is_solved())
            continue;

        for (int digit = 1; digit <= board_size; ++digit)
            if (!allowed.test(digit) && cell.candidates.test(digit))
                changed |= cell.remove_candidate(digit);
    }

    return changed;
}

} // namespace sudoku
