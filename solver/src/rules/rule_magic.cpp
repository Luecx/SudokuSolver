#include <array>

#include "../board/board.h"
#include "rule_magic.h"


namespace sudoku {

// All 8 valid 3×3 magic square layouts
// clang-format off
const std::array<std::array<int, 9>, 8> MAGIC_SQUARE_SOLUTIONS = 
{{
    {8, 1, 6, 3, 5, 7, 4, 9, 2},
    {6, 7, 2, 1, 5, 9, 8, 3, 4},
    {2, 9, 4, 7, 5, 3, 6, 1, 8},
    {4, 3, 8, 9, 5, 1, 2, 7, 6},
    {6, 1, 8, 7, 5, 3, 2, 9, 4},
    {4, 9, 2, 3, 5, 7, 8, 1, 6},
    {2, 7, 6, 9, 5, 1, 4, 3, 8},
    {8, 3, 4, 1, 5, 9, 6, 7, 2}
}};
// clang-format on

// RuleMagic member functions

bool RuleMagic::number_changed(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);
    bool changed = false;

    return changed;
}

bool RuleMagic::candidates_changed() {
    bool changed = false;

    return changed;
}

bool RuleMagic::valid() { return true; }

void RuleMagic::from_json(JSON &json) {
    magic_regions_.clear();
    magic_units_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            magic_regions_.push_back(region);
            // create a unit for each region
            std::vector<Cell *> unit;
            for (const auto &c: region.items()) {
                Cell &cell = board_->get_cell(c);
                unit.push_back(&cell);
            }
            magic_units_.push_back(unit);
        }
    }
}

// private member functions


} // namespace sudoku
