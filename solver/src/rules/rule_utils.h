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
 * @brief generates a random color in RGBA format.
 */
std::string random_rgba_color();

/**
 * @brief Get all orthogonal neighbors of a cell.
 */
Region<CellIdx> get_orthogonal_neighbors(Board *board, const CellIdx &cell);

/**
 * @brief Get all neighbors of a cell (orthogonal and diagonal).
 */
Region<CellIdx> get_all_neighbors(Board *board, const CellIdx &cell);

/**
 * @brief Generate a random, connected region of given size inside available_region.
 * @param max_region_size The region may not reach this size if no more cells are available.
 * @param available_region The region will be updated inside the function if provided.
 */
Region<CellIdx> generate_random_region(Board *board, //
                                       const int max_region_size, //
                                       Region<CellIdx> *available_region = nullptr);

/**
 * @brief Generate a random, connected path of given size inside available_path.
 * @param max_region_size The region may not reach this size if no more cells are available.
 * @param available_path The region will be updated inside the function if provided.
 */
Region<CellIdx> generate_random_path(Board *board, //
                                     const int max_path_size, //
                                     Region<CellIdx> *available_path = nullptr);

} // namespace sudoku::rule_utils
