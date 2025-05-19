#include <utility>

#include "../board/board.h"
#include "rule_anti_chess.h"


namespace sudoku {

// move patterns for Anti-Knight and Anti-King rules
using attacks = std::vector<std::pair<int, int>>;

// clang-format off
const attacks KNIGHT_PATTERN = {
    {-2, -1}, {-2, +1}, {-1, -2},
    {-1, +2},           {+1, -2},
    {+1, +2}, {+2, -1}, {+2, +1}
};

const attacks KING_PATTERN = {
    {-1, -1}, {-1, 0}, {-1, +1},
    { 0, -1},          { 0, +1},
    {+1, -1}, {+1, 0}, {+1, +1}
};
// clang-format on

// RuleCage methods

bool RuleAntiChess::number_changed(CellIdx pos) {
    Cell &cell = board_->get_cell(pos);
    bool changed = false;

    const int board_size = board_->size();
    for (int i = 0; i < 2; i++) {
        if (!pair[i].enabled)
            continue;

        const Region<CellIdx> &region = pair[i].region;
        const std::vector<int> &forbidden_sums = pair[i].forbidden_sums;

        if (region.size() > 0 && !region.has(pos))
            continue; // skip if cell is not in the region

        changed |= check_cage(region, pair[i].allow_repeats);

        const attacks &pattern = (pair[i].label == "Anti-Knight") ? KNIGHT_PATTERN : KING_PATTERN;

        for (const auto &attack: pattern) {
            CellIdx neighbor_pos = {pos.r + attack.first, pos.c + attack.second};
            if (!in_bounds(neighbor_pos))
                continue;

            Cell &neighbor = board_->get_cell(neighbor_pos);
            if (neighbor.is_solved())
                continue; // if filled, skip

            // determine if this neighbor should have constraints applied:
            // - if region doesn't exist or is empty, apply to all cells
            // - if region exists and has elements, only apply to cells in that region
            if (region.size() > 0 && !region.has(neighbor_pos))
                continue;

            // remove the changed cell's value from neighbor's candidates
            changed |= neighbor.remove_candidate(cell.value);

            if (forbidden_sums.empty())
                continue; // no sums to check

            for (const auto n: neighbor.candidates) {
                // check if the sum of the two cells is forbidden
                int sum = cell.value + n;
                if (std::find(forbidden_sums.begin(), forbidden_sums.end(), sum) != forbidden_sums.end())
                    changed |= neighbor.remove_candidate(n);
            }
        }
    }

    return changed;
}

bool RuleAntiChess::candidates_changed() {
    // TODO: add anti-chess here as well
    bool changed = false;
    for (int i = 0; i < 2; i++)
        changed |= check_cage(pair[i].region, pair[i].allow_repeats);
    return changed;
}

bool RuleAntiChess::valid() {
    const int board_size = board_->size();
    for (int i = 0; i < 2; i++) {
        if (!pair[i].enabled)
            continue;

        const std::vector<int> &forbidden_sums = pair[i].forbidden_sums;
        const Region<CellIdx> &region = pair[i].region;
        const attacks &move_pattern = (pair[i].label == "Anti-Knight") ? KNIGHT_PATTERN : KING_PATTERN;

        if (!is_cage_valid(region, pair[i].allow_repeats))
            return false;

        for (int r = 0; r < board_size; r++) {
            for (int c = 0; c < board_size; c++) {
                CellIdx pos{r, c};
                Cell &cell = board_->get_cell(pos);
                if (!cell.is_solved())
                    continue;

                if (region.size() > 0 && !region.has(pos))
                    continue; // skip if cell is not in the region

                for (const auto &attack: move_pattern) {
                    CellIdx neighbor_pos{r + attack.first, c + attack.second};
                    if (!in_bounds(neighbor_pos))
                        continue;

                    if (region.size() > 0 && !region.has(neighbor_pos))
                        continue; // skip if neighbor is not in the region

                    Cell &neighbor = board_->get_cell(neighbor_pos);
                    if (!neighbor.is_solved())
                        continue;

                    // if neighbor cell has the same value as the current cell, return false
                    if (neighbor.value == cell.value)
                        return false;

                    // if neighbor cell plus current cell's value is in the forbidden sums, return false
                    if (std::find(forbidden_sums.begin(), forbidden_sums.end(), cell.value + neighbor.value) !=
                        forbidden_sums.end())
                        return false;
                }
            }
        }
    }

    return true;
}

void RuleAntiChess::from_json(JSON &json) {
    if (!json["rules"].is_array())
        return;

    int count = 0;
    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("sums"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("enabled"))
            continue;

        std::string label = rule["label"].get<std::string>();
        bool enabled = rule["fields"]["enabled"].get<bool>();
        bool number_can_repeat = rule["fields"]["NumberCanRepeat"].get<bool>();
        std::string forbidden_sums = rule["fields"]["sums"].get<std::string>();

        Region<CellIdx> region;
        if (rule["fields"]["region"].is_object())
            region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        else
            region = Region<CellIdx>(); // anti-chess allows null regions

        pair[count].label = label;
        pair[count].enabled = enabled;
        pair[count].allow_repeats = number_can_repeat;
        pair[count].region = region;
        pair[count].forbidden_sums = getForbiddenSums(forbidden_sums);
        count++;

        if (count >= 2)
            break;
    }
}

// private member functions

bool RuleAntiChess::in_bounds(const CellIdx &pos) {
    return pos.r >= 0 && pos.r < board_->size() && pos.c >= 0 && pos.c < board_->size();
}

bool RuleAntiChess::is_cage_valid(const Region<CellIdx> &region, bool allow_repeats) {
    if (allow_repeats || region.size() == 0)
        return true;

    NumberSet seen(board_->size());
    for (const auto &pos: region.items()) {
        Cell &cell = board_->get_cell(pos);
        if (cell.is_solved()) {
            if (seen.test(cell.value))
                return false;
            seen.add(cell.value);
        }
    }

    return true;
}

bool RuleAntiChess::check_cage(const Region<CellIdx> &region, bool allow_repeats) {
    if (allow_repeats || region.size() == 0)
        return false;

    remaining_cells.clear();

    const int board_size = board_->size();
    NumberSet seen_values(board_size);

    for (const auto &item: region) {
        Cell &cell = board_->get_cell(item);

        if (cell.is_solved()) {
            if (!allow_repeats && seen_values.test(cell.value))
                return false;

            if (!allow_repeats)
                seen_values.add(cell.value);
        } else {
            remaining_cells.add(cell.pos);
        }
    }

    // if all cells are filled, no candidates to modify
    if (remaining_cells.size() == 0)
        return false;

    bool changed = false;
    for (const auto &pos: remaining_cells) {
        Cell &cell = board_->get_cell(pos);

        for (int d = 1; d <= board_size; d++) {
            if (!cell.candidates.test(d))
                continue;

            // check if value is already used and repeats aren't allowed
            if (!allow_repeats && seen_values.test(d))
                changed |= cell.remove_candidate(d);
        }
    }

    return changed;
}

std::vector<int> RuleAntiChess::getForbiddenSums(const std::string input) {
    std::vector<int> forbidden_sums;

    if (input.empty())
        return forbidden_sums;

    // split by comma
    std::istringstream ss(input);
    std::string token;

    const size_t MAX_SUMS = 18;

    while (std::getline(ss, token, ',') && forbidden_sums.size() < MAX_SUMS) {
        // trim whitespace
        token.erase(0, token.find_first_not_of(" \t\n\r\f\v"));
        token.erase(token.find_last_not_of(" \t\n\r\f\v") + 1);

        if (token.empty())
            continue;

        try {
            int number = std::stoi(token);
            forbidden_sums.push_back(number);
        } catch (const std::exception &) {
            // skip non-integer values
        }
    }

    return forbidden_sums;
}


} // namespace sudoku
