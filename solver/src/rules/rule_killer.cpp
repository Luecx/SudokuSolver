#include <utility>

#include "../board/board.h"
#include "rule_killer.h"


namespace sudoku {

// cage helper function

int maxSum(int small, int N, int maxC, bool number_can_repeat_) {
    if (number_can_repeat_) {
        return small + (N - 1) * maxC;
    } else {
        int total = small;
        int val = maxC;
        for (int i = 0; i < N - 1; ++i)
            total += val--;
        return total;
    }
}

int minSum(int large, int N, int minC, bool number_can_repeat_) {
    if (number_can_repeat_) {
        return large + (N - 1) * minC;
    } else {
        int total = large;
        int val = minC;
        for (int i = 0; i < N - 1; ++i)
            total += val++;
        return total;
    }
}

int lowerBound(int N, int sum, int maxC, int size, bool number_can_repeat_) {
    for (int low = 1; low <= maxC - (number_can_repeat_ ? 0 : N - 1); ++low)
        if (maxSum(low, N, maxC, number_can_repeat_) >= sum)
            return low;
    return size + 1;
}

int upperBound(int N, int sum, int minC, int size, bool number_can_repeat_) {
    for (int high = size; high >= minC + (number_can_repeat_ ? 0 : N - 1); --high)
        if (minSum(high, N, minC, number_can_repeat_) <= sum)
            return high;
    return 0;
}

std::pair<int, int> getSoftBounds(int N, int sum, int minC, int maxC, int size, bool number_can_repeat_) {
    int min = lowerBound(N, sum, maxC, size, number_can_repeat_);
    int max = upperBound(N, sum, minC, size, number_can_repeat_);
    return {min, max};
}

// RuleKiller methods

bool RuleKiller::number_changed(CellIdx pos) {
    bool changed = false;

    for (const auto &pair: m_cage_pair) {
        const Region<CellIdx> &region = pair.region;

        if (!region.has(pos))
            continue;

        for (auto &pair: m_cage_pair)
            changed |= check_cage(pair);
        break; // regions can't overlap
    }

    return changed;
}

bool RuleKiller::candidates_changed() {
    bool changed = false;
    for (auto &pair: m_cage_pair)
        changed |= check_cage(pair);
    return changed;
}

bool RuleKiller::valid() {
    for (auto &pair: m_cage_pair)
        if (!check_group(pair))
            return false;
    return true;
}

void RuleKiller::from_json(JSON &json) {
    m_cage_pair.clear();

    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("NumberCanRepeat"))
        m_number_can_repeat = json["fields"]["NumberCanRepeat"].get<bool>();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("sum"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            KillerPair cage_pair;
            cage_pair.region = region;
            cage_pair.sum = static_cast<int>(rule["fields"]["sum"].get<double>());
            m_cage_pair.push_back(cage_pair);
        }
    }
}

// private member functions

bool RuleKiller::check_cage(KillerPair &pair) {
    const int board_size = board_->size();
    m_remaining_cells.clear();

    int sum = 0;
    NumberSet seen_values(board_size);

    Number min_candidate = board_size;
    Number max_candidate = 1;

    for (const auto &item: pair.region) {
        Cell &cell = board_->get_cell(item);

        if (cell.is_solved()) {
            sum += cell.value;

            if (!m_number_can_repeat && seen_values.test(cell.value)) {
                return false;
            }

            if (!m_number_can_repeat)
                seen_values.add(cell.value);
        } else {
            m_remaining_cells.add(cell.pos);
            min_candidate = std::min(min_candidate, cell.candidates.lowest());
            max_candidate = std::max(max_candidate, cell.candidates.highest());
        }
    }

    auto [min, max] = getSoftBounds(m_remaining_cells.size(), pair.sum - sum, min_candidate, max_candidate, board_size,
                                    m_number_can_repeat);

    bool changed = false;
    for (const auto &item: m_remaining_cells) {
        Cell &cell = board_->get_cell(item);

        for (Number d = 1; d <= board_size; ++d) {
            if (!cell.candidates.test(d))
                continue;

            if (!m_number_can_repeat && seen_values.test(d))
                changed |= cell.remove_candidate(d);
            else if (d < min || d > max)
                changed |= cell.remove_candidate(d);
        }
    }

    return changed;
}

bool RuleKiller::check_group(const KillerPair &pair) const {
    int sum = 0;
    sudoku::NumberSet seen_values(board_->size());

    for (const auto &item: pair.region) {
        Cell &cell = board_->get_cell(item);

        if (cell.is_solved()) {
            sum += cell.value;

            if (!m_number_can_repeat && seen_values.test(cell.value)) {
                return false; // number already seen, repetition not allowed
            }

            if (!m_number_can_repeat)
                seen_values.add(cell.value);
        }
    }

    // if all cells in the cage are filled, check if sum matches target
    if (seen_values.count() == static_cast<int>(pair.region.size()) && sum != pair.sum)
        return false;

    return true;
}

} // namespace sudoku
