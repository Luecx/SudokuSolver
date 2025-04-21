#ifndef POSITION_H
#define POSITION_H

#include <cstdint>
#include "defs.h"

namespace sudoku {

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
