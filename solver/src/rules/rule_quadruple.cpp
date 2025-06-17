#include "rule_quadruple.h"
#include "../board/board.h"

namespace sudoku {

bool RuleQuadruple::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &pair: m_pairs) {
        Region<CellIdx> region_cells = pair.region.attached_cells();
        if (!region_cells.has(pos))
            continue;

        NumberSet missing = pair.values;
        for (const auto &pos: region_cells) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                missing.remove(cell.value);
        }

        Region<CellIdx> candidates;
        for (const auto &pos: region_cells) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                continue;

            if ((cell.candidates & missing).count() > 0)
                candidates.add(pos);
        }

        if ((int) candidates.size() == missing.count()) {
            for (const auto &pos: candidates) {
                Cell &cell = board_->get_cell(pos);
                changed = cell.only_allow_candidates(missing);
            }
        }
    }

    return changed;
}


bool RuleQuadruple::candidates_changed() {
    return false; // unnecessary for this rule
}

bool RuleQuadruple::valid() {
    for (const auto &pair: m_pairs) {
        Region<CellIdx> region_cells = pair.region.attached_cells();

        int value_count = 0;
        for (const CellIdx &pos: region_cells)
            value_count += (board_->get_cell(pos).candidates & pair.values).count() > 0;

        if (value_count < pair.values.count())
            return false;
    }

    return true;
}

void RuleQuadruple::update_impact(ImpactMap &map) {
    for (const auto &pair: m_pairs) {
        Region<CellIdx> region_cells = pair.region.attached_cells();
        map.increment_region(region_cells, 1);
    }
}

void RuleQuadruple::from_json(JSON &json) {
    m_pairs.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CornerIdx> region = Region<CornerIdx>::from_json(rule["fields"]["region"]);
        std::string values = rule["fields"]["values"].get<std::string>();

        if (region.size() > 0) {
            std::vector<int> values_vec = rule_utils::parseValues(values, board_->size());
            NumberSet values_set(board_->size());
            for (int value: values_vec)
                values_set.add(value);
            m_pairs.push_back({region, values_set});
        }
    }
}

JSON RuleQuadruple::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Quadruple";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules_array;
    for (const auto &pair: m_pairs) {
        JSON::object fields;
        fields["region"] = pair.region.to_json();

        std::string values_str;
        int i = 0;
        for (const auto n: pair.values) {
            if (i++ > 0)
                values_str += ",";
            values_str += std::to_string(n);
        }
        fields["values"] = values_str;

        JSON::object rule;
        rule["fields"] = fields;

        rules_array.push_back(rule);
    }

    return JSON(JSON::object{{"__type__", "RuleQuadruple"}, {"rules", rules_array}});
}

} // namespace sudoku
