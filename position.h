#ifndef POSITION_H
#define POSITION_H

#include <cstdint>

namespace sudoku {

// Basic typedefs using smaller types.
using Row        = int;        // Values 0–8
using Col        = int;        // Values 0–8
using Number     = int8_t;     // Displayed numbers: 1–9
using Candidate  = int8_t;     // Candidate value: 1–9

// Structure wrapping row and column.
struct Position {
    Row row;
    Col col;

    constexpr Position(Row r, Col c) : row(r), col(c) {}
    constexpr bool operator==(const Position& other) const {
        return row == other.row && col == other.col;
    }
};

} // namespace sudoku

#endif // POSITION_H
