#pragma once

#include "rules.h"

namespace sudoku {

    class MixedOddEven : public Rule {
    public:
        MixedOddEven(const Position& pos1, const Position& pos2);

        bool number_changed(Board& board, const Cell& changed_cell) const override;
        bool candidates_changed(Board& board) const override;
        bool check_plausibility(const Board& board) const override;

    private:
        Position pos1_;
        Position pos2_;
    };

} // namespace sudoku
