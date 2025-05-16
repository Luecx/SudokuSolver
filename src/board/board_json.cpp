#include "board.h"
#include "../rules/rule_kropki.h"
#include <stdexcept>

namespace sudoku {

void Board::from_json(JSON& json) {
    if (!json.is_object())
        throw std::runtime_error("Board JSON must be an object");

    // --- Fixed Cells ---
    if (json["fixedCells"].is_array()) {
        for (const auto& cell_json : json["fixedCells"].get<JSON::array>()) {
            Row r = static_cast<Row>(cell_json["r"].get<double>());
            Col c = static_cast<Col>(cell_json["c"].get<double>());
            Number val = static_cast<Number>(cell_json["value"].get<double>());

            set_cell(CellIdx{r, c}, val, true);
        }
    }

    // --- Rules ---
    if (json["rules"].is_array()) {
        for (JSON& rule_entry : json["rules"].get<JSON::array>()) {
            if (!rule_entry.is_object())
                throw std::runtime_error("Each rule must be an object");

            std::string type = rule_entry["type"].get<std::string>();

            std::shared_ptr<RuleHandler> handler;

            if (type == "Kropki") {
                handler = std::make_shared<RuleKropki>(this);
            } else {
                 throw std::runtime_error("Unknown rule type: " + type);
            }

            handler->from_json(rule_entry); // let handler parse fields and nested rules
            add_handler(handler);
        }
    }

    // Optionally update impact map right away
    update_impact_map();
}

} // namespace sudoku
