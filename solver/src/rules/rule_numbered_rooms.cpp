#include <utility>

#include "../board/board.h"
#include "rule_numbered_rooms.h"


namespace sudoku {


bool RuleNumberedRooms::number_changed(CellIdx pos) {
    bool changed = false;

    return changed;
}

bool RuleNumberedRooms::candidates_changed() {
    bool changed = false;

    return changed;
}

bool RuleNumberedRooms::valid() {

    return true;
}

void RuleNumberedRooms::from_json(JSON &json) {
    numbered_rooms_pair_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("sum"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            NumberedRoomsPair cage_pair;
            cage_pair.region = region;
            cage_pair.sum = static_cast<int>(rule["fields"]["sum"].get<double>());
            numbered_rooms_pair_.push_back(cage_pair);
        }
    }
}

} // namespace sudoku
