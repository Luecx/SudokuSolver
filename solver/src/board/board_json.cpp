#include <stdexcept>
#include "../rules/include.h"
#include "board.h"


namespace sudoku {

void Board::from_json(JSON &json) {
    if (!json.is_object())
        throw std::runtime_error("Board JSON must be an object");

    // --- Rules ---
    if (json["rules"].is_array()) {
        for (JSON &rule_entry: json["rules"].get<JSON::array>()) {
            if (!rule_entry.is_object())
                throw std::runtime_error("Each rule must be an object");

            std::string type = rule_entry["type"].get<std::string>();
            std::shared_ptr<RuleHandler> handler;

            if (type == "Standard") {
                handler = std::make_shared<RuleStandard>(this);
            } else if (type == "Kropki") {
                handler = std::make_shared<RuleKropki>(this);
            } else if (type == "XV") {
                handler = std::make_shared<RuleXV>(this);
            } else if (type == "Chevron") {
                handler = std::make_shared<RuleChevron>(this);
            } else if (type == "Extra Regions" || type == "Extra-Regions") {
                handler = std::make_shared<RuleExtraRegions>(this);
            } else if (type == "Killer" || type == "Custom Sum") {
                handler = std::make_shared<RuleKiller>(this);
            } else if (type == "Clone") {
                handler = std::make_shared<RuleClone>(this);
            } else if (type == "Irregular Regions" || type == "Irregular-Regions") {
                handler = std::make_shared<RuleIrregular>(this);
            } else if (type == "Magic Square") {
                handler = std::make_shared<RuleMagic>(this);
            } else if (type == "Palindrome") {
                handler = std::make_shared<RulePalindrome>(this);
            } else if (type == "Thermo" || type == "Thermos") {
                handler = std::make_shared<RuleThermo>(this);
            } else if (type == "Parity") {
                handler = std::make_shared<RuleParity>(this);
            } else if (type == "Diagonal") {
                handler = std::make_shared<RuleDiagonal>(this);
            } else if (type == "Renban") {
                handler = std::make_shared<RuleRenban>(this);
            } else if (type == "Whisper") {
                handler = std::make_shared<RuleWhisper>(this);
            } else if (type == "Arrow") {
                handler = std::make_shared<RuleArrow>(this);
            } else if (type == "Anti-Chess") {
                handler = std::make_shared<RuleAntiChess>(this);
            } else if (type == "Sandwich") {
                handler = std::make_shared<RuleSandwich>(this);
            } else if (type == "Diagonal Sum") {
                handler = std::make_shared<RuleDiagonalSum>(this);
            } else if (type == "Dutch-Flat") {
                handler = std::make_shared<RuleDutchFlat>(this);
            } else if (type == "Numbered-Rooms") {
                handler = std::make_shared<RuleNumberedRooms>(this);
            } else if (type == "Wild Apples") {
                handler = std::make_shared<RuleWildApples>(this);
            } else {
                throw std::runtime_error("Unknown rule type: " + type);
            }

            handler->from_json(rule_entry); // let handler parse fields and nested rules
            add_handler(handler);
        }
    }

    // --- Fixed Cells ---
    if (json["fixedCells"].is_array()) {
        for (const auto &cell_json: json["fixedCells"].get<JSON::array>()) {
            Row r = static_cast<Row>(cell_json["r"].get<double>());
            Col c = static_cast<Col>(cell_json["c"].get<double>());
            Number val = static_cast<Number>(cell_json["value"].get<double>());

            set_cell(CellIdx{r, c}, val, true);
        }
    }

    // Optionally update impact map right away
    update_impact_map();
}

} // namespace sudoku
