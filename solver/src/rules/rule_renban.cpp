#include "rule_renban.h"
#include "../board/board.h"


namespace sudoku {

RuleRenban::RuleRenban(Board *board) : //
    RuleHandler(board), //
    solved_values_(board->size()), //
    ranges_(board->size(), RenbanType(board->size())) {}

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

        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (!cell.is_solved())
                break;
            solved_values_.add(cell.value);
        }

        if (solved_values_.size() != static_cast<int>(path.size()))
            continue;

        solved_values_.sort();
        for (int i = 1; i < solved_values_.size(); i++)
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
    const int board_size = board_->size();
    const int num_ranges = board_size - length + 1;

    num_ranges_ = num_ranges;

    for (int start = 1; start <= num_ranges; start++) {
        ranges_[start - 1].clear();
        for (int i = 0; i < length; i++)
            ranges_[start - 1].add(start + i);
    }
}

void RuleRenban::init_ranges_including_values(int length, int min_value, int max_value) {
    const int board_size = board_->size();

    int min_start = std::max(1, max_value - length + 1);
    int max_start = std::min(board_size - length + 1, min_value);

    int range_idx = 0;
    for (int start = min_start; start <= max_start; start++) {
        int end = start + length - 1;

        // Check if all solved values are within this range [start, end]
        bool all_included = true;
        for (int i = 0; i < solved_values_.size(); i++) {
            int val = solved_values_[i];
            if (val < start || val > end) {
                all_included = false;
                break;
            }
        }

        if (!all_included)
            continue;

        ranges_[range_idx].clear();
        for (int i = 0; i < length; i++)
            ranges_[range_idx].add(start + i);
        range_idx++;
    }

    num_ranges_ = range_idx;
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

        solved_values_.add(cell.value);
    }

    if (!solved_values_.empty())
        init_ranges_including_values(length, min_value, max_value);
    else
        init_all_consecutive_ranges(length);

    NumberSet allowed(board_size);
    for (int range_idx = 0; range_idx < num_ranges_; range_idx++) {
        const auto &range = ranges_[range_idx];
        for (int i = 0; i < range.size(); i++)
            allowed.add(range[i]);
    }

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
