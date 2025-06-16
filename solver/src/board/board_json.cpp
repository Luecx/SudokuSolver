#include <algorithm>
#include <cctype>
#include <fstream>
#include <stdexcept>

#include "../rules/include.h"
#include "board.h"

namespace sudoku {

std::string normalize_rule_type(const std::string &type) {
    std::string normalized = type;

    // Convert to lowercase
    std::transform(normalized.begin(), normalized.end(), normalized.begin(), ::tolower);

    // Remove hyphens and spaces
    normalized.erase(std::remove(normalized.begin(), normalized.end(), '-'), normalized.end());
    normalized.erase(std::remove(normalized.begin(), normalized.end(), ' '), normalized.end());
    normalized.erase(std::remove(normalized.begin(), normalized.end(), '_'), normalized.end());

    return normalized;
}

void Board::from_json(JSON &json) {
    if (!json.is_object())
        throw std::runtime_error("Board JSON must be an object");

    // --- Rules ---
    if (json["rules"].is_array()) {
        for (JSON &rule_entry: json["rules"].get<JSON::array>()) {
            if (!rule_entry.is_object())
                throw std::runtime_error("Each rule must be an object");

            std::string type = rule_entry["type"].get<std::string>();
            std::string normalized_type = normalize_rule_type(type);
            std::shared_ptr<RuleHandler> handler;

            if (normalized_type == "standard") {
                handler = std::make_shared<RuleStandard>(this);
            } else if (normalized_type == "kropki") {
                handler = std::make_shared<RuleKropki>(this);
            } else if (normalized_type == "xv") {
                handler = std::make_shared<RuleXV>(this);
            } else if (normalized_type == "chevron") {
                handler = std::make_shared<RuleChevron>(this);
            } else if (normalized_type == "extraregions") {
                handler = std::make_shared<RuleExtraRegions>(this);
            } else if (normalized_type == "killer") {
                handler = std::make_shared<RuleKiller>(this);
            } else if (normalized_type == "clone") {
                handler = std::make_shared<RuleClone>(this);
            } else if (normalized_type == "irregularregions") {
                handler = std::make_shared<RuleIrregularRegions>(this);
            } else if (normalized_type == "magicsquare") {
                handler = std::make_shared<RuleMagic>(this);
            } else if (normalized_type == "palindrome") {
                handler = std::make_shared<RulePalindrome>(this);
            } else if (normalized_type == "thermo") {
                handler = std::make_shared<RuleThermo>(this);
            } else if (normalized_type == "parity") {
                handler = std::make_shared<RuleParity>(this);
            } else if (normalized_type == "diagonal") {
                handler = std::make_shared<RuleDiagonal>(this);
            } else if (normalized_type == "renban") {
                handler = std::make_shared<RuleRenban>(this);
            } else if (normalized_type == "whisper") {
                handler = std::make_shared<RuleWhisper>(this);
            } else if (normalized_type == "arrow") {
                handler = std::make_shared<RuleArrow>(this);
            } else if (normalized_type == "antichess") {
                handler = std::make_shared<RuleAntiChess>(this);
            } else if (normalized_type == "sandwich") {
                handler = std::make_shared<RuleSandwich>(this);
            } else if (normalized_type == "diagonalsum") {
                handler = std::make_shared<RuleDiagonalSum>(this);
            } else if (normalized_type == "dutchflat") {
                handler = std::make_shared<RuleDutchFlat>(this);
            } else if (normalized_type == "numberedrooms") {
                handler = std::make_shared<RuleNumberedRooms>(this);
            } else if (normalized_type == "wildapples") {
                handler = std::make_shared<RuleWildApples>(this);
            } else if (normalized_type == "customsum") {
                handler = std::make_shared<RuleCustomSum>(this);
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

void Board::to_json(const std::string file_path) const {
    JSON json = JSON(JSON::object{});

    // create fixedCells array
    JSON::array fixed_cells;
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            const Cell &cell = grid_[r][c];
            if (cell.value != 0) {
                JSON cell_json = JSON(JSON::object{});
                cell_json["r"] = static_cast<double>(r);
                cell_json["c"] = static_cast<double>(c);
                cell_json["value"] = static_cast<double>(cell.value);
                fixed_cells.push_back(cell_json);
            }
        }
    }
    json["fixedCells"] = fixed_cells;

    // create rules array
    JSON::array rules;
    for (const auto &handler: handlers_) {
        try {
            rules.push_back(handler->to_json());
        } catch (const std::exception &e) {
            std::cerr << "Error parsing rule JSON: " << e.what() << std::endl;
            std::cerr << "JSON string was: " << handler->to_json() << std::endl;
            throw;
        }
    }
    json["rules"] = rules;

    // write to file
    std::ofstream file_stream(file_path);
    if (file_stream.is_open()) {
        file_stream << json;
        file_stream.close();
    } else {
        throw std::runtime_error("Could not open file for writing: " + file_path);
    }
}

} // namespace sudoku
