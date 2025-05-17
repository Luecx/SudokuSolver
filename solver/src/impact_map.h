/**
* @file impact_map.h
* @brief Tracks cell-level impact for heuristic-driven solving.
*
* This file is part of the SudokuSolver project, developed for the Sudoku Website.
* It defines a 2D integer map that holds impact scores for each cell on the board.
* RuleHandlers can increment values to reflect how many changes occurred due to them.
*
* @date 2025-05-16
* @author Finn Eggers
*/

#pragma once

#include <vector>
#include <cassert>
#include "region/CellIdx.h"
#include "region/region.h"

namespace sudoku {

/**
* @class ImpactMap
* @brief Tracks per-cell integer impact values for a Sudoku board.
*/
class ImpactMap {
public:
   /**
    * @brief Construct an impact map for a board of size `size x size`.
    * @param size Board dimension (e.g., 9 for 9x9)
    */
   explicit ImpactMap(int size)
       : size_(size), impact_(size, std::vector<int>(size, 0)) {}

   /**
    * @brief Reset all impact values to 0.
    */
   void reset() {
       for (auto& row : impact_)
           std::fill(row.begin(), row.end(), 0);
   }

   /**
    * @brief Increment impact at a specific cell by a given amount.
    * @param idx The cell index (row, col)
    * @param amount Value to add (default: 1)
    */
   void increment(const CellIdx& idx, int amount = 1) {
       assert(in_bounds(idx));
       impact_[idx.r][idx.c] += amount;
   }

   /**
    * @brief Increment impact for all cells in a region.
    * @param region Region of CellIdx objects
    * @param amount Value to add to each cell
    */
   void increment_region(const Region<CellIdx>& region, int amount = 1) {
       for (const auto& idx : region.items()) {
           increment(idx, amount);
       }
   }

   /**
    * @brief Get the current impact value at a cell.
    * @param idx The cell index
    * @return Integer impact value
    */
   int get(const CellIdx& idx) const {
       assert(in_bounds(idx));
       return impact_[idx.r][idx.c];
   }

   /**
    * @brief Multiply all values by a scalar (e.g., for decay).
    * @param factor Scalar factor (float, e.g. 0.95)
    */
   void scale(float factor) {
       for (auto& row : impact_)
           for (int& val : row)
               val = static_cast<int>(val * factor);
   }

   /**
    * @brief Get read-only access to the full grid.
    */
   const std::vector<std::vector<int>>& grid() const { return impact_; }

private:
   int size_;
   std::vector<std::vector<int>> impact_;

   bool in_bounds(const CellIdx& idx) const {
       return idx.r >= 0 && idx.r < size_ && idx.c >= 0 && idx.c < size_;
   }
};

} // namespace sudoku
