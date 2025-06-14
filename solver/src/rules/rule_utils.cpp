#include "rule_utils.h"
#include "../board/board.h"

namespace sudoku::rule_utils {

// helper functions

template<typename CellType>
bool is_cell_in_existing_regions(const CellType &cell, const std::vector<Region<CellType>> &existing_regions) {
    for (const auto &region: existing_regions) {
        if (region.has(cell)) {
            return true;
        }
    }
    return false;
}

template<typename CellType>
CellType find_valid_starting_cell(Board *board, //
                                  std::mt19937 &gen, //
                                  const std::vector<Region<CellType>> &existing_regions) {
    const int board_size = board->size();
    std::uniform_int_distribution<> cell_dist(0, board_size - 1);

    CellType start_cell{-1, -1};
    int attempts = 0;
    const int max_attempts = board_size * board_size * 2;

    do {
        start_cell = {cell_dist(gen), cell_dist(gen)};
        attempts++;

        if (attempts > max_attempts) {
            return CellType{-1, -1}; // Invalid cell
        }
    } while (is_cell_in_existing_regions(start_cell, existing_regions));

    return start_cell;
}

template<typename CellType>
std::vector<CellType> get_orthogonal_neighbors(Board *board, const CellType &cell,
                                               const Region<CellType> &current_region,
                                               const std::vector<Region<CellType>> &existing_regions) {
    std::vector<CellType> neighbors;
    const std::vector<std::pair<int, int>> directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

    for (const auto &dir: directions) {
        CellType neighbor = {cell.r + dir.first, cell.c + dir.second};
        if (pos_in_bounds(board, neighbor) && !current_region.has(neighbor) &&
            !is_cell_in_existing_regions(neighbor, existing_regions)) {
            neighbors.push_back(neighbor);
        }
    }
    return neighbors;
}

template<typename CellType>
std::vector<CellType> get_all_neighbors(Board *board, //
                                        const CellType &cell, //
                                        const Region<CellType> &current_region, //
                                        const std::vector<Region<CellType>> &existing_regions) {
    std::vector<CellType> neighbors;
    const int directions[][2] = {
            {-1, 0},  {1, 0},  {0, -1}, {0, 1}, // orthogonal
            {-1, -1}, {-1, 1}, {1, -1}, {1, 1} // diagonals
    };

    for (int i = 0; i < 8; i++) {
        CellType neighbor = {cell.r + directions[i][0], cell.c + directions[i][1]};
        if (pos_in_bounds(board, neighbor) && !current_region.has(neighbor) &&
            !is_cell_in_existing_regions(neighbor, existing_regions)) {
            neighbors.push_back(neighbor);
        }
    }
    return neighbors;
}

// helper to select random element and remove it from vector
template<typename T>
T select_and_remove_random(std::vector<T> &vec, std::mt19937 &gen) {
    std::uniform_int_distribution<> dist(0, vec.size() - 1);
    int idx = dist(gen);
    T selected = vec[idx];
    vec.erase(vec.begin() + idx);
    return selected;
}

// helper to select random element without removing
template<typename T>
T select_random(const std::vector<T> &vec, std::mt19937 &gen) {
    std::uniform_int_distribution<> dist(0, vec.size() - 1);
    return vec[dist(gen)];
}

// solver utils

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

std::string random_rgba_color() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 255);
    std::uniform_real_distribution<> alpha_dis(0.2, 0.4);

    std::ostringstream oss;
    oss << "rgba(" << dis(gen) << ", " << dis(gen) << ", " << dis(gen) << ", " << alpha_dis(gen) << ")";
    return oss.str();
}

Region<CellIdx> generate_random_region(Board *board, int region_size, std::vector<Region<CellIdx>> existing_regions) {
    std::random_device rd;
    std::mt19937 gen(rd());

    // Find valid starting cell
    CellIdx start_cell = find_valid_starting_cell(board, gen, existing_regions);
    if (start_cell.r == -1)
        return Region<CellIdx>(); // No valid starting cell found

    Region<CellIdx> region;
    region.add(start_cell);
    std::vector<CellIdx> candidates = {start_cell};

    while (static_cast<int>(region.items().size()) < region_size && !candidates.empty()) {
        CellIdx current = select_and_remove_random(candidates, gen);

        std::vector<CellIdx> neighbors = get_orthogonal_neighbors(board, current, region, existing_regions);

        if (!neighbors.empty()) {
            CellIdx new_cell = select_random(neighbors, gen);
            region.add(new_cell);
            candidates.push_back(new_cell);
        }
    }

    return region;
}

Region<CellIdx> generate_random_path(Board *board, int region_size, std::vector<Region<CellIdx>> existing_regions) {
    std::random_device rd;
    std::mt19937 gen(rd());

    // Find valid starting cell
    CellIdx current_pos = find_valid_starting_cell(board, gen, existing_regions);
    if (current_pos.r == -1)
        return Region<CellIdx>(); // No valid starting cell found

    Region<CellIdx> path_region;
    path_region.add(current_pos);

    // Generate path by connecting adjacent cells
    for (int j = 1; j < region_size; j++) {
        std::vector<CellIdx> valid_moves = get_all_neighbors(board, current_pos, path_region, existing_regions);

        // If no valid moves from current position, try from any existing cell in the path
        if (valid_moves.empty()) {
            for (const auto &existing_pos: path_region.items()) {
                valid_moves = get_all_neighbors(board, existing_pos, path_region, existing_regions);
                if (!valid_moves.empty())
                    break;
            }
        }

        // If still no valid moves, break early
        if (valid_moves.empty())
            break;

        // Choose random valid move
        CellIdx next_pos = select_random(valid_moves, gen);
        path_region.add(next_pos);
        current_pos = next_pos;
    }

    return path_region;
}

} // namespace sudoku::rule_utils
