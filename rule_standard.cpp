#include "rule_standard.h"
#include "board.h"
#include "cell.h"
#include <iostream>

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

    bool hidden_singles(const std::vector<Cell*>& cells, Board& board) {
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
        Candidates to_place = seen_once & ~seen_twice;
        for (Cell* cell : cells) {
            if (cell->value != EMPTY) continue;
            if ((to_place & cell->candidates).count() == 1) {
                if (cell->pos == Position{6, 8}) {
                    auto before = cell->candidates;
                    cell->candidates &= to_place;
                    changed |= (cell->candidates != before);
                } else {
                    auto before = cell->candidates;
                    cell->candidates &= to_place;
                    changed |= (cell->candidates != before);
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
            changed |= hidden_singles({&board.get_cell(Position{r, 0}),
                            &board.get_cell(Position{r, 1}),
                            &board.get_cell(Position{r, 2}),
                            &board.get_cell(Position{r, 3}),
                            &board.get_cell(Position{r, 4}),
                            &board.get_cell(Position{r, 5}),
                            &board.get_cell(Position{r, 6}),
                            &board.get_cell(Position{r, 7}),
                            &board.get_cell(Position{r, 8})}, board);
        }

        for (Col c = 0; c < BOARD_SIZE; ++c) {
            changed |= hidden_singles({&board.get_cell(Position{0, c}),
                            &board.get_cell(Position{1, c}),
                            &board.get_cell(Position{2, c}),
                            &board.get_cell(Position{3, c}),
                            &board.get_cell(Position{4, c}),
                            &board.get_cell(Position{5, c}),
                            &board.get_cell(Position{6, c}),
                            &board.get_cell(Position{7, c}),
                            &board.get_cell(Position{8, c})}, board);
        }

        for (Row br = 0; br < BOARD_SIZE; br += 3) {
            for (Col bc = 0; bc < BOARD_SIZE; bc += 3) {
                changed |= hidden_singles(
                               {&board.get_cell(Position{br + 0, bc + 0}),
                                &board.get_cell(Position{br + 0, bc + 1}),
                                &board.get_cell(Position{br + 0, bc + 2}),
                                &board.get_cell(Position{br + 1, bc + 0}),
                                &board.get_cell(Position{br + 1, bc + 1}),
                                &board.get_cell(Position{br + 1, bc + 2}),
                                &board.get_cell(Position{br + 2, bc + 0}),
                                &board.get_cell(Position{br + 2, bc + 1}),
                                &board.get_cell(Position{br + 2, bc + 2})}, board);
            }
        }
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
