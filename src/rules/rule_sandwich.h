#pragma once

#include "rules.h"

namespace sudoku {

    class Sandwich : public Rule {
    public:
        Sandwich(const Number num, const Row row=-1, const Col col=-1);

        bool number_changed(Board& board, const Cell& changed_cell) const override;
        bool candidates_changed(Board& board) const override;
        bool check_plausibility(const Board& board) const override;

    private:
        Row row_;
        Col col_;
        Number num_;
    };

} // namespace sudoku