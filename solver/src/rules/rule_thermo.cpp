#include "rule_thermo.h"
#include "../board/board.h"


namespace sudoku {

bool RuleThermo::number_changed(CellIdx pos) {
    bool changed = false;
    Cell &cell = board_->get_cell(pos);

    for (const auto &path: m_paths) {
        const int idx = path.find_index(pos);
        if (idx == -1)
            continue;

        const int path_size = path.size();
        const std::vector<CellIdx> &items = path.items();

        int forward = idx;
        while (++forward < path_size) {
            Cell &cell_ = board_->get_cell(items[forward]);
            if (cell_.is_solved())
                continue;

            NumberSet mask = NumberSet::greaterThan(cell_.max_number, cell.value);
            changed |= cell_.only_allow_candidates(mask);
        }

        int backward = idx;
        while (--backward >= 0) {
            Cell &cell_ = board_->get_cell(items[backward]);
            if (cell_.is_solved())
                continue;

            NumberSet mask = NumberSet::lessThan(cell_.max_number, cell.value);
            changed |= cell_.only_allow_candidates(mask);
        }
    }

    return changed;
}

bool RuleThermo::candidates_changed() {
    bool changed = false;

    for (const auto &path: m_paths) {
        int prev_value = 0;

        const std::vector<CellIdx> &items = path.items();

        for (size_t i = 0; i < items.size(); ++i) {
            Cell &cell = board_->get_cell(items[i]);

            if (i == 0) {
                // nothing to do for bulb
                prev_value = cell.is_solved() ? cell.value : 0;
                continue;
            }

            Cell &prev_cell = board_->get_cell(items[i - 1]);
            if (prev_cell.is_solved()) {
                prev_value = prev_cell.value;
            } else {
                prev_value = prev_cell.candidates.lowest(); // fallback to lowest candidate
            }

            auto mask = NumberSet::greaterThan(cell.max_number, prev_value);
            changed |= cell.only_allow_candidates(mask);
        }
    }

    return changed;
}

bool RuleThermo::valid() {
    for (const auto &path: m_paths) {
        const std::vector<CellIdx> &items = path.items();

        for (size_t i = 1; i < items.size(); ++i) {
            Cell &a = board_->get_cell(items[i - 1]);
            Cell &b = board_->get_cell(items[i]);

            if (a.is_solved() && b.is_solved() && a.value >= b.value)
                return false;
        }
    }

    return true;
}

void RuleThermo::update_impact(ImpactMap &map) {
    for (const auto &path: m_paths) {
        const std::vector<CellIdx> &items = path.items();

        for (size_t i = 1; i < items.size(); i++) {
            Cell &a = board_->get_cell(items[i - 1]);
            Cell &b = board_->get_cell(items[i]);

            if (a.is_solved() && b.is_solved() && a.value >= b.value)
                continue;

            map.increment(items[i - 1]);
            map.increment(items[i]);
        }
    }
}

void RuleThermo::from_json(JSON &json) {
    m_paths.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1) // only accept paths with more than 1 cell
            m_paths.push_back(path);
    }
}

} // namespace sudoku
