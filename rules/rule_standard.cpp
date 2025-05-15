#include "rule_standard.h"
#include "../board.h"
#include "../cell.h"

#include <array>
#include <vector>
#include <algorithm>

namespace sudoku {

    static constexpr std::array<Candidate,9> ALL_DIGITS = {1,2,3,4,5,6,7,8,9};

    static inline int block_index(int row, int col) {
        return (row/3)*3 + (col/3);
    }

// hidden singles in one unit (row/col/block)
    static bool hidden_singles(const std::array<Cell*, BOARD_SIZE>& unit) {
        bool changed = false;
        Candidates seen_once{Candidates::MASK_NONE}, seen_twice{Candidates::MASK_NONE};
        for (Cell* c : unit) {
            if (c->value != EMPTY) {
                seen_once |= Candidates{c->value};
            } else {
                seen_twice |= seen_once & c->candidates;
                seen_once  |= c->candidates;
            }
        }
        Candidates unique = seen_once & ~seen_twice;
        for (Cell* c : unit) {
            if (c->value == EMPTY) {
                Candidates pick = c->candidates & unique;
                if (pick.count() == 1) {
                    changed |= c->remove_candidate(~pick);
                }
            }
        }
        return changed;
    }

// pointing (block → line)
    static bool pointing_values(Board& board) {
        bool changed = false;
        for (int br = 0; br < BOARD_SIZE; br += 3) {
            for (int bc = 0; bc < BOARD_SIZE; bc += 3) {
                auto& block = board.get_block(br, bc);
                for (Candidate d : ALL_DIGITS) {
                    int rowMask = 0, colMask = 0;
                    for (Cell* c : block) {
                        if (c->value == EMPTY && c->candidates.test(d)) {
                            rowMask |= 1 << (c->pos.row - br);
                            colMask |= 1 << (c->pos.col - bc);
                        }
                    }
                    int countRow = ((rowMask>>0)&1) + ((rowMask>>1)&1) + ((rowMask>>2)&1);
                    if (rowMask && countRow == 1) {
                        int local = ((rowMask>>0)&1) ? 0 : ((rowMask>>1)&1) ? 1 : 2;
                        int global = br + local;
                        for (Cell* peer : board.get_row(global)) {
                            if (peer->pos.col/3 != bc/3) {
                                changed |= peer->remove_candidate(d);
                            }
                        }
                    }
                    int countCol = ((colMask>>0)&1) + ((colMask>>1)&1) + ((colMask>>2)&1);
                    if (colMask && countCol == 1) {
                        int local = ((colMask>>0)&1) ? 0 : ((colMask>>1)&1) ? 1 : 2;
                        int global = bc + local;
                        for (Cell* peer : board.get_col(global)) {
                            if (peer->pos.row/3 != br/3) {
                                changed |= peer->remove_candidate(d);
                            }
                        }
                    }
                }
            }
        }
        return changed;
    }

// claiming (line → block)
    static bool claiming_values(Board& board) {
        bool changed = false;
        // rows → block
        for (Row r = 0; r < BOARD_SIZE; ++r) {
            auto& row = board.get_row(r);
            for (Candidate d : ALL_DIGITS) {
                int commonBlock = -1, count = 0;
                for (Cell* c : row) {
                    if (c->value == EMPTY && c->candidates.test(d)) {
                        ++count;
                        int b = c->pos.col / 3;
                        if (commonBlock < 0) commonBlock = b;
                        else if (commonBlock != b) { commonBlock = -2; break; }
                    }
                }
                if (count > 1 && commonBlock >= 0) {
                    int br = (r/3)*3, bc = commonBlock*3;
                    for (Cell* c : board.get_block(br, bc)) {
                        if (c->value == EMPTY && c->pos.row != r)
                            changed |= c->remove_candidate(d);
                    }
                }
            }
        }
        // cols → block
        for (Col cidx = 0; cidx < BOARD_SIZE; ++cidx) {
            auto& col = board.get_col(cidx);
            for (Candidate d : ALL_DIGITS) {
                int commonBlock = -1, count = 0;
                for (Cell* c : col) {
                    if (c->value == EMPTY && c->candidates.test(d)) {
                        ++count;
                        int b = c->pos.row / 3;
                        if (commonBlock < 0) commonBlock = b;
                        else if (commonBlock != b) { commonBlock = -2; break; }
                    }
                }
                if (count > 1 && commonBlock >= 0) {
                    int br = commonBlock*3, bc = (cidx/3)*3;
                    for (Cell* c : board.get_block(br, bc)) {
                        if (c->value == EMPTY && c->pos.col != cidx)
                            changed |= c->remove_candidate(d);
                    }
                }
            }
        }
        return changed;
    }

// naked pairs
    static bool naked_pairs(Board& board) {
        bool changed = false;
        auto process_unit = [&](const std::array<Cell*, BOARD_SIZE>& unit) {
            std::array<Candidates, BOARD_SIZE> masks;
            for (int i = 0; i < BOARD_SIZE; ++i) {
                masks[i] = (unit[i]->value == EMPTY) ? unit[i]->candidates
                                                     : Candidates{};
            }
            for (int i = 0; i < BOARD_SIZE; ++i) {
                if (masks[i].count() != 2) continue;
                for (int j = i + 1; j < BOARD_SIZE; ++j) {
                    if (masks[j] == masks[i]) {
                        for (int k = 0; k < BOARD_SIZE; ++k) {
                            if (k == i || k == j) continue;
                            Cell* c = unit[k];
                            if (c->value == EMPTY)
                                changed |= c->remove_candidate(masks[i]);
                        }
                    }
                }
            }
        };

        for (Row r = 0; r < BOARD_SIZE; ++r) process_unit(board.get_row(r));
        for (Col c = 0; c < BOARD_SIZE; ++c) process_unit(board.get_col(c));
        for (int br = 0; br < BOARD_SIZE; br += 3)
            for (int bc = 0; bc < BOARD_SIZE; bc += 3)
                process_unit(board.get_block(br, bc));

        return changed;
    }

// x-wing
    static bool x_wing(Board& board) {
        bool changed = false;
        for (Candidate d : ALL_DIGITS) {
            std::array<std::vector<int>, BOARD_SIZE> rowCols;
            for (int r = 0; r < BOARD_SIZE; ++r) {
                for (int c = 0; c < BOARD_SIZE; ++c) {
                    auto& cell = board.get_cell({r, c});
                    if (cell.value == EMPTY && cell.candidates.test(d))
                        rowCols[r].push_back(c);
                }
            }
            for (int r1 = 0; r1 < BOARD_SIZE; ++r1) {
                if (rowCols[r1].size() != 2) continue;
                for (int r2 = r1 + 1; r2 < BOARD_SIZE; ++r2) {
                    if (rowCols[r2] == rowCols[r1]) {
                        for (int r3 = 0; r3 < BOARD_SIZE; ++r3) {
                            if (r3 == r1 || r3 == r2) continue;
                            for (int col : rowCols[r1]) {
                                auto& cell = board.get_cell({r3, col});
                                if (cell.value == EMPTY)
                                    changed |= cell.remove_candidate(d);
                            }
                        }
                    }
                }
            }
        }
        return changed;
    }

// swordfish
    static bool swordfish(Board& board) {
        bool changed = false;
        for (Candidate d : ALL_DIGITS) {
            std::array<std::vector<int>, BOARD_SIZE> rowCols;
            for (int r = 0; r < BOARD_SIZE; ++r) {
                for (int c = 0; c < BOARD_SIZE; ++c) {
                    auto& cell = board.get_cell({r, c});
                    if (cell.value == EMPTY && cell.candidates.test(d))
                        rowCols[r].push_back(c);
                }
            }
            for (int a = 0; a < BOARD_SIZE; ++a) {
                if (rowCols[a].size() < 2 || rowCols[a].size() > 3) continue;
                for (int b = a + 1; b < BOARD_SIZE; ++b) {
                    if (rowCols[b].size() < 2 || rowCols[b].size() > 3) continue;
                    for (int c = b + 1; c < BOARD_SIZE; ++c) {
                        if (rowCols[c].size() < 2 || rowCols[c].size() > 3) continue;
                        std::vector<int> unionCols = rowCols[a];
                        unionCols.insert(unionCols.end(), rowCols[b].begin(), rowCols[b].end());
                        unionCols.insert(unionCols.end(), rowCols[c].begin(), rowCols[c].end());
                        std::sort(unionCols.begin(), unionCols.end());
                        unionCols.erase(std::unique(unionCols.begin(), unionCols.end()), unionCols.end());
                        if (unionCols.size() == 3) {
                            for (int r2 = 0; r2 < BOARD_SIZE; ++r2) {
                                if (r2 == a || r2 == b || r2 == c) continue;
                                for (int col : unionCols) {
                                    auto& cell = board.get_cell({r2, col});
                                    if (cell.value == EMPTY)
                                        changed |= cell.remove_candidate(d);
                                }
                            }
                        }
                    }
                }
            }
        }
        return changed;
    }

// xy-wing
    static bool xy_wing(Board& board) {
        bool changed = false;
        std::vector<Cell*> bivals;
        bivals.reserve(20);
        for (Row r = 0; r < BOARD_SIZE; ++r)
            for (Col c = 0; c < BOARD_SIZE; ++c) {
                Cell& x = board.get_cell({r, c});
                if (x.value == EMPTY && x.candidates.count() == 2)
                    bivals.push_back(&x);
            }
        auto is_peer = [&](Cell* a, Cell* b) {
            return a->pos.row == b->pos.row ||
                   a->pos.col == b->pos.col ||
                   block_index(a->pos.row, a->pos.col) ==
                   block_index(b->pos.row, b->pos.col);
        };
        for (Cell* P : bivals) {
            std::array<Candidate, 2> ds;
            int di = 0;
            for (Candidate d : ALL_DIGITS)
                if (P->candidates.test(d)) ds[di++] = d;
            for (Cell* W1 : bivals) {
                if (W1 == P) continue;
                if (!W1->candidates.test(ds[0]) || W1->candidates.test(ds[1])) continue;
                if (!is_peer(P, W1)) continue;
                Candidate d3 = (W1->candidates & ~Candidates{ds[0]}).lowest();
                for (Cell* W2 : bivals) {
                    if (W2 == P || W2 == W1) continue;
                    if (!W2->candidates.test(ds[1]) || W2->candidates.test(ds[0])) continue;
                    if (!W2->candidates.test(d3)) continue;
                    if (!is_peer(P, W2)) continue;
                    for (Row rr = 0; rr < BOARD_SIZE; ++rr) {
                        for (Col cc = 0; cc < BOARD_SIZE; ++cc) {
                            Cell& C = board.get_cell({rr, cc});
                            if (C.value != EMPTY || !C.candidates.test(d3)) continue;
                            if (is_peer(&C, W1) && is_peer(&C, W2))
                                changed |= C.remove_candidate(d3);
                        }
                    }
                }
            }
        }
        return changed;
    }

// StandardRule methods

    bool StandardRule::number_changed(Board& board, const Cell& changed_cell) const {
        if (changed_cell.value == EMPTY) return false;
        bool changed = false;
        Candidates rm{ changed_cell.value };
        for (Cell* c : board.get_row(changed_cell.pos.row))
            if (c->value == EMPTY) changed |= c->remove_candidate(rm);
        for (Cell* c : board.get_col(changed_cell.pos.col))
            if (c->value == EMPTY) changed |= c->remove_candidate(rm);
        for (Cell* c : board.get_block(changed_cell.pos.row, changed_cell.pos.col))
            if (c->value == EMPTY) changed |= c->remove_candidate(rm);
        return changed;
    }

    bool StandardRule::candidates_changed(Board& board) const {
        bool changed = false;
        for (int i = 0; i < BOARD_SIZE; ++i)
            changed |= hidden_singles(board.get_row(i));
        for (int i = 0; i < BOARD_SIZE; ++i)
            changed |= hidden_singles(board.get_col(i));
        for (int br = 0; br < BOARD_SIZE; br += 3)
            for (int bc = 0; bc < BOARD_SIZE; bc += 3)
                changed |= hidden_singles(board.get_block(br, bc));

        changed |= pointing_values(board);
        changed |= claiming_values(board);
        changed |= naked_pairs(board);
        changed |= x_wing(board);
        changed |= swordfish(board);
        changed |= xy_wing(board);

        return changed;
    }

    bool StandardRule::check_plausibility(const Board& board) const {
        for (int i = 0; i < BOARD_SIZE; ++i) {
            Candidates seen{Candidates::MASK_NONE};
            for (Cell* c : board.get_row(i))
                seen |= (c->value != EMPTY ? Candidates{c->value} : c->candidates);
            if (seen.raw() != Candidates::MASK_ALL) return false;
            seen = Candidates{};
            for (Cell* c : board.get_col(i))
                seen |= (c->value != EMPTY ? Candidates{c->value} : c->candidates);
            if (seen.raw() != Candidates::MASK_ALL) return false;
        }
        for (int br = 0; br < BOARD_SIZE; br += 3)
            for (int bc = 0; bc < BOARD_SIZE; bc += 3) {
                Candidates seen{Candidates::MASK_NONE};
                for (Cell* c : board.get_block(br, bc))
                    seen |= (c->value != EMPTY ? Candidates{c->value} : c->candidates);
                if (seen.raw() != Candidates::MASK_ALL) return false;
            }
        return true;
    }

} // namespace sudoku
