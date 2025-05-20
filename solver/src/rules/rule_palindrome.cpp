#include "rule_palindrome.h"
#include "../board/board.h"


namespace sudoku {

// RuleMagic member functions

bool RulePalindrome::number_changed(CellIdx pos) {
    bool changed = false;

    for (auto &path: palindrome_paths_) {
        const std::vector<CellIdx> &items = path.items();

        const int unit_size = items.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = board_->get_cell(items[i]);
            Cell &b = board_->get_cell(items[unit_size - i - 1]);

            changed |= enforce_symmetry(a, b);
            changed |= enforce_symmetry(b, a);
        }
    }

    return changed;
}

bool RulePalindrome::candidates_changed() {
    bool changed = false;
    for (auto &path: palindrome_paths_) {
        const std::vector<CellIdx> &items = path.items();

        const int unit_size = items.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = board_->get_cell(items[i]);
            Cell &b = board_->get_cell(items[unit_size - i - 1]);

            NumberSet intersection = a.candidates & b.candidates;
            changed |= a.only_allow_candidates(intersection);
            changed |= b.only_allow_candidates(intersection);
        }
    }

    return changed;
}

bool RulePalindrome::valid() {
    for (auto &path: palindrome_paths_) {
        const std::vector<CellIdx> &items = path.items();

        const int unit_size = items.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = board_->get_cell(items[i]);
            Cell &b = board_->get_cell(items[unit_size - i - 1]);
            // if both cell values arent the same, then false
            if (a.is_solved() && b.is_solved() && a.value != b.value)
                return false;
        }
    }
    return true;
}

void RulePalindrome::update_impact(ImpactMap &map) {
    // this increases the node time with planindrom
    // so probably need more json data to test it
    return;
    for (auto &path: palindrome_paths_) {
        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                continue;
            map.increment(pos);
        }
    }
};

void RulePalindrome::from_json(JSON &json) {
    palindrome_paths_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1) // only accept paths with more than 1 cell
            palindrome_paths_.emplace_back(path);
    }
}

// private member functions

bool RulePalindrome::enforce_symmetry(Cell &a, Cell &b) {
    if (!a.is_solved() || b.is_solved())
        return false;

    // if "b" is not solved, but "a" is, then "b" must equal to the value of "a"
    return b.only_allow_candidates(NumberSet(board_->size(), a.value));
}

} // namespace sudoku
