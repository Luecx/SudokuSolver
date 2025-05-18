#include <array>
#include <set>

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
    bool changed = false;
    for (const auto &region: magic_regions_) {
        const std::vector<CellIdx> &items = region.items();

        initPossibleLayouts(region);
        if (possible_layouts_.empty())
            continue;
        changed |= applyCandidates(region);
    }
    return changed;
}

bool RuleMagic::candidates_changed() {
    bool changed = false;
    for (const auto &region: magic_regions_) {
        initPossibleLayouts(region);
        if (possible_layouts_.empty())
            continue;
        changed |= applyCandidates(region);
    }
    return changed;
}

bool RuleMagic::valid() {
    for (const auto &region: magic_regions_) {
        initPossibleLayouts(region);
        if (possible_layouts_.empty())
            return false;
    }
    return true;
}

void RuleMagic::from_json(JSON &json) {
    magic_regions_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (!is3x3Square(region))
            continue;

        if (region.size() > 0) {
            // sort region
            std::sort(region.begin(), region.end(),
                      [](const CellIdx &a, const CellIdx &b) { return (a.r != b.r) ? (a.r < b.r) : (a.c < b.c); });

            magic_regions_.push_back(region);
        }
    }
}

// private member functions

bool RuleMagic::is3x3Square(const Region<CellIdx> &region) {
    if (region.size() != 9)
        return false;

    std::set<int> rows;
    std::set<int> cols;

    for (const auto &idx: region.items()) {
        rows.insert(idx.r);
        cols.insert(idx.c);
    }

    return rows.size() == 3 && cols.size() == 3;
}

bool RuleMagic::isValidLayout(const Region<CellIdx> &region, const std::array<int, 9> &layout) {
    const std::vector<CellIdx> &items = region.items();

    for (int i = 0; i < items.size(); i++) {
        const Cell &cell = board_->get_cell(items[i]);
        if (cell.value != 0 && cell.value != layout[i])
            return false;
    }

    return true;
}

void RuleMagic::initPossibleLayouts(const Region<CellIdx> &region) {
    possible_layouts_.clear();
    for (const auto &layout: MAGIC_SQUARE_SOLUTIONS)
        if (isValidLayout(region, layout))
            possible_layouts_.push_back(layout);
}

bool RuleMagic::applyCandidates(const Region<CellIdx> &region) {
    bool changed = false;

    const std::vector<CellIdx> &items = region.items();

    for (int i = 0; i < items.size(); i++) {
        Cell &cell = board_->get_cell(items[i]);
        if (cell.is_solved())
            continue;

        NumberSet allowed(cell.max_number);
        for (const auto &layout: possible_layouts_)
            allowed.add(layout[i]);

        // remove candidates that are not in the layout
        for (int j = 1; j <= cell.max_number; j++)
            if (cell.candidates.test(j) && !allowed.test(j))
                changed |= cell.remove_candidate(j);
    }

    return changed;
}

} // namespace sudoku
