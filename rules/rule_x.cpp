// rule_x.cpp
#include "rule_x.h"
#include "../board.h"
#include "../candidates.h"

using namespace sudoku;

static constexpr int X_TARGET = 10;

XRule::XRule(Position p1, Position p2)
        : pos1_(p1), pos2_(p2)
{}

bool XRule::number_changed(Board& board, const Cell&) const {
    return candidates_changed(board);
}

bool XRule::candidates_changed(Board& board) const {
    bool changed = false;
    Cell* c1 = board.get_row(pos1_.row)[pos1_.col];
    Cell* c2 = board.get_row(pos2_.row)[pos2_.col];
    auto &a = c1->candidates;
    auto &b = c2->candidates;

    // one fixed → prune the other
    if (c1->value != EMPTY && c2->value == EMPTY) {
        int need = X_TARGET - c1->value;
        for (Candidate d = Candidates::MIN; d <= Candidates::MAX; ++d) {
            if (b.test(d) && d != need) {
                b.disallow(d);
                changed = true;
            }
        }
    }
    else if (c2->value != EMPTY && c1->value == EMPTY) {
        int need = X_TARGET - c2->value;
        for (Candidate d = Candidates::MIN; d <= Candidates::MAX; ++d) {
            if (a.test(d) && d != need) {
                a.disallow(d);
                changed = true;
            }
        }
    }
        // both unknown → prune impossible pairs
    else if (c1->value == EMPTY && c2->value == EMPTY) {
        for (Candidate d = Candidates::MIN; d <= Candidates::MAX; ++d) {
            if (a.test(d)) {
                int comp = X_TARGET - d;
                if (comp < Candidates::MIN || comp > Candidates::MAX || !b.test(comp)) {
                    a.disallow(d);
                    changed = true;
                }
            }
            if (b.test(d)) {
                int comp = X_TARGET - d;
                if (comp < Candidates::MIN || comp > Candidates::MAX || !a.test(comp)) {
                    b.disallow(d);
                    changed = true;
                }
            }
        }
    }

    return changed;
}

bool XRule::check_plausibility(const Board& board) const {
    Cell* c1 = board.get_row(pos1_.row)[pos1_.col];
    Cell* c2 = board.get_row(pos2_.row)[pos2_.col];
    if (c1->value != EMPTY && c2->value != EMPTY)
        return (c1->value + c2->value) == X_TARGET;
    return true;
}
