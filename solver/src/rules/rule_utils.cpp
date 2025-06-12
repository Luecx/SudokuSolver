#include "rule_utils.h"
#include "../board/board.h"

namespace sudoku::rule_utils {

bool pos_in_bounds(const Board *board, const CellIdx &pos) {
    return pos.r >= 0 && pos.r < board->size() && pos.c >= 0 && pos.c < board->size();
}

bool is_group_valid(const std::vector<Cell *> &unit) {
    const int unit_size = unit.size();

    NumberSet seen(unit_size);
    seen.clear();
    NumberSet combined(unit_size);

    for (const auto &c: unit) {
        if (c->is_solved()) {
            if (seen.test(c->value))
                return false;
            seen.add(c->value);
            combined |= NumberSet(c->max_number, c->value);
        } else {
            combined |= c->get_candidates();
        }
    }

    return combined == NumberSet::full(unit_size);
}

bool hidden_singles(Board *board_, std::vector<Cell *> &unit) {
    bool changed = false;

    const int board_size = board_->size();

    NumberSet seen_once(board_size);
    NumberSet seen_twice(board_size);

    for (const auto &c: unit) {
        seen_twice |= (seen_once & c->candidates);
        seen_once |= c->candidates;
    }

    NumberSet unique = seen_once & ~seen_twice;

    for (auto &c: unit)
        if (!c->is_solved()) {
            NumberSet pick = c->get_candidates() & unique;
            if (pick.count() == 1)
                changed |= c->remove_candidates(~pick);
        }

    return changed;
}

std::pair<int, int> getSoftBounds(int N, int sum, int minC, int maxC, int size, bool number_can_repeat_) {
    // Compute min bound
    int min = size + 1;
    for (int low = 1; low <= maxC - (number_can_repeat_ ? 0 : N - 1); ++low) {
        int max_sum;
        if (number_can_repeat_) {
            max_sum = low + (N - 1) * maxC;
        } else {
            int total = low, val = maxC;
            for (int i = 0; i < N - 1; ++i)
                total += val--;
            max_sum = total;
        }
        if (max_sum >= sum) {
            min = low;
            break;
        }
    }

    // Compute max bound
    int max = 0;
    for (int high = size; high >= minC + (number_can_repeat_ ? 0 : N - 1); --high) {
        int min_sum;
        if (number_can_repeat_) {
            min_sum = high + (N - 1) * minC;
        } else {
            int total = high, val = minC;
            for (int i = 0; i < N - 1; ++i)
                total += val++;
            min_sum = total;
        }
        if (min_sum <= sum) {
            max = high;
            break;
        }
    }

    return {min, max};
}

Region<CellIdx> generate_random_region(Board *board, int region_size, std::mt19937 &gen) {
    const int board_size = board->size();

    std::uniform_int_distribution<> cell_dist(0, board_size - 1);

    // Start with a random seed cell
    int start_r = cell_dist(gen);
    int start_c = cell_dist(gen);
    std::vector<CellIdx> region_cells = {{start_r, start_c}};
    std::vector<CellIdx> candidates = {{start_r, start_c}};

    while (static_cast<int>(region_cells.size()) < region_size && !candidates.empty()) {
        std::uniform_int_distribution<> candidate_dist(0, candidates.size() - 1);
        int idx = candidate_dist(gen);
        CellIdx current = candidates[idx];

        // Find all valid orthogonal neighbors not already in region
        std::vector<CellIdx> neighbors;
        const std::vector<std::pair<int, int>> directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
        for (const auto &dir: directions) {
            CellIdx neighbor = {current.r + dir.first, current.c + dir.second};
            if (pos_in_bounds(board, neighbor)) {
                bool already_exists =
                        std::any_of(region_cells.begin(), region_cells.end(), [&](const CellIdx &existing) {
                            return existing.r == neighbor.r && existing.c == neighbor.c;
                        });
                if (!already_exists)
                    neighbors.push_back(neighbor);
            }
        }

        if (!neighbors.empty()) {
            std::uniform_int_distribution<> neighbor_dist(0, neighbors.size() - 1);
            CellIdx new_cell = neighbors[neighbor_dist(gen)];
            region_cells.push_back(new_cell);
            candidates.push_back(new_cell);
        } else {
            candidates.erase(candidates.begin() + idx);
        }
    }

    Region<CellIdx> region;
    for (const auto &cell: region_cells)
        region.add(cell);
    return region;
}

} // namespace sudoku::rule_utils
