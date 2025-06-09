#include "rule_renban.h"
#include "../board/board.h"


namespace sudoku {

RuleRenban::RuleRenban(Board *board) : RuleHandler(board), m_solved_values(board->size()) {}

bool RuleRenban::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &path: m_paths) {
        if (!path.has(pos))
            continue;
        changed |= enforce_renban(path);
    }
    return changed;
}

bool RuleRenban::candidates_changed() {
    bool changed = false;
    for (const auto &path: m_paths)
        changed |= enforce_renban(path);
    return changed;
}

void RuleRenban::update_impact(ImpactMap &map) {
    for (const auto &path: m_paths) {
        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                continue;
            map.increment(pos);
        }
    }
}

bool RuleRenban::valid() {
    for (const auto &path: m_paths) {
        m_solved_values.clear();
        for (const auto &pos: path) {
            const Cell &cell = board_->get_cell(pos);
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
    m_paths.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1)
            m_paths.push_back(path);
    }
}

// private member functions

bool RuleRenban::filter_range_based(const Region<CellIdx> &path, int min_val, int max_val) {
    const int board_size = board_->size();

    bool changed = false;
    if (min_val > 1 || max_val < board_size) {
        NumberSet invalid = NumberSet::greaterThan(board_size, max_val) | NumberSet::lessThan(board_size, min_val);
        for (const auto &pos: path)
            changed |= board_->get_cell(pos).remove_candidates(invalid);
    }
    return changed;
}

bool RuleRenban::enforce_renban(const Region<CellIdx> &path) {
    // collect solved cells
    m_solved_values.clear();
    int free_cells = 0;

    int min_cand = board_->size() + 1;
    int max_cand = 0;

    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);
        min_cand = std::min(min_cand, int(cell.candidates.lowest()));
        max_cand = std::max(max_cand, int(cell.candidates.highest()));

        if (cell.is_solved())
            m_solved_values.add(cell.value);
        else
            free_cells++;
    }

    // if no cells are solved, check if we can filter some candidates
    if (m_solved_values.size() == 0)
        return filter_range_based(path, min_cand, max_cand);

    const int length = path.size();

    // Berechne Grenzen für die konsekutive Sequenz
    int min_solved = m_solved_values.min();
    int max_solved = m_solved_values.max();

    int min_start = std::max(1, max_solved - length + 1);
    int max_start = std::min(board_->size() - length + 1, min_solved);

    // check if range is valid
    if (min_start > max_start)
        return false;

    return filter_range_based(path, min_start, max_start + length - 1);
}

} // namespace sudoku
