#include <set>
#include <unordered_set>
#include <utility>

#include "../board/board.h"
#include "rule_clone.h"


namespace sudoku {

bool RuleClone::number_changed(CellIdx pos) {
    bool changed = false;
    Cell &cell = board_->get_cell(pos);

    for (const auto &group: clone_groups_) {
        if (group.size() < 2)
            continue;

        // Find the region and position index containing our cell
        int changed_region_idx = -1;
        int changed_item_idx = -1;

        for (const int region_idx: group) {
            changed_item_idx = clone_regions_[region_idx].find_index(pos);
            if (changed_item_idx != -1) {
                changed_region_idx = region_idx;
                break;
            }
        }

        if (changed_region_idx == -1)
            continue;

        // process all other regions in the group
        for (const int region_idx: group) {
            if (region_idx == changed_region_idx)
                continue;

            const auto &region = clone_regions_[region_idx];
            const auto pos2 = region.items()[changed_item_idx];
            Cell &cell2 = board_->get_cell(pos2);

            changed |= cell2.only_allow_candidates(NumberSet(cell2.max_number, cell.value));
        }
    }

    return changed;
}

bool RuleClone::candidates_changed() { return false; }

bool RuleClone::valid() {
    for (const auto &group: clone_groups_) {
        if (group.size() < 2) // skip if no clone exists
            continue;

        const int region_size = clone_regions_[group[0]].size(); // used only to obtain the size
        for (int item_idx = 0; item_idx < region_size; item_idx++) {
            int value = -1;

            for (const int region_idx: group) {
                const auto pos = clone_regions_[region_idx].items()[item_idx];
                Cell &cell = board_->get_cell(pos);

                if (!cell.is_solved())
                    continue;

                if (value == -1)
                    value = cell.value;
                else if (value != cell.value)
                    return false; // different values in the same clone
            }
        }
    }

    return true;
}

void RuleClone::from_json(JSON &json) {
    clone_regions_.clear();
    clone_units_.clear();
    clone_groups_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            clone_regions_.push_back(region);
            // create a unit for each region
            std::vector<Cell *> cells;
            for (const auto &c: region.items()) {
                Cell &cell = board_->get_cell(c);
                cells.push_back(&cell);
            }
            clone_units_.push_back(cells);
        }
    }

    clone_groups_ = findCloneGroups();
}

// private member function

// finds the index of the clones
std::vector<std::vector<int>> RuleClone::findCloneGroups() {
    std::vector<std::vector<int>> cloneGroups;
    std::unordered_set<int> processed;

    for (int i = 0; i < clone_regions_.size(); i++) {
        // skip if already processed
        if (processed.count(i) > 0)
            continue;

        const auto &region = clone_regions_[i];
        std::vector<int> clones = {i};

        for (int j = i + 1; j < clone_regions_.size(); j++) {
            if (processed.count(j) > 0)
                continue;

            if (isSameShape(region, clone_regions_[j])) {
                clones.push_back(j);
                processed.insert(j);
            }
        }

        processed.insert(i);
        cloneGroups.push_back(clones);
    }

    // sort cells within each region for easier comparison
    for (const auto &group: cloneGroups) {
        for (int regionIdx: group) {
            auto &region = clone_regions_[regionIdx];

            // sort cells by row, then by column
            std::sort(region.begin(), region.end(), [](const CellIdx pos1, const CellIdx pos2) {
                if (pos1.r != pos2.r)
                    return pos1.r < pos2.r; // sort by row first
                else
                    return pos1.c < pos2.c; // for same row, sort by column
            });
        }
    }

    return cloneGroups;
}

bool RuleClone::isSameShape(const Region<CellIdx> &region1, const Region<CellIdx> &region2) {
    if (region1.size() != region2.size())
        return false;

    if (region1.size() == 0)
        return true; // two empty regions have the same shape

    // find minimum coordinates in each region
    int minRow1 = INT_MAX, minCol1 = INT_MAX;
    int minRow2 = INT_MAX, minCol2 = INT_MAX;

    for (const auto &pos: region1.items()) {
        minRow1 = std::min(minRow1, pos.r);
        minCol1 = std::min(minCol1, pos.c);
    }

    for (const auto &pos: region2.items()) {
        minRow2 = std::min(minRow2, pos.r);
        minCol2 = std::min(minCol2, pos.c);
    }

    // create normalized representations using a bitset
    std::set<std::pair<int, int>> shape1, shape2;

    for (const auto &pos: region1.items()) {
        shape1.emplace(pos.r - minRow1, pos.c - minCol1);
    }

    for (const auto &pos: region2.items()) {
        shape2.emplace(pos.r - minRow2, pos.c - minCol2);
    }

    // Compare normalized shapes
    return shape1 == shape2;
}

} // namespace sudoku
