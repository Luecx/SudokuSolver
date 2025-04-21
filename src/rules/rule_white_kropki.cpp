#include "rule_white_kropki.h"
#include "../board.h"
#include "../cell.h"

namespace sudoku {

    WhiteKropki::WhiteKropki(const Position& pos1, const Position& pos2)
            : pos1_(pos1), pos2_(pos2) {}

    bool WhiteKropki::number_changed(Board& board, const Cell& changed_cell) const {
        const Cell& a = board.get_cell(pos1_);
        const Cell& b = board.get_cell(pos2_);
        bool any_changed = false;

        if (a.value != EMPTY && b.value == EMPTY) {
            Candidates allowed;
            if (a.value > 1) allowed |= Candidates(Number(a.value - 1));
            if (a.value < 9) allowed |= Candidates(Number(a.value + 1));
            Candidates& cands = board.get_cell(pos2_).candidates;
            Candidates before = cands;
            cands &= allowed;
            any_changed = (cands != before);
        }

        if (b.value != EMPTY && a.value == EMPTY) {
            Candidates allowed;
            if (b.value > 1) allowed |= Candidates(Number(b.value - 1));
            if (b.value < 9) allowed |= Candidates(Number(b.value + 1));
            Candidates& cands = board.get_cell(pos1_).candidates;
            Candidates before = cands;
            cands &= allowed;
            any_changed |= (cands != before);
        }

        return any_changed;
    }

    bool WhiteKropki::candidates_changed(Board& board) const {
        Cell& a = board.get_cell(pos1_);
        Cell& b = board.get_cell(pos2_);

        // both must be empty
        if (a.value != EMPTY || b.value != EMPTY)
            return false;

        bool any_changed = false;

        // go through all values in a, check if b has a value which is smaller or larger
        for (Number n : a.candidates) {
            bool has_lower  = n > 1 && b.candidates.test(n - 1);
            bool has_higher = n < 9 && b.candidates.test(n + 1);
            if (!has_lower && !has_higher) {
                a.candidates &= ~Candidates(n);
                any_changed = true;
            }
        }

        // go through all values in b, check if a has a value which is smaller or larger
        for (Number n : b.candidates) {
            bool has_lower  = n > 1 && a.candidates.test(n - 1);
            bool has_higher = n < 9 && a.candidates.test(n + 1);
            if (!has_lower && !has_higher) {
                b.candidates &= ~Candidates(n);
                any_changed = true;
            }
        }

        return any_changed;
    }

    bool WhiteKropki::check_plausibility(const Board& board) const {
        const Cell& a = board.get_cell(pos1_);
        const Cell& b = board.get_cell(pos2_);

        if (a.value != EMPTY && b.value != EMPTY)
            return std::abs(a.value - b.value) == 1;

        return true;
    }

} // namespace sudoku
