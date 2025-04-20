#ifndef RULES_H
#define RULES_H

#include "../position.h"

namespace sudoku {

// Forward declarations.
    class Board;
    class Cell;

// Base interface for custom rules.
    class Rule {
    public:
        virtual bool number_changed    (Board& board, const Cell& changed_cell) const = 0;
        virtual bool candidates_changed(Board& board) const = 0;
        virtual bool check_plausibility(const Board& board) const = 0;
        virtual ~Rule() {}
    };

} // namespace sudoku

#endif // RULES_H
