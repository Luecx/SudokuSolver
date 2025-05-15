#include "rule_arrow.h"
#include "../board.h"
#include "../candidates.h"
#include <numeric>
#include <algorithm>

using namespace sudoku;

ArrowRule::ArrowRule(const Position& base, const std::vector<Position>& arrow)
        : base_(base), arrow_(arrow)
{}

bool ArrowRule::number_changed(Board& board, const Cell&) const {
    // any number change in the base or arrow cells triggers pruning
    return candidates_changed(board);
}

bool ArrowRule::candidates_changed(Board& board) const {
    bool changed = false;

    // Retrieve base cell pointer
    Cell* base_cell = board.get_row(base_.row)[base_.col];

    // Retrieve arrow cell pointers
    std::vector<Cell*> cells;
    cells.reserve(arrow_.size());
    for (auto& pos : arrow_) {
        cells.push_back(board.get_row(pos.row)[pos.col]);
    }

    // Compute total min and max for arrow cells
    int arrow_min = 0, arrow_max = 0;
    for (Cell* c : cells) {
        if (c->value != EMPTY) {
            arrow_min += c->value;
            arrow_max += c->value;
        } else {
            int lo = c->candidates.lowest();
            int hi = lo;
            for (auto d : c->candidates) hi = d;
            arrow_min += lo;
            arrow_max += hi;
        }
    }

    // 1) Prune base candidates outside [arrow_min, arrow_max]
    if (base_cell->value == EMPTY) {
        auto& bc = base_cell->candidates;
        for (Candidate d = Candidates::MIN; d <= Candidates::MAX; ++d) {
            if (bc.test(d) && (d < arrow_min || d > arrow_max)) {
                bc.disallow(d);
                changed = true;
            }
        }
    }

    // Gather currently possible base values
    std::vector<int> base_vals;
    if (base_cell->value != EMPTY) {
        base_vals.push_back(base_cell->value);
    } else {
        for (Candidate d = Candidates::MIN; d <= Candidates::MAX; ++d) {
            if (base_cell->candidates.test(d))
                base_vals.push_back(d);
        }
    }

    // 2) For each arrow cell, prune any candidate d for which no base value fits
    for (size_t i = 0; i < cells.size(); ++i) {
        Cell* c = cells[i];
        if (c->value != EMPTY)
            continue;

        // Compute min/max sum for other cells
        int other_min = 0, other_max = 0;
        for (size_t j = 0; j < cells.size(); ++j) {
            if (j == i) continue;
            Cell* o = cells[j];
            if (o->value != EMPTY) {
                other_min += o->value;
                other_max += o->value;
            } else {
                int lo = o->candidates.lowest();
                int hi = lo;
                for (auto d : o->candidates) hi = d;
                other_min += lo;
                other_max += hi;
            }
        }

        auto& cc = c->candidates;
        for (Candidate d = Candidates::MIN; d <= Candidates::MAX; ++d) {
            if (!cc.test(d)) continue;
            bool ok = false;
            for (int bv : base_vals) {
                int needed = bv - d;
                if (needed >= other_min && needed <= other_max) {
                    ok = true;
                    break;
                }
            }
            if (!ok) {
                cc.disallow(d);
                changed = true;
            }
        }
    }

    return changed;
}

bool ArrowRule::check_plausibility(const Board& board) const {
    // Only check once base and all arrow cells have values
    Cell* base_cell = board.get_row(base_.row)[base_.col];
    if (base_cell->value == EMPTY)
        return true;

    int sum = 0;
    for (auto& pos : arrow_) {
        Cell* c = board.get_row(pos.row)[pos.col];
        if (c->value == EMPTY) return true;
        sum += c->value;
    }
    return sum == base_cell->value;
}
