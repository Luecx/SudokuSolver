#include "rule_renban.h"
#include "../board/board.h"


namespace sudoku {

RuleRenban::RuleRenban(Board *board) : RuleHandler(board), m_solved_values(board->size()) {
    const int board_size = board->size();
    m_ranges = std::make_unique<RenbanType[]>(board_size);
    for (int i = 0; i < board_size; i++) {
        new (&m_ranges[i]) RenbanType(board_size);
    }
}

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
        m_solved_values.clear();

        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (!cell.is_solved())
                break;
            m_solved_values.add(cell.value);
        }

        if (m_solved_values.size() != static_cast<int>(path.size()))
            continue;

        m_solved_values.sort();
        for (int i = 1; i < m_solved_values.size(); i++)
            if (m_solved_values[i] != m_solved_values[i - 1] + 1)
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
    m_num_ranges = board_->size() - length + 1;
    for (int start = 1; start <= m_num_ranges; start++) {
        m_ranges[start - 1].clear();
        for (int i = 0; i < length; i++)
            m_ranges[start - 1].add(start + i);
    }
}

void RuleRenban::init_ranges_including_values(int length, int min_value, int max_value) {
    int min_start = std::max(1, max_value - length + 1);
    int max_start = std::min(board_->size() - length + 1, min_value);

    int range_idx = 0;
    for (int start = min_start; start <= max_start; start++) {
        int end = start + length - 1;

        // Check if all solved values are within this range [start, end]
        bool all_included = true;
        for (int i = 0; i < m_solved_values.size(); i++) {
            int val = m_solved_values[i];
            if (val < start || val > end) {
                all_included = false;
                break;
            }
        }

        if (!all_included)
            continue;

        m_ranges[range_idx].clear();
        for (int i = 0; i < length; i++)
            m_ranges[range_idx].add(start + i);
        range_idx++;
    }

    m_num_ranges = range_idx;
}

bool RuleRenban::enforce_renban(const Region<CellIdx> &path) {
    const int board_size = board_->size();
    bool changed = false;

    int min_value = board_size + 1;
    int max_value = 0;

    // collect solved values
    m_solved_values.clear();
    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);
        if (!cell.is_solved())
            continue;

        int val = cell.value;
        min_value = std::min(min_value, val);
        max_value = std::max(max_value, val);

        m_solved_values.add(cell.value);
    }

    if (!m_solved_values.empty())
        init_ranges_including_values(path.size(), min_value, max_value);
    else
        init_all_consecutive_ranges(path.size());

    NumberSet allowed(board_size);
    for (int range_idx = 0; range_idx < m_num_ranges; range_idx++) {
        const auto &range = m_ranges[range_idx];
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
