#include "rule_numbered_rooms.h"
#include "../board/board.h"

namespace sudoku {

bool RuleNumberedRooms::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &pair: m_pairs) {
        const Region<ORCIdx> &region = pair.region;
        if (!region.has(ORCIdx(pos.r, -1, false)) && //
            !region.has(ORCIdx(pos.r, -1, true)) && //
            !region.has(ORCIdx(-1, pos.c, false)) && //
            !region.has(ORCIdx(-1, pos.c, true))) {
            continue;
        }
        changed |= enforce_numbered_rooms(pair);
    }
    return changed;
}

bool RuleNumberedRooms::candidates_changed() {
    bool changed = false;
    for (const auto &pair: m_pairs)
        changed |= enforce_numbered_rooms(pair);
    return changed;
}

bool RuleNumberedRooms::valid() {
    for (const auto &pair: m_pairs) {
        for (const auto &orc: pair.region) {
            Cell &first_cell = get_first_cell(orc);
            if (!first_cell.is_solved())
                continue;

            Cell &target_cell = get_target_cell(orc, first_cell.value - 1);
            if (!target_cell.candidates.test(pair.digit))
                return false;
        }
    }

    return true;
}

void RuleNumberedRooms::update_impact(ImpactMap &map) {
    for (const auto &pair: m_pairs) {
        for (const auto &orc: pair.region) {
            Cell &first_cell = get_first_cell(orc);
            if (!first_cell.is_solved())
                map.increment(first_cell.pos);
            /*
            unsure if this make it faster or slower
            probably needs more testing
            for (Number n = 1; n <= board_->size(); n++) {
                Cell &target_cell = get_target_cell(orc, n - 1);
                if (target_cell.candidates.test(pair.digit)) {
                    map.increment(target_cell.pos);
                }
            }*/
        }
    }
}

void RuleNumberedRooms::from_json(JSON &json) {
    m_pairs.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("digit"))
            continue;

        Region<ORCIdx> region = Region<ORCIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            NumberedRoomsPair pair;
            pair.region = region;
            pair.digit = static_cast<int>(rule["fields"]["digit"].get<double>());
            m_pairs.push_back(pair);

            for (const auto &orc: pair.region) {
                Cell &first_cell = get_first_cell(orc);
                // value 1 cannot be used in the first cell in numbered rooms
                first_cell.remove_candidate(Number(1));
            }
        }
    }
}

JSON RuleNumberedRooms::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "NumberedRooms";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();

    for (const auto &pair: m_pairs) {
        JSON rule = JSON(JSON::object{});
        JSON fields = JSON(JSON::object{});

        fields["region"] = pair.region.to_json();
        fields["digit"] = static_cast<double>(pair.digit);

        rule["fields"] = fields;
        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

// private member functions

bool RuleNumberedRooms::enforce_numbered_rooms(const NumberedRoomsPair &pair) {
    bool changed = false;
    for (const auto &orc: pair.region) {
        Cell &first_cell = get_first_cell(orc);
        if (!first_cell.is_solved()) {
            // check if we can find the digit in the target cells
            // if so, we know what first cell must be equal to
            for (Number n = 1; n <= board_->size(); n++) {
                Cell &target_cell = get_target_cell(orc, n - 1);
                if (target_cell.is_solved() && target_cell.value == pair.digit) {
                    changed |= first_cell.only_allow_candidates(NumberSet(first_cell.max_number, n));
                    break;
                }
            }
        } else {
            Cell &target_cell = get_target_cell(orc, first_cell.value - 1);
            changed |= target_cell.only_allow_candidates(NumberSet(first_cell.max_number, Number(pair.digit)));
        }
    }
    return changed;
}

Cell &RuleNumberedRooms::get_first_cell(const ORCIdx &orc) {
    int offset = orc.reversed ? board_->size() - 1 : 0;
    if (orc.is_row())
        return board_->get_cell(CellIdx(orc.row, offset));
    else
        return board_->get_cell(CellIdx(offset, orc.col));
}

Cell &RuleNumberedRooms::get_target_cell(const ORCIdx &orc, int offset) {
    offset = orc.reversed ? board_->size() - 1 - offset : offset;
    if (orc.is_row())
        return board_->get_cell(CellIdx(orc.row, offset));
    else
        return board_->get_cell(CellIdx(offset, orc.col));
}

} // namespace sudoku
