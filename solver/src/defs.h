/**
* @file defs.h
* @brief Common type definitions and constants for the SudokuSolver project.
*
* This file is part of the SudokuSolver project, developed for the Sudoku Website.
* It provides strongly named type aliases and core constants for Sudoku grid manipulation,
* helping ensure clarity and consistency throughout the codebase.
*
* @date 2025-05-16
* @author Finn Eggers
*/

#pragma once

#include <cstdint>
#include <ostream>

namespace sudoku {

/**
    * @brief Alias for the logical board size (e.g. 9 for 9×9 grids).
*/
using Size = int;

/**
    * @brief Alias for row indices in the grid.
    *
    * Valid values range from 0 to Size - 1.
*/
using Row = int;

/**
    * @brief Alias for column indices in the grid.
    *
    * Valid values range from 0 to Size - 1.
*/
using Col = int;

/**
    * @brief Alias for Sudoku numbers (stored in int8_t for memory efficiency).
    *
    * Valid values: 1–9 for solved cells, 0 for unsolved.
*/
using Number = int8_t;

/**
    * @brief Constant indicating an unsolved cell.
*/
constexpr Number EMPTY = 0;

/**
    * @brief Maximum supported board size (for validation purposes).
    *
    * Although typical boards are 9×9, this allows for generalization up to 16×16.
*/
constexpr Size MAX_SIZE = 16;

class Board;

} // namespace sudoku
