#include "rule_standard.h"

#include <bitset>

#include <iostream>
#include "board.h"
#include "cell.h"

namespace sudoku {

    bool StandardRule::number_changed(Board& board, const Cell& changed_cell) const {
        if (changed_cell.value == EMPTY)
            return false;

        bool any_changed = false;
        Candidates to_remove = Candidates(changed_cell.value);

        for (Row i = 0; i < BOARD_SIZE; ++i) {
            Cell& row_cell = board.get_cell(Position{changed_cell.pos.row, i});
            if (row_cell.value == EMPTY) {
                Candidates before = row_cell.candidates;
                row_cell.candidates &= ~to_remove;
                any_changed |= (row_cell.candidates != before);
            }

            Cell& col_cell = board.get_cell(Position{i, changed_cell.pos.col});
            if (col_cell.value == EMPTY) {
                Candidates before = col_cell.candidates;
                col_cell.candidates &= ~to_remove;
                any_changed |= (col_cell.candidates != before);
            }
        }

        Row block_row = (changed_cell.pos.row / 3) * 3;
        Col block_col = (changed_cell.pos.col / 3) * 3;
        for (Row i = 0; i < 3; ++i) {
            for (Col j = 0; j < 3; ++j) {
                Cell& cell = board.get_cell(Position{block_row + i, block_col + j});
                if (cell.value == EMPTY) {
                    Candidates before = cell.candidates;
                    cell.candidates &= ~to_remove;
                    any_changed |= (cell.candidates != before);
                }
            }
        }

        return any_changed;
    }

    bool hidden_singles(const std::array<Cell*, BOARD_SIZE>& cells, Board& board) {
        bool changed = false;
        Candidates seen_once {Candidates::MASK_NONE};
        Candidates seen_twice{Candidates::MASK_NONE};
        for (Cell* cell : cells) {
            if (cell->value != EMPTY) {
                seen_once |= Candidates{cell->value};
            } else {
                seen_twice |= seen_once & cell->candidates;
                seen_once  |= cell->candidates;
            }
        }
        // those that are allowed to be placed are those that have been seen once but not twice
        Candidates to_place = seen_once & ~seen_twice;
        for (Cell* cell : cells) {
            if (cell->value != EMPTY) continue;
            if ((to_place & cell->candidates).count() == 1) {
                changed |= cell->remove_candidate(~to_place);
            }
        }
        return changed;
    }

    bool pointing_values(Board* board) {
        bool changed = false;
        // go through each block
        for (Row br = 0; br < 3; br++){
            for (Col bc = 0; bc < 3; bc++) {
                const std::array<Cell*, BOARD_SIZE>& block = board->get_block(br * 3, bc * 3);

                // go through each value
                for (Number num: {1, 2, 3, 4, 5, 6, 7, 8, 9}) {
                    bool cols[3] = {false, false, false};
                    bool rows[3] = {false, false, false};

                    for (Cell *cell : block) {
                        if (cell->value != EMPTY)
                            continue;

                        if (cell->candidates.test(num)) {
                            cols[cell->pos.col % 3] = true;
                            rows[cell->pos.row % 3] = true;
                        }
                    }

                    if (!!cols[0] + !!cols[1] + !!cols[2] == 1) {
                        Col col_id = (bc * 3) + (cols[0] ? 0 : cols[1] ? 1 : 2);
                        for (Cell* other : board->get_col(col_id)) {
                            // check if its outside this block, if not, continue
                            if (board->get_block(other->pos.row, other->pos.col) == block)
                                continue;

                            // otherwise, remove
                            changed |= other->remove_candidate(num);
                        }
                    }

                    if (!!rows[0] + !!rows[1] + !!rows[2] == 1) {
                        Row row_id = (br * 3) + (rows[0] ? 0 : rows[1] ? 1 : 2);
                        for (Cell* other : board->get_row(row_id)) {
                            // check if its outside this block, if not, continue
                            if (board->get_block(other->pos.row, other->pos.col) == block)
                                continue;

                            // otherwise, remove
                            changed |= other->remove_candidate(num);
                        }
                    }
                }
            }
        }
        return changed;
    }

    bool StandardRule::candidates_changed(Board& board) const {
        bool changed = false;
        // check if there is a row which has a candidate in a single cell;
        // if so, that cell must be that candidate.
        for (Row r = 0; r < BOARD_SIZE; ++r) {
            changed |= hidden_singles(board.get_row(r), board);
        }

        for (Col c = 0; c < BOARD_SIZE; ++c) {
            changed |= hidden_singles(board.get_col(c), board);
        }

        for (Row br = 0; br < BOARD_SIZE; br += 3) {
            for (Col bc = 0; bc < BOARD_SIZE; bc += 3) {
                changed |= hidden_singles(board.get_block(br, bc), board);
            }
        }

        changed |= pointing_values(&board);

        return changed;
    }

    bool StandardRule::check_plausibility(const Board& board) const {
        for (Row r = 0; r < BOARD_SIZE; ++r) {
            Candidates seen{Candidates::MASK_NONE};
            for (Col c = 0; c < BOARD_SIZE; ++c) {
                const Cell& cell = board.get_cell(Position{r, c});
                seen |= (cell.value != EMPTY) ? Candidates{cell.value} : cell.candidates;
            }
            if (seen.raw() != Candidates::MASK_ALL) return false;
        }

        for (Col c = 0; c < BOARD_SIZE; ++c) {
            Candidates seen{Candidates::MASK_NONE};
            for (Row r = 0; r < BOARD_SIZE; ++r) {
                const Cell& cell = board.get_cell(Position{r, c});
                seen |= (cell.value != EMPTY) ? Candidates{cell.value} : cell.candidates;
            }
            if (seen.raw() != Candidates::MASK_ALL) return false;
        }

        for (Row br = 0; br < BOARD_SIZE; br += 3) {
            for (Col bc = 0; bc < BOARD_SIZE; bc += 3) {
                Candidates seen{Candidates::MASK_NONE};
                for (Row i = 0; i < 3; ++i) {
                    for (Col j = 0; j < 3; ++j) {
                        const Cell& cell = board.get_cell(Position{br + i, bc + j});
                        seen |= (cell.value != EMPTY) ? Candidates{cell.value} : cell.candidates;
                    }
                }
                if (seen.raw() != Candidates::MASK_ALL) return false;
            }
        }

        return true;
    }

} // namespace sudoku
