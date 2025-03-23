#include <iostream>
#include "board.h"
#include "rules.h"
#include "rule_standard.h"
#include "rule_white_kropki.h"
#include "rule_black_kropki.h"
#include "rule_odd_even.h"
#include "position.h"

#include "candidates.h"

using namespace sudoku;

int main() {

    Board board;
    board.add_rule<StandardRule>();

    board.set_cell(Position{0, 3}, 1);
    board.set_cell(Position{0, 5}, 2);
    board.set_cell(Position{1, 1}, 6);
    board.set_cell(Position{1, 7}, 7);
    board.set_cell(Position{2, 2}, 8);
    board.set_cell(Position{2, 6}, 9);

    board.set_cell(Position{3, 0}, 4);
    board.set_cell(Position{3, 8}, 3);
    board.set_cell(Position{4, 1}, 5);
    board.set_cell(Position{4, 5}, 7);
    board.set_cell(Position{5, 0}, 2);
    board.set_cell(Position{5, 4}, 8);
    board.set_cell(Position{5, 8}, 1);

    board.set_cell(Position{6, 2}, 9);
    board.set_cell(Position{6, 6}, 8);
    board.set_cell(Position{6, 8}, 5);
    board.set_cell(Position{7, 1}, 7);
    board.set_cell(Position{7, 7}, 6);
    board.set_cell(Position{8, 3}, 3);
    board.set_cell(Position{8, 5}, 4);

    board.print();


    board.process_rule_candidates();
    board.solve();
    board.print();

    return 0;
}
