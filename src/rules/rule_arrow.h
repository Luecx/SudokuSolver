#pragma once

#include "rules.h"
#include "../position.h"
#include <vector>

namespace sudoku {

    class ArrowRule : public Rule {
    public:
        // base: the cell holding the sum; arrow: the cells that sum into the base
        ArrowRule(const Position& base, const std::vector<Position>& arrow);

        bool number_changed    (Board& board, const Cell& changed_cell) const override;
        bool candidates_changed(Board& board)               const override;
        bool check_plausibility(const Board& board)         const override;

    private:
        Position                base_;
        std::vector<Position>   arrow_;
    };

} // namespace sudoku