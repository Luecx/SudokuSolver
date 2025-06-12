#pragma once

#include <random>
#include <vector>
#include "../cell.h"
#include "../region/region.h"

namespace sudoku::rule_utils {

/**
 * @brief True if pos is within board bounds.
 */
bool pos_in_bounds(const Board *board, const CellIdx &pos);

/**
 * @brief Check if a group contains all numbers from 1 to n.
 */
bool is_group_valid(const std::vector<Cell *> &unit);

/**
 * @brief Finds and fills hidden singles in the given unit.
 */
bool hidden_singles(Board *board_, std::vector<Cell *> &unit);

/**
 * @brief Computes the minimum and maximum possible values for a cell in a sum constraint.
 */
std::pair<int, int> getSoftBounds(int N, int sum, int minC, int maxC, int size, bool number_can_repeat_ = true);

/**
 * @brief Generate a random, connected region of given size.
 */
Region<CellIdx> generate_random_region(Board *board, int region_size, std::mt19937 &gen);

} // namespace sudoku::rule_utils
