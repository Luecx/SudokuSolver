// rule_x.h
#pragma once

#include "rules.h"
#include "../position.h"

namespace sudoku {

    class XRule : public Rule {
    public:
        XRule(Position p1, Position p2);

        bool number_changed    (Board& board, const Cell& changed_cell) const override;
        bool candidates_changed(Board& board)                 const override;
        bool check_plausibility(const Board& board)           const override;

    private:
        Position pos1_, pos2_;
    };

} // namespace sudoku
