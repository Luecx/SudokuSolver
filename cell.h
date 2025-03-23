#ifndef CELL_H
#define CELL_H

#include "position.h"
#include "candidates.h"

namespace sudoku {

constexpr int BOARD_SIZE = 9;
constexpr Number EMPTY = 0;  // 0 means unsolved; solved cells hold 1–9.

struct Cell {
    Position pos;         // Cell position.
    Number value;         // 0 = unsolved; 1–9 = solved.
    Candidates candidates; // Candidate list; by default all candidates are enabled.

    // Constructors.
    // Default constructor: position (0,0), unsolved, all candidates enabled.
    constexpr Cell()
            : pos(0, 0), value(EMPTY), candidates(CAND_ALL)
    {}

    // Construct a cell at (r,c) that is unsolved with all candidates enabled.
    constexpr Cell(Row r, Col c)
            : pos(r, c), value(EMPTY), candidates(CAND_ALL)
    {}
};

} // namespace sudoku

#endif // CELL_H
