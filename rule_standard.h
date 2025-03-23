#pragma once

#include "rules.h"

namespace sudoku {

    class StandardRule : public Rule {
    public:
        bool number_changed(Board& board, const Cell& changed_cell) const override;
        bool candidates_changed(Board& board) const override;
        bool check_plausibility(const Board& board) const override;
    };

} // namespace sudoku
