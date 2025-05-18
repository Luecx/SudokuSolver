#include "rule_parity.h"
#include "../board/board.h"


namespace sudoku {

bool RuleParity::number_changed(CellIdx pos) {
    bool changed = false;
    Cell &cell = board_->get_cell(pos);

    return changed;
}

bool RuleParity::candidates_changed() {
    bool changed = false;


    return changed;
}

bool RuleParity::valid() { return true; }

void RuleParity::from_json(JSON &json) {
    parity_paths_.clear();
    parity_units_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1) { // only accept paths with more than 1 cell
            parity_paths_.push_back(path);
            // create a unit for each path
            std::vector<Cell *> unit;
            for (const auto &c: path.items()) {
                Cell &cell = board_->get_cell(c);
                unit.push_back(&cell);
            }
            parity_units_.push_back(unit);
        }
    }
}

} // namespace sudoku
