#include "rule_extra_regions.h"
#include "../board/board.h"
#include "rule_standard.h"


namespace sudoku {

bool RuleExtraRegions::number_changed(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);
    bool changed = false;

    NumberSet rm(cell.max_number, cell.value);
    for (const auto &region: m_extra_regions) {
        if (!region.has(pos))
            continue;

        for (const auto &item: region.items()) {
            Cell &target = board_->get_cell(item);
            if (!target.is_solved())
                changed |= target.remove_candidates(rm);
        }
    }

    return changed;
}

bool RuleExtraRegions::candidates_changed() {
    bool changed = false;
    for (auto &unit: m_extra_units)
        changed |= hidden_singles(board_, unit);
    return changed;
}

bool RuleExtraRegions::valid() {
    for (auto &unit: m_extra_units)
        if (!check_group(unit))
            return false;
    return true;
}

void RuleExtraRegions::update_impact(ImpactMap &map) {
    for (const auto &region: m_extra_regions) {
        for (const auto &item: region.items()) {
            Cell &cell = board_->get_cell(item);
            if (cell.is_solved())
                continue;
            map.increment(item);
        }
    }
}

void RuleExtraRegions::from_json(JSON &json) {
    m_extra_regions.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            m_extra_regions.push_back(region);
            // create a unit for each region
            std::vector<Cell *> unit;
            for (const auto &pos: region.items()) {
                Cell &cell = board_->get_cell(pos);
                unit.push_back(&cell);
            }
            m_extra_units.push_back(unit);
        }
    }
}

// private member functions

bool RuleExtraRegions::check_group(const std::vector<Cell *> &unit) {
    const int board_size = board_->size();

    NumberSet seen(board_size);
    seen.clear();
    NumberSet combined(board_size);

    for (const auto &c: unit) {
        if (c->is_solved()) {
            if (seen.test(c->value))
                return false;
            seen.add(c->value);
            combined |= NumberSet(c->max_number, c->value);
        } else {
            combined |= c->get_candidates();
        }
    }

    return combined.count() >= static_cast<int>(unit.size());
}

} // namespace sudoku
