#include "rule_utils.h"
#include "../board/board.h"

namespace sudoku::rule_utils {

// helper to select random element without removing
template<typename T>
T select_random(const Region<T> &vec, std::mt19937 &gen) {
    std::uniform_int_distribution<> dist(0, vec.size() - 1);
    return vec.items()[dist(gen)];
}

// helper to find a valid starting point in the board
CellIdx find_valid_starting_cell(Board *board, std::mt19937 &gen, const Region<CellIdx> &available_region = {}) {
    if (available_region.size() == 0) {
        std::uniform_int_distribution<> dist(0, board->size() - 1);
        return {dist(gen), dist(gen)};
    } else {
        std::uniform_int_distribution<> cell_dist(0, available_region.size() - 1);
        return available_region.items()[cell_dist(gen)];
    }
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

Region<CellIdx> get_orthogonal_neighbors(Board *board, const CellIdx &cell) {
    Region<CellIdx> neighbors;
    const std::vector<std::pair<int, int>> directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

    for (const auto &dir: directions) {
        CellIdx neighbor = {cell.r + dir.first, cell.c + dir.second};
        if (pos_in_bounds(board, neighbor))
            neighbors.add(neighbor);
    }

    return neighbors;
}

Region<CellIdx> get_all_neighbors(Board *board, const CellIdx &cell) {
    Region<CellIdx> neighbors;
    const std::vector<std::pair<int, int>> directions = {
            {-1, 0},  {1, 0},  {0, -1}, {0, 1}, // orthogonal
            {-1, -1}, {-1, 1}, {1, -1}, {1, 1} // diagonals
    };

    for (const auto &[r, c]: directions) {
        CellIdx neighbor = {cell.r + r, cell.c + c};
        if (pos_in_bounds(board, neighbor))
            neighbors.add(neighbor);
    }

    return neighbors;
}

Region<CellIdx> generate_random_region(Board *board, const int max_region_size, Region<CellIdx> *available_region) {
    static std::random_device rd;
    static std::mt19937 gen(rd());

    CellIdx current = available_region ? find_valid_starting_cell(board, gen, *available_region)
                                       : find_valid_starting_cell(board, gen);

    Region<CellIdx> region;
    region.add(current);

    if (available_region)
        *available_region = *available_region - current;

    while ((int) region.items().size() < max_region_size) {
        Region<CellIdx> neighbors = get_orthogonal_neighbors(board, current) - region;

        if (available_region)
            neighbors = neighbors & (*available_region);

        if (neighbors.size()) {
            CellIdx new_cell = select_random(neighbors, gen);
            region.add(new_cell);
            current = new_cell;

            if (available_region)
                *available_region = *available_region - new_cell;
        } else {
            break;
        }
    }

    return region;
}

Region<CellIdx> generate_random_path(Board *board, const int max_path_size, Region<CellIdx> *available_path) {
    static std::random_device rd;
    static std::mt19937 gen(rd());

    CellIdx current = available_path ? find_valid_starting_cell(board, gen, *available_path)
                                     : find_valid_starting_cell(board, gen);

    Region<CellIdx> path;
    path.add(current);

    while ((int) path.items().size() < max_path_size) {
        Region<CellIdx> neighbors = get_all_neighbors(board, current) - path;

        if (available_path)
            neighbors = neighbors & (*available_path);

        if (neighbors.size()) {
            CellIdx new_cell = select_random(neighbors, gen);
            path.add(new_cell);
            current = new_cell;

            if (available_path)
                *available_path = *available_path - path;
        } else {
            break;
        }
    }

    return path;
}

Region<EdgeIdx> generate_random_edges(Board *board, const int max_edge_count, Region<EdgeIdx> &available_edges) {
    static std::random_device rd;
    static std::mt19937 gen(rd());

    Region<EdgeIdx> edges;

    while ((int) edges.items().size() < max_edge_count && available_edges.size() > 0) {
        EdgeIdx random_edge = select_random(available_edges, gen);
        edges.add(random_edge);

        available_edges = available_edges - random_edge;
    }

    return edges;
}


Region<CornerIdx> generate_random_corners(Board *board, const int max_corner_count,
                                          Region<CornerIdx> &available_corners) {
    static std::random_device rd;
    static std::mt19937 gen(rd());

    Region<CornerIdx> corners;

    while ((int) corners.items().size() < max_corner_count && available_corners.size() > 0) {
        CornerIdx random_edge = select_random(available_corners, gen);
        corners.add(random_edge);

        available_corners = available_corners - random_edge;
    }

    return corners;
}


} // namespace sudoku::rule_utils
