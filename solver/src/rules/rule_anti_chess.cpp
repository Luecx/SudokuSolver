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
    const Cell &cell = board_->get_cell(pos);

    bool changed = false;
    for (int i = 0; i < 2; i++) {
        const auto &pair = m_pair[i];
        if (!pair.enabled)
            continue;

        if (pair.region.size() > 0 && !pair.region.has(pos))
            continue; // skip if cell is not in the region

        changed |= check_cage(pair.region, pair.allow_repeats);

        const auto &forbidden_sums = pair.forbidden_sums;
        const attacks &pattern = (pair.label == "Anti-Knight") ? KNIGHT_PATTERN : KING_PATTERN;

        for (const auto &attack: pattern) {
            CellIdx neighbor_pos = {pos.r + attack.first, pos.c + attack.second};
            if (!in_bounds(neighbor_pos))
                continue;

            if (pair.region.size() > 0 && !pair.region.has(neighbor_pos))
                continue; // skip if neighbor is not in the region

            Cell &neighbor = board_->get_cell(neighbor_pos);
            if (neighbor.is_solved())
                continue; // skip solved neighbors

            changed |= neighbor.remove_candidate(cell.value);
            if (pair.forbidden_sums.empty())
                return changed;

            for (const auto n: neighbor.candidates) {
                int sum = cell.value + n;

                auto it = std::find(forbidden_sums.begin(), forbidden_sums.end(), sum);
                if (it != forbidden_sums.end())
                    changed |= neighbor.remove_candidate(n);
            }
        }
    }

    return changed;
}

bool RuleAntiChess::candidates_changed() {
    bool changed = false;
    for (int i = 0; i < 2; i++) {
        const auto &pair = m_pair[i];
        if (!pair.enabled)
            continue;
        changed |= check_cage(pair.region, pair.allow_repeats);

        /*
            you could technically use this code to remove candidates from c2
            and c1 (if you run the exact same code with c1 and c2 swapped)
            only if both are empty, this actually reduces nodes explored
            but it is SLOW, so this probably needs more testing, for now leave it commented out

            const Cell &c1 = board_->get_cell(pos);
            Cell &c2 = board_->get_cell(c2);

            for (const auto n: c2.candidates) {
                bool disalowed = true;
                for (const auto n2: c1.candidates) {
                    int sum = n2 + n;

                    auto it = std::find(pair.forbidden_sums.begin(), pair.forbidden_sums.end(), sum);
                    if (it == pair.forbidden_sums.end()) {
                        disalowed = false;
                        break;
                    }
                }

                if (disalowed)
                    changed |= c2.remove_candidate(n);
            }
        */
    }
    return changed;
}

bool RuleAntiChess::valid() {
    const int board_size = board_->size();

    for (int i = 0; i < 2; i++) {
        if (!m_pair[i].enabled)
            continue;

        const Region<CellIdx> &region = m_pair[i].region;
        if (!is_cage_valid(region, m_pair[i].allow_repeats))
            return false;

        const std::vector<int> &forbidden_sums = m_pair[i].forbidden_sums;
        const attacks &move_pattern = (m_pair[i].label == "Anti-Knight") ? KNIGHT_PATTERN : KING_PATTERN;

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
                    auto it = std::find(forbidden_sums.begin(), forbidden_sums.end(), cell.value + neighbor.value);
                    if (it != forbidden_sums.end())
                        return false;
                }
            }
        }
    }

    return true;
}

void RuleAntiChess::update_impact(ImpactMap &map) {
    for (int i = 0; i < 2; i++) {
        if (!m_pair[i].enabled)
            continue;

        const Region<CellIdx> &region = m_pair[i].region;
        const attacks &move_pattern = (m_pair[i].label == "Anti-Knight") ? KNIGHT_PATTERN : KING_PATTERN;

        for (const auto &pos: region.items()) {
            for (const auto &attack: move_pattern) {
                CellIdx neighbor_pos{pos.r + attack.first, pos.c + attack.second};
                if (!in_bounds(neighbor_pos))
                    continue;

                map.increment(neighbor_pos);
            }
        }
    }
};

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

        m_pair[count].label = label;
        m_pair[count].enabled = enabled;
        m_pair[count].allow_repeats = number_can_repeat;
        m_pair[count].region = region;
        m_pair[count].forbidden_sums = getForbiddenSums(forbidden_sums);
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
        if (!cell.is_solved())
            continue;

        if (seen.test(cell.value))
            return false;
        seen.add(cell.value);
    }

    return true;
}

bool RuleAntiChess::check_cage(const Region<CellIdx> &region, bool allow_repeats) {
    if (allow_repeats || region.size() == 0)
        return false;

    m_remaining_cells.clear();

    const int board_size = board_->size();
    NumberSet seen_values(board_size);

    // collect solved values and remaining cells
    for (const auto &item: region) {
        Cell &cell = board_->get_cell(item);

        if (cell.is_solved()) {
            if (seen_values.test(cell.value))
                return false; // duplicate found
            seen_values.add(cell.value);
        } else {
            m_remaining_cells.add(cell.pos);
        }
    }

    if (m_remaining_cells.size() == 0)
        return false; // all cells filled

    // remove seen values from remaining cells' candidates
    bool changed = false;
    for (const auto &pos: m_remaining_cells) {
        Cell &cell = board_->get_cell(pos);

        for (int d = 1; d <= board_size; d++)
            if (cell.candidates.test(d) && seen_values.test(d))
                changed |= cell.remove_candidate(d);
    }

    return changed;
}

// helper

std::vector<int> RuleAntiChess::getForbiddenSums(const std::string input) {
    std::vector<int> forbidden_sums;
    if (input.empty())
        return forbidden_sums;

    std::istringstream ss(input);
    std::string token;

    while (std::getline(ss, token, ',') && forbidden_sums.size() < 18) { // max possible number of sums is 18
        // trim whitespace
        size_t start = token.find_first_not_of(" \t\n\r\f\v");
        if (start == std::string::npos)
            continue;

        size_t end = token.find_last_not_of(" \t\n\r\f\v");
        token = token.substr(start, end - start + 1);

        try {
            forbidden_sums.push_back(std::stoi(token));
        } catch (...) {
            // skip invalid numbers
        }
    }

    return forbidden_sums;
}

} // namespace sudoku
