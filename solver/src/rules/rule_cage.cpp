#include <unordered_set>
#include <utility>

#include "../board/board.h"
#include "rule_cage.h"


namespace sudoku {

// RuleCage methods

bool RuleCage::number_changed(CellIdx pos) {
    bool changed = false;

    for (const auto &region: cages_) {
        if (!region.has(pos))
            continue;

        for (auto &unit: cage_units_)
            changed |= check_cage(unit);
        break; // regions can't overlap
    }

    return changed;
}

bool RuleCage::candidates_changed() {
    bool changed = false;
    for (auto &unit: cage_units_)
        changed |= check_cage(unit);
    return changed;
}

bool RuleCage::valid() {
    for (auto &unit: cage_units_)
        if (!check_group(unit))
            return false;
    return true;
}

void RuleCage::from_json(JSON &json) {
    cages_.clear();

    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("NumberCanRepeat"))
        number_can_repeat_ = json["fields"]["NumberCanRepeat"].get<bool>();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            cages_.push_back(region);
            // create a unit for each region
            std::vector<Cell *> cells;
            for (const auto &c: region.items()) {
                Cell &cell = board_->get_cell(c);
                cells.push_back(&cell);
            }

            CageUnit cage_unit;
            cage_unit.cells = cells;
            cage_unit.sum = static_cast<int>(rule["fields"]["sum"].get<double>());

            cage_units_.push_back(cage_unit);
        }
    }
}

// private member functions

bool RuleCage::check_cage(CageUnit &unit) const {
    const int board_size = board_->size();
    std::vector<Cell *> remaining_cells;

    int filled_counts = 0;
    int sum = 0;
    std::unordered_set<int> seen_values;

    for (auto *cell: unit.cells) {
        if (cell->is_solved()) {
            sum += cell->value;
            filled_counts++;

            if (!number_can_repeat_ && !seen_values.insert(cell->value).second) {
                return false;
            }
        } else {
            remaining_cells.push_back(cell);
        }
    }

    Number min_candidate = board_size;
    Number max_candidate = 1;

    for (auto *cell: remaining_cells) {
        for (Number d = 1; d <= board_size; ++d) {
            if (!cell->candidates.test(d))
                continue;

            min_candidate = std::min(min_candidate, d);
            max_candidate = std::max(max_candidate, d);
        }
    }

    auto [min, max] = getSoftBounds(remaining_cells.size(), unit.sum - sum, min_candidate, max_candidate, board_size);

    bool changed = false;
    for (auto *cell: remaining_cells) {
        for (Number d = 1; d <= board_size; ++d) {
            if (!cell->candidates.test(d))
                continue;

            if (!number_can_repeat_ && seen_values.count(d))
                changed |= cell->remove_candidate(d);
            else if (d < min || d > max)
                changed |= cell->remove_candidate(d);
        }
    }

    return changed;
}

bool RuleCage::check_group(const CageUnit &unit) const {
    const int board_size = board_->size();

    int filled_counts = 0;
    int sum = 0;
    std::unordered_set<int> seen_values;

    for (const auto *cell: unit.cells)
        if (cell->is_solved()) {
            sum += cell->value;
            filled_counts++;

            if (!number_can_repeat_ && !seen_values.insert(cell->value).second) {
                return false;
            }
        }

    if (filled_counts == unit.cells.size() && sum != unit.sum)
        return false;

    return true;
}

int RuleCage::maxSum(int small, int N, int maxC) const {
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

int RuleCage::lowerBound(int N, int sum, int maxC, int size) const {
    for (int low = 1; low <= maxC - (number_can_repeat_ ? 0 : N - 1); ++low)
        if (maxSum(low, N, maxC) >= sum)
            return low;
    return size + 1;
}

int RuleCage::minSum(int large, int N, int minC) const {
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

int RuleCage::upperBound(int N, int sum, int minC, int size) const {
    for (int high = size; high >= minC + (number_can_repeat_ ? 0 : N - 1); --high)
        if (minSum(high, N, minC) <= sum)
            return high;
    return 0;
}

std::pair<int, int> RuleCage::getSoftBounds(int N, int sum, int minC, int maxC, int size) const {
    int min = lowerBound(N, sum, maxC, size);
    int max = upperBound(N, sum, minC, size);
    return {min, max};
}

} // namespace sudoku
