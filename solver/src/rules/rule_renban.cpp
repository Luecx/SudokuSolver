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

bool RuleRenban::enforce_renban(const Region<CellIdx> &path) {
    const int board_size = board_->size();
    const int length = path.size();
    bool changed = false;

    // collect candidate bounds and solved values
    int min_cand = board_size + 1;
    int max_cand = 0;
    m_solved_values.clear();

    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);
        min_cand = std::min(min_cand, int(cell.candidates.lowest()));
        max_cand = std::max(max_cand, int(cell.candidates.highest()));

        if (cell.is_solved())
            m_solved_values.add(cell.value);
    }

    // remove candidates outside the global candidate range
    if (min_cand > 1 || max_cand < board_size) {
        NumberSet invalid_candidates =
                NumberSet::greaterThan(board_size, max_cand) | NumberSet::lessThan(board_size, min_cand);

        for (const auto &pos: path)
            changed |= board_->get_cell(pos).remove_candidates(invalid_candidates);
    }

    // if no solved values, we're done
    if (m_solved_values.empty()) {
        return changed;
    }

    const int num_solved = m_solved_values.size();
    const int min_solved = m_solved_values.min();
    const int max_solved = m_solved_values.max();

    // calculate valid range for the consecutive sequence
    int min_possible = std::max(1, max_solved - length + 1);
    int max_possible = std::min(board_size, min_solved + length - 1);

    // if multiple values are solved, ensure they can fit in a consecutive sequence
    if (num_solved > 1) {
        int solved_span = max_solved - min_solved + 1;
        int gaps_needed = solved_span - num_solved;
        int gaps_available = length - num_solved;

        if (gaps_needed > gaps_available)
            return changed; // invalid
    }

    // remove candidates outside the possible range
    if (min_possible > 1 || max_possible < board_size) {
        NumberSet invalid_range =
                NumberSet::greaterThan(board_size, max_possible) | NumberSet::lessThan(board_size, min_possible);

        for (const auto &pos: path)
            changed |= board_->get_cell(pos).remove_candidates(invalid_range);
    }

    return changed;
}

} // namespace sudoku
