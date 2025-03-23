#include "rule_black_kropki.h"
#include "board.h"
#include "cell.h"
#include <iostream>

namespace sudoku {

    BlackKropki::BlackKropki(const Position& pos1, const Position& pos2)
            : pos1_(pos1), pos2_(pos2) {}

    bool BlackKropki::number_changed(Board& board, const Cell& changed_cell) const {
        const Cell& a = board.get_cell(pos1_);
        const Cell& b = board.get_cell(pos2_);
        bool any_changed = false;

        if (a.value != EMPTY
         && b.value == EMPTY) {
            Candidates allowed;
            if (a.value % 2 == 0 && a.value / 2 >= 1) // if a is even, b can be half of a
                allowed |= Candidates(Number(a.value / 2));
            if (a.value * 2 <= 9) // if a is less than 5, b can be double of a
                allowed |= Candidates(Number(a.value * 2));
            Candidates& cands = board.get_cell(pos2_).candidates;
            Candidates before = cands;
            cands &= allowed;
            any_changed = (cands != before);
        }

        if (b.value != EMPTY
         && a.value == EMPTY) {
            Candidates allowed;
            if (b.value % 2 == 0 && b.value / 2 >= 1)
                allowed |= Candidates(Number(b.value / 2));
            if (b.value * 2 <= 9)
                allowed |= Candidates(Number(b.value * 2));
            Candidates& cands = board.get_cell(pos1_).candidates;
            Candidates before = cands;
            cands &= allowed;
            any_changed |= (cands != before);
        }

        return any_changed;
    }

    bool BlackKropki::candidates_changed(Board& board) const {
        // if one does not have 4, the other one cannot have 8;
        // if one does not have 3, the other one cannot have 6;
        Cell& a = board.get_cell(pos1_);
        Cell& b = board.get_cell(pos2_);
        bool any_changed = false;

        // only do this if both cells are empty
        if (a.value != EMPTY || b.value != EMPTY)
            return false;


        for (Number n: {5, 7, 9}) {
            if (a.candidates.test(n)) {
                a.candidates &= ~Candidates(Number(n));
                any_changed = true;
            }
            if (b.candidates.test(n)) {
                b.candidates &= ~Candidates(Number(n));
                any_changed = true;
            }
        }

        // go through all the candidates in one, and check if the other one has the corresponding candidate
        for (Candidate c : a.candidates) {
            bool has_lower  = c > 1 && c % 2 == 0 && b.candidates.test(c / 2);
            bool has_higher = c <= 4 && b.candidates.test(c * 2);
            if (!has_lower && !has_higher) {
                a.candidates &= ~Candidates(c);
                any_changed = true;
            }
        }

        for (Candidate c : b.candidates) {
            bool has_lower  = c > 1 && c % 2 == 0 && a.candidates.test(c / 2);
            bool has_higher = c <= 4 && a.candidates.test(c * 2);
            if (!has_lower && !has_higher) {
                b.candidates &= ~Candidates(c);
                any_changed = true;
            }
        }

        if (a.value != EMPTY || b.value != EMPTY)
            return false;

        if (!a.candidates.test(4) && b.candidates.test(8)) {
            b.candidates &= ~Candidates(Number(8));
            any_changed = true;
        }

        if (!a.candidates.test(3) && b.candidates.test(6)) {
            b.candidates &= ~Candidates(Number(6));
            any_changed = true;
        }

        if (!b.candidates.test(4) && a.candidates.test(8)) {
            a.candidates &= ~Candidates(Number(8));
            any_changed = true;
        }

        if (!b.candidates.test(3) && a.candidates.test(6)) {
            a.candidates &= ~Candidates(Number(6));
            any_changed = true;
        }

        return any_changed;
    }

    bool BlackKropki::check_plausibility(const Board& board) const {
        const Cell& a = board.get_cell(pos1_);
        const Cell& b = board.get_cell(pos2_);

        if (a.value != EMPTY && b.value != EMPTY)
            return (a.value == 2 * b.value) || (b.value == 2 * a.value);

        return true;
    }

} // namespace sudoku
