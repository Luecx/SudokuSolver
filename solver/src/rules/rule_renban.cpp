#include "rule_renban.h"
#include "../board/board.h"


namespace sudoku {

bool RuleRenban::number_changed(CellIdx pos) {
    bool changed = false;

    return changed;
}

bool RuleRenban::candidates_changed() {
    bool changed = false;


    return changed;
}

bool RuleRenban::valid() {
 

    return true;
}

void RuleRenban::from_json(JSON &json) {
    renban_paths_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1)
            renban_paths_.push_back(path);
    }
}

// private member functions



} // namespace sudoku
