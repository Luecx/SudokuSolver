#include <iostream>
#include <fstream>
#include <string>
#include <chrono>

#include "board.h"
#include "rules/include.h"
#include "position.h"

using namespace sudoku;

int main() {
    Board board{};
    board.add_rule<StandardRule>();

    // white kropki between:
    // 0, 1 - 1, 1
    // 1, 1 - 2, 1
    // 0, 7 - 1, 7
    // 1, 7 - 2, 7
    // 3, 3 - 3, 4
    // 3, 4 - 3, 5
    // 5, 8 - 6, 8
    // 7, 2 - 8, 2
    // 8, 2 - 8, 3
    board.add_rule<WhiteKropki>(Position(0, 1), Position(1, 1));
    board.add_rule<WhiteKropki>(Position(1, 1), Position(2, 1));
    board.add_rule<WhiteKropki>(Position(0, 7), Position(1, 7));
    board.add_rule<WhiteKropki>(Position(1, 7), Position(2, 7));
    board.add_rule<WhiteKropki>(Position(3, 3), Position(3, 4));
    board.add_rule<WhiteKropki>(Position(3, 4), Position(3, 5));
    board.add_rule<WhiteKropki>(Position(5, 8), Position(6, 8));
    board.add_rule<WhiteKropki>(Position(7, 2), Position(8, 2));
    board.add_rule<WhiteKropki>(Position(8, 2), Position(8, 3));

    // (1-2), left, top, right
    board.add_rule<ArrowRule>(Position{1, 2}, std::vector{Position{1,1}, Position{0, 1}, Position{0, 2}});
    // symmetric as before (starting at (1,6))
    board.add_rule<ArrowRule>(Position{1, 6}, std::vector{Position{1,7}, Position{0, 7}, Position{0, 6}});
    // (3,3) -> (2,2) -> (2,1) and symmetric
    board.add_rule<ArrowRule>(Position(3, 3), std::vector{Position(2, 2), Position(2, 1)});
    board.add_rule<ArrowRule>(Position(3, 5), std::vector{Position(2, 6), Position(2, 7)});
    // (5, 1) -> (4, 2) -> (4, 3) and symmetric
    board.add_rule<ArrowRule>(Position(5, 1), std::vector{Position(4, 2), Position(4, 3)});
    board.add_rule<ArrowRule>(Position(5, 7), std::vector{Position(4, 6), Position(4, 5)});
    // (5, 4), and below twice
    board.add_rule<ArrowRule>(Position(5, 4), std::vector{Position(6, 4), Position(7, 4)});
    // (7, 2) -> (7, 1) -> (6, 1) -> (6, 2) and symmetric
    board.add_rule<ArrowRule>(Position(7, 2), std::vector{Position(7, 1), Position(6, 1), Position(6, 2)});
    board.add_rule<ArrowRule>(Position(7, 6), std::vector{Position(7, 7), Position(6, 7), Position(6, 6)});


    auto solutions = board.solve();
    solutions[0].display(false);

    return 0;
}
