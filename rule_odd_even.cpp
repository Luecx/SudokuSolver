#include "rule_odd_even.h"
#include "board.h"
#include "cell.h"

namespace sudoku {

    MixedOddEven::MixedOddEven(const Position& pos1, const Position& pos2)
            : pos1_(pos1), pos2_(pos2) {}

    bool MixedOddEven::number_changed(Board& board, const Cell& changed_cell) const {
        const Cell& a = board.get_cell(pos1_);
        const Cell& b = board.get_cell(pos2_);

        if (a.value != EMPTY && b.value == EMPTY) {
            Candidates& cands = board.get_cell(pos2_).candidates;
            Candidates before = cands;
            if (a.value % 2 == 0)
                cands &= CAND_ODD;
            else
                cands &= CAND_EVEN;
            return cands != before;
        }

        if (b.value != EMPTY && a.value == EMPTY) {
            Candidates& cands = board.get_cell(pos1_).candidates;
            Candidates before = cands;
            if (b.value % 2 == 0)
                cands &= CAND_ODD;
            else
                cands &= CAND_EVEN;
            return cands != before;
        }

        return false;
    }

    bool MixedOddEven::candidates_changed(Board& board) const {
        Cell& a = board.get_cell(pos1_);
        Cell& b = board.get_cell(pos2_);
        bool any_changed = false;

        if (a.value != EMPTY || b.value != EMPTY)
            return false;

        bool a_is_odd_only  = (a.candidates & CAND_EVEN).count() == 0;
        bool a_is_even_only = (a.candidates & CAND_ODD).count() == 0;
        bool b_is_odd_only  = (b.candidates & CAND_EVEN).count() == 0;
        bool b_is_even_only = (b.candidates & CAND_ODD).count() == 0;

        if (a_is_odd_only) {
            Candidates before = b.candidates;
            b.candidates &= CAND_EVEN;
            any_changed |= (b.candidates != before);
        } else if (a_is_even_only) {
            Candidates before = b.candidates;
            b.candidates &= CAND_ODD;
            any_changed |= (b.candidates != before);
        }

        if (b_is_odd_only) {
            Candidates before = a.candidates;
            a.candidates &= CAND_EVEN;
            any_changed |= (a.candidates != before);
        } else if (b_is_even_only) {
            Candidates before = a.candidates;
            a.candidates &= CAND_ODD;
            any_changed |= (a.candidates != before);
        }

        return any_changed;
    }

    bool MixedOddEven::check_plausibility(const Board& board) const {
        const Cell& a = board.get_cell(pos1_);
        const Cell& b = board.get_cell(pos2_);

        if (a.value != EMPTY && b.value != EMPTY)
            return (a.value % 2) != (b.value % 2);
        return true;
    }

} // namespace sudoku
