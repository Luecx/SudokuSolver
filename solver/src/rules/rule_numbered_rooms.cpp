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
    json["type"] = "Numbered-Rooms";
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

void RuleNumberedRooms::init_randomly() {
    m_pairs.clear();

    static std::random_device rd;
    static std::mt19937 gen(rd());

    const int board_size = board_->size();

    std::uniform_int_distribution<int> num_rooms_dist(MIN_PAIRS, MAX_PAIRS);
    int num_rooms = num_rooms_dist(gen);

    std::uniform_int_distribution<int> region_size_dist(MIN_REGION_SIZE, MAX_REGION_SIZE);

    std::uniform_int_distribution<int> digit_dist(2, board_size);

    Region<ORCIdx> occupied_region;

    int attempts = 0;
    while ((int) m_pairs.size() < num_rooms && attempts < 100) {
        int region_size = region_size_dist(gen);
        Region<ORCIdx> region;

        int region_attempts = 0;
        while ((int) region.size() < region_size && region_attempts < 25) {
            // randomly select a row or column
            bool reversed = (rand() % 2 == 0);

            Row r = -1;
            Col c = -1;

            if (rand() % 2 == 0)
                r = rand() % board_size; // use row
            else
                c = rand() % board_size; // use col

            ORCIdx orc(r, c, reversed);
            if (occupied_region.has(orc))
                continue; // already used this row/column

            occupied_region.add(orc);
            region.add(orc);

            region_attempts++;
        }

        int digit = digit_dist(gen);
        m_pairs.push_back({region, digit});

        attempts++;
        if ((int) region.size() != region_size)
            break; // prevent infinite loop if not enough space
    }
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
