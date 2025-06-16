#include "rule_extra_regions.h"
#include "../board/board.h"
#include "rule_standard.h"

namespace sudoku {

bool RuleExtraRegions::number_changed(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);
    bool changed = false;

    for (const auto &region: m_regions) {
        if (!region.has(pos))
            continue;

        for (const auto &item: region.items()) {
            Cell &target = board_->get_cell(item);
            if (!target.is_solved())
                changed |= target.remove_candidate(cell.value);
        }
    }

    return changed;
}

bool RuleExtraRegions::candidates_changed() { return false; }

bool RuleExtraRegions::valid() {
    const int board_size = board_->size();

    for (auto &region: m_regions) {
        NumberSet seen(board_size);
        NumberSet combined(board_size);

        for (const auto &pos: region) {
            Cell &cell = board_->get_cell(pos);

            if (cell.is_solved()) {
                if (seen.test(cell.value))
                    return false;
                seen.add(cell.value);
                combined |= NumberSet(cell.max_number, cell.value);
            } else {
                combined |= cell.get_candidates();
            }
        }

        return combined.count() >= static_cast<int>(region.size());
    }
    return true;
}

void RuleExtraRegions::update_impact(ImpactMap &map) {
    for (const auto &region: m_regions) {
        for (const auto &item: region.items()) {
            Cell &cell = board_->get_cell(item);
            if (cell.is_solved())
                continue;
            map.increment(item);
        }
    }
}

void RuleExtraRegions::from_json(JSON &json) {
    m_regions.clear();

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
}

JSON RuleExtraRegions::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Extra-Regions";
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

void RuleExtraRegions::init_randomly() {
    m_regions.clear();

    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<int> num_regions_dis(MIN_NUM_REGIONS, MAX_NUM_REGIONS);
    int num_regions = num_regions_dis(gen);

    std::uniform_int_distribution<int> region_size_dis(2, board_->size());

    Region<CellIdx> available_region = Region<CellIdx>::all(board_->size());

    for (int i = 0; i < num_regions; i++) {
        int region_size = region_size_dis(gen);
        Region<CellIdx> region = rule_utils::generate_random_region(board_, region_size, &available_region);

        if (region.size() > 0)
            m_regions.push_back(region);
    }
}

} // namespace sudoku
