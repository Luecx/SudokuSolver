//
// Created by Finn Eggers on 19.04.25.
//

#include "rule_sandwich.h"
#include "../board.h"
#include "../candidates.h"
#include <vector>
#include <algorithm>

using namespace sudoku;

// ──────────────────────────────────────────────────────────────────────────────
// Static “sandwich” tables (only combos excluding 1 & 9):
// ──────────────────────────────────────────────────────────────────────────────
namespace {

    using Candidates = sudoku::Candidates;
    using Candidate  = Candidate;   // fix alias

    // sum -> (count of digits) -> list of combinations
    static std::vector<std::vector<std::vector<Candidates>>> valid_combinations_excl_extremes;
    static std::vector<int>                                  min_digits_excl;
    static std::vector<int>                                  max_digits_excl;

    void generate_sandwich_tables() {
        const int digit_min = Candidates::MIN;  // 1
        const int digit_max = Candidates::MAX;  // 9
        const int num_digits = digit_max - digit_min + 1;
        const int max_sum    = (digit_max * (digit_max + 1)) / 2;

        // resize outer (sum) and mid (count) dimensions
        valid_combinations_excl_extremes.assign(
                max_sum + 1,
                std::vector<std::vector<Candidates>>(num_digits + 1)
        );
        min_digits_excl.assign(max_sum + 1, num_digits + 1);
        max_digits_excl.assign(max_sum + 1, 0);

        const int max_mask = 1 << num_digits;
        for (int mask = 1; mask < max_mask; ++mask) {
            // shift left so bit 1 → digit 1, …, bit 9 → digit 9
            Candidates cands(static_cast<Candidates::mask_type>(mask << 1));

            int sum   = 0;
            int count = 0;
            bool has1 = false, has9 = false;

            for (Candidate d = digit_min; d <= digit_max; ++d) {
                if (!cands.test(d)) continue;
                sum   += d;
                ++count;
                has1 = has1 || (d == digit_min);
                has9 = has9 || (d == digit_max);
            }

            if (has1 || has9 || sum > max_sum || count == 0)
                continue;

            auto &slot = valid_combinations_excl_extremes[sum][count];
            slot.push_back(cands);
            min_digits_excl[sum] = std::min(min_digits_excl[sum], count);
            max_digits_excl[sum] = std::max(max_digits_excl[sum], count);
        }

        // for sums with no valid combos, zero them out
        for (int s = 0; s <= max_sum; ++s) {
            if (min_digits_excl[s] > num_digits) {
                min_digits_excl[s] = 0;
                max_digits_excl[s] = 0;
            }
        }
    }

    // one‐time init:
    struct Init { Init() { generate_sandwich_tables(); } } init;

} // namespace
// ──────────────────────────────────────────────────────────────────────────────

Sandwich::Sandwich(const Number num, const Row row, const Col col)
        : row_(row), col_(col), num_(num)
{}

bool Sandwich::number_changed(sudoku::Board &board, const sudoku::Cell &changed_cell) const {
    // any number change in the house triggers candidate pruning
    return candidates_changed(board);
}

bool Sandwich::candidates_changed(sudoku::Board &board) const {
    bool changed = false;
    auto dat    = (row_ == -1 ? board.get_col(col_) : board.get_row(row_));

    // find placed 1 and 9
    int idx1 = -1, idx9 = -1;
    for (int i = 0; i < BOARD_SIZE; ++i) {
        if (dat[i]->value == 1) idx1 = i;
        if (dat[i]->value == 9) idx9 = i;
    }

    // guard against out‐of‐range sums
    const int max_sum = (Candidates::MAX * (Candidates::MAX + 1)) / 2;
    if (num_ < 0 || num_ > max_sum) return false;

    int min_d = min_digits_excl[num_];
    int max_d = max_digits_excl[num_];

    // ─── A) prune impossible 1/9 placements ───────────────────────────────────
    if (idx1 == -1 && idx9 == -1) {
        // both unknown: prune 1’s
        for (int i = 0; i < BOARD_SIZE; ++i) {
            auto &c = dat[i]->candidates;
            if (dat[i]->value != EMPTY || !c.test(1)) continue;
            bool ok = false;
            for (int j = 0; j < BOARD_SIZE; ++j) {
                if (j == i) continue;
                bool is9 = (dat[j]->value == 9)
                           || (dat[j]->value == EMPTY && dat[j]->candidates.test(9));
                if (!is9) continue;
                int cnt = abs(j - i) - 1;
                if (cnt >= min_d && cnt <= max_d) { ok = true; break; }
            }
            if (!ok) { c.disallow(1); changed = true; }
        }
        // both unknown: prune 9’s (symmetrically)
        for (int i = 0; i < BOARD_SIZE; ++i) {
            auto &c = dat[i]->candidates;
            if (dat[i]->value != EMPTY || !c.test(9)) continue;
            bool ok = false;
            for (int j = 0; j < BOARD_SIZE; ++j) {
                if (j == i) continue;
                bool is1 = (dat[j]->value == 1)
                           || (dat[j]->value == EMPTY && dat[j]->candidates.test(1));
                if (!is1) continue;
                int cnt = abs(j - i) - 1;
                if (cnt >= min_d && cnt <= max_d) { ok = true; break; }
            }
            if (!ok) { c.disallow(9); changed = true; }
        }

        // ─── A2) prune the other endpoint when one is known ───────────────────────
    } else if (idx1 == -1 || idx9 == -1) {
        int known     = (idx1 != -1 ? 1 : 9);
        int unknown   = (known == 1 ? 9 : 1);
        int idx_known = (known == 1 ? idx1 : idx9);

        for (int i = 0; i < BOARD_SIZE; ++i) {
            auto &c = dat[i]->candidates;
            if (dat[i]->value != EMPTY || !c.test(unknown)) continue;
            int cnt = abs(idx_known - i) - 1;
            if (!(cnt >= min_d && cnt <= max_d)) {
                c.disallow(unknown);
                changed = true;
            }
        }

        // ─── B) both endpoints known: eliminate impossible middle‐cell candidates ──
    } else {
        int left  = std::min(idx1, idx9);
        int right = std::max(idx1, idx9);
        int cnt   = right - left - 1;
        if (cnt >= min_d && cnt <= max_d) {
            // union of all digits in every valid combo for this (sum,cnt)
            Candidates union_cands;
            for (const auto &cvec : valid_combinations_excl_extremes[num_][cnt]) {
                union_cands |= cvec;
            }

            for (int i = left + 1; i < right; ++i) {
                if (dat[i]->value != EMPTY) continue;
                auto &c = dat[i]->candidates;
                for (Candidate d = 1; d <= 9; ++d) {
                    if (c.test(d) && !union_cands.test(d)) {
                        c.disallow(d);
                        changed = true;
                    }
                }
            }
        }
    }

    return changed;
}

bool Sandwich::check_plausibility(const sudoku::Board &board) const {
    auto dat = (row_ == -1 ? board.get_col(col_) : board.get_row(row_));
    int idx1 = -1, idx9 = -1;
    for (int i = 0; i < BOARD_SIZE; ++i) {
        if (dat[i]->value == 1)  idx1 = i;
        if (dat[i]->value == 9)  idx9 = i;
    }
    // only check once both endpoints are placed
    if (idx1 < 0 || idx9 < 0)
        return true;

    int left  = std::min(idx1, idx9);
    int right = std::max(idx1, idx9);

    int min_sum = 0, max_sum = 0;
    for (int i = left + 1; i < right; ++i) {
        if (dat[i]->value != EMPTY) {
            // fixed value cell contributes same to both bounds
            min_sum += dat[i]->value;
            max_sum += dat[i]->value;
        } else {
            // empty: use lowest candidate for lower bound,
            // highest candidate for upper bound
            int lo = dat[i]->candidates.lowest();
            int hi = 0;
            for (auto d : dat[i]->candidates)
                hi = d;             // iterator yields in ascending order
            min_sum += lo;
            max_sum += hi;
        }
    }

    // plausible iff target lies in [min_sum, max_sum]
    return (min_sum <= num_) && (num_ <= max_sum);
}

