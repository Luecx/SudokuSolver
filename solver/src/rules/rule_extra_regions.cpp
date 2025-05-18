#include "rule_extra_regions.h"
#include "rule_standard.h"
#include "../board/board.h"


namespace sudoku {

bool RuleExtraRegions::number_changed(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);
    bool changed = false;
    
    NumberSet rm(cell.max_number, cell.value);
    for (const auto &region: extra_regions_) {
        if (!region.has(pos))
            continue;

        for (const auto &c: region.items()) {
            Cell &target = board_->get_cell(c);
            if (!target.is_solved())
                changed |= target.remove_candidates(rm);
        }
    }

    return changed;
}

bool RuleExtraRegions::candidates_changed() {
    bool changed = false;
    for (auto &unit: extra_units_)
        changed |= hidden_singles(board_, unit);
    return changed;
}

bool RuleExtraRegions::valid() {
    for (auto &unit: extra_units_)
        if (!check_group(unit))
            return false;
    return true;
}

void RuleExtraRegions::from_json(JSON &json) {
    extra_regions_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            extra_regions_.push_back(region);
            // create a unit for each region
            std::vector<Cell *> unit;
            for (const auto &c: region.items()) {
                Cell &cell = board_->get_cell(c);
                unit.push_back(&cell);
            }
            extra_units_.push_back(unit);
        }
    }
}

// private member functions

bool RuleExtraRegions::check_group(const std::vector<Cell *>& unit) {
    const int board_size = board_->size();

    NumberSet seen(board_size);
    seen.clear();
    NumberSet combined(board_size);

    for (const auto &c: unit) {
        if (c->is_solved()) {
            if (seen.test(c->value))
                return false;
            seen.add(c->value);
            combined = combined | NumberSet(c->max_number, c->value);
        } else {
            combined = combined | c->get_candidates();
        }
    }

    return combined.count() >= unit.size();
}

} // namespace sudoku
