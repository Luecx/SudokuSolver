#include "rule_palindrome.h"
#include "../board/board.h"


namespace sudoku {

// RuleMagic member functions

bool RulePalindrome::number_changed(CellIdx pos) {
    bool changed = false;

    for (auto &unit: palindrome_units_) {
        const int unit_size = unit.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = *unit[i];
            Cell &b = *unit[unit_size - i - 1];

            changed |= enforce_symmetry(a, b);
            changed |= enforce_symmetry(b, a);
        }
    }

    return changed;
}

bool RulePalindrome::candidates_changed() {
    bool changed = false;

    for (auto &unit: palindrome_units_) {
        const int unit_size = unit.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = *unit[i];
            Cell &b = *unit[unit_size - i - 1];

            changed |= enforce_symmetry(a, b);
            changed |= enforce_symmetry(b, a);
        }
    }

    return changed;
}

bool RulePalindrome::valid() {
    bool changed = false;
    // code below doesn't work
    /*
    for (auto &unit: palindrome_units_) {
        const int unit_size = unit.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = *unit[i];
            Cell &b = *unit[unit_size - i - 1];

            NumberSet intersection = a.candidates & b.candidates;
            changed |= a.only_allow_candidates(intersection);
            changed |= b.only_allow_candidates(intersection);
        }
    }*/
    return changed;
}

void RulePalindrome::from_json(JSON &json) {
    palindrome_units_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (region.size() > 1) { // only accept paths with more than 1 cell
            // create a unit for each region
            std::vector<Cell *> unit;
            for (const auto &c: region.items()) {
                Cell &cell = board_->get_cell(c);
                unit.push_back(&cell);
            }
            palindrome_units_.push_back(unit);
        }
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
