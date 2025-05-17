/**
* @file Cell.h
* @brief Defines a single cell in the Sudoku grid with value and candidate tracking.
*
* This file is part of the SudokuSolver project, developed for the Sudoku Website.
* Each cell stores its position, current value, and candidate numbers using a
* runtime-sized NumberSet.
*
* @date 2025-05-16
* @author Finn Eggers
*/

#ifndef CELL_H
#define CELL_H

#include "defs.h"
#include "region/CellIdx.h"
#include "number_set.h"

namespace sudoku {

/**
* @class Cell
* @brief Represents a single cell in the Sudoku grid.
*
* - If the cell is solved (value ≠ 0), candidates is a singleton containing only that value.
* - If unsolved (value == 0), candidates holds all currently allowed numbers.
*/
class Cell {
public:
    CellIdx pos;              ///< Row/column position of the cell
   Number value = 0;          ///< 0 if unsolved, 1–N if solved
   NumberSet candidates;      ///< Active candidates (always consistent with value)
   int max_number = 9;        ///< Board size (max value), e.g., 9 for 9x9

   /**
    * @brief Construct an unsolved cell at (r,c) with board size N.
    * @param r Row index
    * @param c Column index
    * @param n Board size (default: 9)
    */
   Cell(CellIdx pos, int n = 9)
       : pos(pos), value(0), candidates(NumberSet::full(n)), max_number(n) {}

   /**
    * @brief Set the cell to a known value.
    * Updates candidates to be that value only.
    * @param v Solved value (must be in [1, max_number])
    */
   void set_value(Number v) {
       value = v;
       candidates = NumberSet(max_number, v);
   }

   /**
    * @brief Clears the cell (unsolved) and resets all candidates.
    */
   void clear() {
       value = 0;
       candidates = NumberSet::full(max_number);
   }

   /**
    * @brief Removes a candidate number (if unsolved).
    * @param number Number to remove
    * @return True if candidates changed
    */
   bool remove_candidate(Number number) {
       if (value != 0) return false;
       NumberSet before = candidates;
       candidates.remove(number);
       return candidates != before;
   }

   /**
    * @brief Removes multiple candidates (if unsolved).
    * @param remove_set Mask of candidates to remove
    * @return True if candidates changed
    */
   bool remove_candidates(const NumberSet& remove_set) {
       if (value != 0) return false;
       NumberSet before = candidates;
       candidates = candidates & ~remove_set;
       return candidates != before;
   }

   /**
    * @brief Restrict the candidates to only those in the given set.
    * @param allowed The new set of allowed candidates
    * @return True if candidates changed
    */
   bool only_allow_candidates(const NumberSet& allowed) {
       if (value != 0) return false;
       NumberSet before = candidates;
       candidates = candidates & allowed;
       return candidates != before;
   }

   /**
    * @brief Gets the active candidates (always valid).
    * @return A NumberSet of all allowed numbers for this cell.
    */
   NumberSet get_candidates() const {
       return candidates;
   }

   /**
    * @brief Check if the cell is solved.
    * @return True if value is non-zero
    */
   bool is_solved() const {
       return value != 0;
   }
};

} // namespace sudoku

#endif // CELL_H
