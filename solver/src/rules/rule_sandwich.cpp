#include "rule_sandwich.h"
#include "../board/board.h"

namespace sudoku {

bool RuleSandwich::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &pair: m_pairs) {
        const Region<RCIdx> &region = pair.region;
        const int sum = pair.sum;

        for (const auto &rcidx: region.items()) {
            if (rcidx.row != pos.r && rcidx.col != pos.c)
                continue;
            changed |= check_sandwich(rcidx, sum);
        }
    }
    return changed;
}

bool RuleSandwich::candidates_changed() {
    bool changed = false;
    for (const auto &pair: m_pairs) {
        const Region<RCIdx> &region = pair.region;
        const int sum = pair.sum;

        for (const auto &rcidx: region.items())
            changed |= check_sandwich(rcidx, sum);
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

        for (const auto &rcidx: region.items()) {
            initLine(rcidx);

            int idx1 = -1, idxBoardSize = -1;
            for (int i = 0; i < board_size; i++) {
                if (m_line[i]->value == 1)
                    idx1 = i;
                if (m_line[i]->value == board_size)
                    idxBoardSize = i;
            }

            if (idx1 < 0 || idxBoardSize < 0)
                continue;

            const int left = std::min(idx1, idxBoardSize);
            const int right = std::max(idx1, idxBoardSize);
            int actual = 0;

            for (int i = left + 1; i < right; i++) {
                if (!m_line[i]->is_solved())
                    return true;
                actual += m_line[i]->value;
            }

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

    generateSandwichTables();
}

// private member function

void RuleSandwich::generateSandwichTables() {
    const int board_size = board_->size();
    const int digit_min = 1;
    const int digit_max = board_size;
    const int num_digits = digit_max - digit_min + 1;
    const int max_sum = (digit_max * (digit_max + 1)) / 2;

    m_valid_combinations.resize(max_sum + 1);
    m_min_digits.resize(max_sum + 1, num_digits + 1);
    m_max_digits.resize(max_sum + 1, 0);

    for (int s = 0; s <= max_sum; s++)
        m_valid_combinations[s].resize(num_digits + 1);

    const int max_mask = 1 << num_digits;
    for (int mask = 1; mask < max_mask; mask++) {
        const NumberSet::bit_t bits = mask << 1;
        NumberSet cands(digit_max, bits);

        int sum = 0;
        int count = 0;
        bool has1 = false, hasBoardSize = false;

        for (int d = digit_min; d <= digit_max; ++d) {
            if (!cands.test(d))
                continue;
            sum += d;
            count++;
            has1 |= (d == 1);
            hasBoardSize |= (d == board_size);
        }

        if (has1 || hasBoardSize || sum > max_sum || count == 0)
            continue;

        m_valid_combinations[sum][count].push_back(cands);
        m_min_digits[sum] = std::min(m_min_digits[sum], count);
        m_max_digits[sum] = std::max(m_max_digits[sum], count);
    }

    for (int s = 0; s <= max_sum; s++)
        if (m_min_digits[s] > num_digits) {
            m_min_digits[s] = 0;
            m_max_digits[s] = 0;
        }
}

void RuleSandwich::initLine(const RCIdx &pos) {
    m_line.clear();
    const int board_size = board_->size();

    if (pos.row >= 0) {
        for (int c = 0; c < board_size; c++)
            m_line.push_back(&board_->get_cell({pos.row, c}));
    } else if (pos.col >= 0) {
        for (int r = 0; r < board_size; r++)
            m_line.push_back(&board_->get_cell({r, pos.col}));
    }
}

bool RuleSandwich::has_possible_pair(int i, int other_digit, int minD, int maxD) {
    const int line_size = m_line.size();
    for (int j = 0; j < line_size; j++) {
        if (j == i)
            continue;

        Cell &peer = *m_line[j];
        if (peer.value == other_digit || (!peer.is_solved() && peer.candidates.test(other_digit))) {
            int cnt = std::abs(j - i) - 1;
            if (cnt >= minD && cnt <= maxD)
                return true;
        }
    }

    return false;
}

bool RuleSandwich::check_sandwich(const RCIdx &pos, const int sum) {
    initLine(pos);

    const int board_size = board_->size();

    const int minD = m_min_digits[sum];
    const int maxD = m_max_digits[sum];
    int idx1 = -1, idxBoardSize = -1;
    bool changed = false;

    for (int i = 0; i < board_size; i++) {
        if (m_line[i]->value == 1)
            idx1 = i;
        if (m_line[i]->value == board_size)
            idxBoardSize = i;
    }

    if (idx1 == -1 && idxBoardSize == -1) {
        // Both bread digits are unknown
        for (int i = 0; i < board_size; i++) {
            Cell &c = *m_line[i];
            if (c.is_solved())
                continue;

            if (c.candidates.test(1) && !has_possible_pair(i, board_size, minD, maxD)) {
                changed |= c.remove_candidate(1);
            }

            if (c.candidates.test(board_size) && !has_possible_pair(i, 1, minD, maxD)) {
                changed |= c.remove_candidate(board_size);
            }
        }
    } else if (idx1 == -1 || idxBoardSize == -1) {
        // Only one bread digit is known
        const int known = (idx1 != -1) ? 1 : board_size;
        const int unknown = (known == 1) ? board_size : 1;
        const int idx_known = (known == 1) ? idx1 : idxBoardSize;

        for (int i = 0; i < board_size; i++) {
            Cell &c = *m_line[i];
            if (c.is_solved() || !c.candidates.test(unknown))
                continue;

            int dist = std::abs(i - idx_known) - 1;
            if (dist < minD || dist > maxD)
                changed |= c.remove_candidate(unknown);
        }
    } else {
        // Both bread digits are known
        const int left = std::min(idx1, idxBoardSize);
        const int right = std::max(idx1, idxBoardSize);
        const int between = right - left - 1;

        if (between >= minD && between <= maxD) {
            NumberSet union_set(board_size);
            for (const auto &comb: m_valid_combinations[sum][between])
                union_set |= comb;

            for (int i = left + 1; i < right; i++) {
                Cell &c = *m_line[i];
                if (c.is_solved())
                    continue;

                for (int d = 1; d <= board_size; d++)
                    if (c.candidates.test(d) && !union_set.test(d))
                        changed |= c.remove_candidate(d);
            }
        }
    }

    return changed;
}

} // namespace sudoku
