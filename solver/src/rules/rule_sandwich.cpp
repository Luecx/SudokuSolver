#include "rule_sandwich.h"
#include "../board/board.h"

namespace sudoku {

RuleSandwich::~RuleSandwich() {
    delete[] m_min_digits;
    delete[] m_max_digits;
}

bool RuleSandwich::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &pair: m_pairs) {
        const Region<RCIdx> &region = pair.region;
        for (const auto &rcidx: region.items()) {
            if (rcidx.row != pos.r && rcidx.col != pos.c)
                continue;
            changed |= check_sandwich(rcidx, pair.sum);
        }
    }
    return changed;
}

bool RuleSandwich::candidates_changed() {
    bool changed = false;
    for (const auto &pair: m_pairs) {
        const Region<RCIdx> &region = pair.region;
        for (const auto &rcidx: region.items())
            changed |= check_sandwich(rcidx, pair.sum);
    }
    return changed;
};

void RuleSandwich::update_impact(ImpactMap &map) {
    for (const auto &pair: m_pairs) {
        const Region<RCIdx> &region = pair.region;
        auto cell_reg = region.attached_cells(this->board_->size());
        map.increment_region(cell_reg);
    }
};

bool RuleSandwich::valid() {
    const int board_size = board_->size();

    for (const auto &pair: m_pairs) {
        const Region<RCIdx> &region = pair.region;
        const int sum = pair.sum;

        for (const auto &pos: region.items()) {
            std::vector<Cell *> &line = getLine(pos);

            int idx1 = -1, idxBoardSize = -1;
            for (int i = 0; i < board_size; i++) {
                if (line[i]->value == 1)
                    idx1 = i;
                if (line[i]->value == board_size)
                    idxBoardSize = i;
            }

            if (idx1 < 0 || idxBoardSize < 0)
                continue;

            const int left = std::min(idx1, idxBoardSize);
            const int right = std::max(idx1, idxBoardSize);

            bool skip = false;

            int actual = 0;
            for (int i = left + 1; i < right; i++) {
                if (!line[i]->is_solved()) {
                    skip = true;
                    break;
                }
                actual += line[i]->value;
            }

            if (skip)
                continue;

            if (actual != sum)
                return false;
        }
    }

    return true;
}

void RuleSandwich::from_json(JSON &json) {
    m_pairs.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("sum"))
            continue;

        Region<RCIdx> region = Region<RCIdx>::from_json(rule["fields"]["region"]);
        int sum = static_cast<int>(rule["fields"]["sum"].get<double>());

        if (sum != 0) {
            SandwichPair pair;
            pair.region = region;
            pair.sum = sum;

            m_pairs.push_back(pair);
        }
    }

    initTables();
}

// private member function

void RuleSandwich::initTables() {
    const int board_size = board_->size();
    const int max_sum = (board_size * (board_size + 1)) / 2;

    m_valid_union_sets.assign(max_sum + 1, std::vector<NumberSet>(board_size + 1, NumberSet(board_size)));
    m_min_digits = new int[max_sum + 1]();
    m_max_digits = new int[max_sum + 1]();

    std::fill(m_min_digits, m_min_digits + max_sum + 1, board_size + 1);

    // Generate all digit combinations excluding 1 and board_size
    for (int mask = 1; mask < (1 << board_size); mask++) {
        const NumberSet::bit_t bits = mask << 1;
        NumberSet cands(board_size, bits);

        int sum = 0, count = 0;
        for (int d = 1; d <= board_size; ++d) {
            if (cands.test(d)) {
                sum += d;
                count++;
                // Skip if contains bread digits
                if (d == 1 || d == board_size)
                    goto next_mask;
            }
        }

        if (count > 0 && sum <= max_sum) {
            m_valid_union_sets[sum][count] |= cands;
            m_min_digits[sum] = std::min(m_min_digits[sum], count);
            m_max_digits[sum] = std::max(m_max_digits[sum], count);
        }

    next_mask:;
    }

    // Reset impossible sums
    for (int s = 0; s <= max_sum; s++)
        if (m_min_digits[s] > board_size)
            m_min_digits[s] = m_max_digits[s] = 0;
}

bool RuleSandwich::check_unkown_digits(int idx1, int idxBoardSize, int minD, int maxD, const RCIdx &pos) {
    const int board_size = board_->size();
    const std::vector<Cell *> &line = getLine(pos);

    bool changed = false;
    for (int i = 0; i < board_size; i++) {
        Cell &c = *line[i];
        if (c.is_solved())
            continue;

        bool has_1 = false, has_board_size = false;

        // check if this position can form valid sandwich with any other position
        for (int j = 0; j < board_size; j++) {
            if (j == i)
                continue;

            const Cell &peer = *line[j];
            int dist = std::abs(j - i) - 1;

            if (dist >= minD && dist <= maxD) {
                if (peer.value == 1 || (!peer.is_solved() && peer.candidates.test(1))) {
                    has_1 = true;
                }
                if (peer.value == board_size || (!peer.is_solved() && peer.candidates.test(board_size))) {
                    has_board_size = true;
                }
            }

            if (has_1 && has_board_size)
                break;
        }

        // remove bread digits that can't form valid sandwiches
        if (c.candidates.test(1) && !has_board_size)
            changed |= c.remove_candidate(1);
        if (c.candidates.test(board_size) && !has_1)
            changed |= c.remove_candidate(board_size);
    }

    return changed;
}

bool RuleSandwich::check_sandwich(const RCIdx &pos, const int sum) {
    std::vector<Cell *> &line = getLine(pos);
    const int board_size = board_->size();
    const int minD = m_min_digits[sum];
    const int maxD = m_max_digits[sum];

    // Find bread digits
    int idx1 = -1, idxBoardSize = -1;
    for (int i = 0; i < board_size; i++) {
        if (line[i]->value == 1)
            idx1 = i;
        if (line[i]->value == board_size)
            idxBoardSize = i;
    }

    bool changed = false;

    if (idx1 == -1 && idxBoardSize == -1) {
        return check_unkown_digits(idx1, idxBoardSize, minD, maxD, pos);
    } else if (idx1 == -1 || idxBoardSize == -1) {
        // One bread digit known - constrain the other
        const int known_idx = (idx1 != -1) ? idx1 : idxBoardSize;
        const int unknown_digit = (idx1 != -1) ? board_size : 1;

        for (int i = 0; i < board_size; i++) {
            Cell &c = *line[i];
            if (c.is_solved() || !c.candidates.test(unknown_digit))
                continue;

            int dist = std::abs(i - known_idx) - 1;
            if (dist < minD || dist > maxD)
                changed |= c.remove_candidate(unknown_digit);
        }
    } else {
        // Both bread digits known - constrain filling digits
        const int left = std::min(idx1, idxBoardSize);
        const int right = std::max(idx1, idxBoardSize);
        const int between = right - left - 1;

        if (between >= minD && between <= maxD) {
            const NumberSet &valid_digits = m_valid_union_sets[sum][between];

            for (int i = left + 1; i < right; i++) {
                Cell &c = *line[i];
                if (c.is_solved())
                    continue;

                for (int d = 1; d <= board_size; d++)
                    if (c.candidates.test(d) && !valid_digits.test(d))
                        changed |= c.remove_candidate(d);
            }
        }
    }

    return changed;
}

std::vector<Cell *> &RuleSandwich::getLine(const RCIdx &pos) {
    return (pos.is_row()) ? board_->get_row(pos.row) : board_->get_col(pos.col);
}

} // namespace sudoku
