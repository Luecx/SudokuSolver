#include "rule_anti_chess.h"
#include "../board/board.h"

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

        const attacks &pattern = (pair.label == "Anti-Knight") ? KNIGHT_PATTERN : KING_PATTERN;
        for (const auto &attack: pattern) {
            CellIdx neighbor_pos = {pos.r + attack.first, pos.c + attack.second};
            if (!in_bounds(neighbor_pos))
                continue; // skip out of bounds neighbors

            if (pair.region.size() > 0 && !pair.region.has(neighbor_pos))
                continue; // skip if neighbor is not in the region

            Cell &neighbor = board_->get_cell(neighbor_pos);
            if (neighbor.is_solved())
                continue; // skip solved neighbors

            changed |= neighbor.remove_candidate(cell.value);

            // enforce forbidden sums
            if (pair.forbidden_sums.empty())
                continue;

            for (const auto n: neighbor.candidates) {
                if (contains_sum(cell.value + n, pair.forbidden_sums))
                    changed |= neighbor.remove_candidate(n);
            }
        }
    }

    return changed;
}

bool RuleAntiChess::candidates_changed() {
    // const int board_size = board_->size();

    bool changed = false;
    for (int i = 0; i < 2; i++) {
        const auto &pair = m_pair[i];
        if (!pair.enabled)
            continue;

        const Region<CellIdx> &region = pair.region;
        changed |= check_cage(region, pair.allow_repeats);

        // this helps reducing node count but it is very slow
        /*
        if (pair.forbidden_sums.empty())
            continue; // skip if no forbidden sums

        const attacks &move_pattern = (pair.label == "Anti-Knight") ? KNIGHT_PATTERN : KING_PATTERN;

        for (int r = 0; r < board_size; r++) {
            for (int c = 0; c < board_size; c++) {
                CellIdx pos{r, c};

                Cell &cell = board_->get_cell(pos);
                if (cell.is_solved())
                    continue;

                if (!region.has(pos))
                    continue; // skip if cell is not in the region

                for (const auto &attack: move_pattern) {
                    CellIdx neighbor_pos{r + attack.first, c + attack.second};
                    if (!in_bounds(neighbor_pos))
                        continue;

                    if (!region.has(neighbor_pos))
                        continue; // skip if neighbor is not in the region

                    Cell &neighbor = board_->get_cell(neighbor_pos);
                    if (neighbor.is_solved())
                        continue; // skip solved neighbors

                    changed |= enforce_forbidden_sums(cell, neighbor, pair);
                    changed |= enforce_forbidden_sums(neighbor, cell, pair);
                }
            }
        }*/
    }

    return changed;
}

bool RuleAntiChess::valid() {
    const int board_size = board_->size();

    for (int i = 0; i < 2; i++) {
        const auto &pair = m_pair[i];

        if (!pair.enabled)
            continue;

        const Region<CellIdx> &region = pair.region;
        if (!is_cage_valid(region, pair.allow_repeats))
            return false;

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

                    if (contains_sum(cell.value + neighbor.value, pair.forbidden_sums))
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

bool RuleAntiChess::enforce_forbidden_sums(const Cell &c1, Cell &c2, const AntiChessPair &pair) {
    // if a certain candidate always ends up being in the forbidden sums
    // then we can remove it as a candidate from c2

    if (c1.candidates.count() > 4 || c2.candidates.count() > 5)
        return false; // skip optimization

    bool changed = false;
    for (const auto n: c2.candidates) {
        bool disallowed = true;
        for (const auto n2: c1.candidates) {
            int sum = n2 + n;

            if (!contains_sum(sum, pair.forbidden_sums)) {
                disallowed = false;
                break;
            }
        }

        if (disallowed)
            changed |= c2.remove_candidate(n);
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

    while (std::getline(ss, token, ',') && forbidden_sums.size() < 6) {
        // trim whitespace
        size_t start = token.find_first_not_of(" \t\n\r\f\v");
        if (start == std::string::npos)
            continue;

        size_t end = token.find_last_not_of(" \t\n\r\f\v");
        token = token.substr(start, end - start + 1);

        try {
            int forbidden_sum = std::stoi(token);
            if (forbidden_sum < 2 || forbidden_sum > board_->size() * 2)
                continue; // skip invalid sums
            forbidden_sums.push_back(forbidden_sum);
        } catch (...) {
            // skip invalid numbers
        }
    }

    // sort
    std::sort(forbidden_sums.begin(), forbidden_sums.end());
    // remove duplicates
    forbidden_sums.erase(std::unique(forbidden_sums.begin(), forbidden_sums.end()), forbidden_sums.end());

    return forbidden_sums;
}

} // namespace sudoku
