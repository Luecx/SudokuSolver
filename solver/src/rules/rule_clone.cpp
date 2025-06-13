#include <set>

#include "../board/board.h"
#include "rule_clone.h"

namespace sudoku {

bool RuleClone::number_changed(CellIdx pos) {
    bool changed = false;
    Cell &cell = board_->get_cell(pos);

    for (const auto &group: m_units) {
        if (group.size() < 2)
            continue;

        // Find the region and position index containing our cell
        int changed_region_idx = -1;
        int changed_item_idx = -1;

        for (const int region_idx: group) {
            changed_item_idx = m_regions[region_idx].find_index(pos);
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

            const Region<CellIdx> &region = m_regions[region_idx];
            const CellIdx &pos2 = region.items()[changed_item_idx];
            Cell &cell2 = board_->get_cell(pos2);

            changed |= cell2.only_allow_candidates(NumberSet(cell2.max_number, cell.value));
        }
    }

    return changed;
}

bool RuleClone::candidates_changed() {
    bool changed = false;

    for (const auto &group: m_units) {
        if (group.size() < 2)
            continue;

        const int region_size = m_regions[group.front()].size();
        for (int item_idx = 0; item_idx < region_size; item_idx++) {
            NumberSet common_cands = NumberSet::full(board_->size());

            for (const int region_idx: group) {
                const Cell &cell = board_->get_cell(m_regions[region_idx].items()[item_idx]);
                if (cell.is_solved())
                    continue;
                common_cands &= cell.get_candidates();
            }

            for (const int region_idx: group) {
                Cell &cell = board_->get_cell(m_regions[region_idx].items()[item_idx]);
                if (cell.is_solved())
                    continue;
                changed |= cell.only_allow_candidates(common_cands);
            }
        }
    }

    return changed;
}

bool RuleClone::valid() {
    for (const auto &group: m_units) {
        if (group.size() < 2)
            continue;

        const int region_size = m_regions[group.front()].size();
        for (int item_idx = 0; item_idx < region_size; item_idx++) {
            int first_value = -1;

            for (const int region_idx: group) {
                const Cell &cell = board_->get_cell(m_regions[region_idx].items()[item_idx]);

                if (!cell.is_solved())
                    continue;

                if (first_value == -1)
                    first_value = cell.value;
                else if (cell.value != first_value)
                    return false;
            }
        }
    }

    return true;
}

void RuleClone::update_impact(ImpactMap &map) {
    for (const auto &group: m_units) {
        if (group.size() < 2) // skip if no clone exists
            continue;

        for (const auto &region_idx: group) {
            const auto &region = m_regions[region_idx];
            for (const auto &pos: region.items())
                map.increment(pos);
        }
    }
}

void RuleClone::from_json(JSON &json) {
    m_regions.clear();
    m_units.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0)
            m_regions.push_back(region);
    }

    initCloneGroups();
}

JSON RuleClone::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Clone";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();
    for (const auto &region: m_regions) {
        JSON rule = JSON(JSON::object{});

        JSON fields = JSON(JSON::object{});
        fields["region"] = region.to_json();
        fields["color"] = rule_utils::random_rgba_color();

        rule["fields"] = fields;
        rules.push_back(rule);
    }
    json["rules"] = rules;

    return json;
}

void RuleClone::init_randomly() { initCloneGroups(); }

// private member function

void RuleClone::initCloneGroups() {
    const int max_regions = m_regions.size();
    std::vector<bool> processed(max_regions, false);

    for (int i = 0; i < max_regions; i++) {
        if (processed[i])
            continue;

        std::vector<int> clones = {i};
        processed[i] = true;

        for (int j = i + 1; j < max_regions; j++) {
            if (processed[j])
                continue;

            if (isSameShape(m_regions[i], m_regions[j])) {
                clones.push_back(j);
                processed[j] = true;
            }
        }

        m_units.push_back(clones);
    }

    // sort cells within each region for easier comparison
    for (const auto &group: m_units) {
        for (int regionIdx: group) {
            auto &region = m_regions[regionIdx];
            std::sort(region.begin(), region.end(),
                      [](const CellIdx &a, const CellIdx &b) { return a.r < b.r || (a.r == b.r && a.c < b.c); });
        }
    }
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

    for (const auto &pos: region1.items())
        shape1.emplace(pos.r - minRow1, pos.c - minCol1);
    for (const auto &pos: region2.items())
        shape2.emplace(pos.r - minRow2, pos.c - minCol2);

    return shape1 == shape2;
}

} // namespace sudoku
