#pragma once

#include <cstdint>
#include <ostream>

namespace sudoku {

    // Type aliases for Sudoku concepts
    using Size      = int;          // board size
    using Row       = int;          // Valid values: 0–8
    using Col       = int;          // Valid values: 0–8
    using Number    = int8_t;       // Solved numbers: 1–9
    using Candidate = int8_t;       // Candidate values: 1–9

    constexpr Number EMPTY = 0;     // Unsolved cells are marked with 0
    constexpr Size   MAX_SIZE = 63; // max board size
} // namespace sudoku
