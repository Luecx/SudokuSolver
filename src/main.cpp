#include <chrono>
#include <fstream>
#include <iostream>
#include <string>


// #include "board.h"
#include "rules/include.h"
// #include "position.h"
#include "board/board.h"
#include "json/json.h"
#include "number_set.h"
#include "region/region.h"

using namespace sudoku;

int main() {
    std::string txt = R"(
        {"fixedCells":[{"r":0,"c":0,"value":9},{"r":0,"c":1,"value":1},{"r":0,"c":5,"value":3},{"r":0,"c":6,"value":5},{"r":0,"c":8,"value":2},{"r":1,"c":3,"value":4},{"r":1,"c":6,"value":3},{"r":2,"c":1,"value":8},{"r":3,"c":0,"value":3},{"r":3,"c":1,"value":4},{"r":3,"c":3,"value":7},{"r":3,"c":7,"value":6},{"r":4,"c":0,"value":8},{"r":4,"c":1,"value":2},{"r":4,"c":3,"value":1},{"r":5,"c":1,"value":6},{"r":5,"c":3,"value":9},{"r":5,"c":4,"value":4},{"r":5,"c":8,"value":1},{"r":6,"c":0,"value":5},{"r":6,"c":1,"value":9},{"r":6,"c":3,"value":6},{"r":6,"c":7,"value":1},{"r":7,"c":2,"value":4},{"r":7,"c":3,"value":3},{"r":7,"c":4,"value":1},{"r":7,"c":8,"value":5},{"r":8,"c":2,"value":8},{"r":8,"c":5,"value":9}],"rules":[{"type":"Standard","fields":{},"rules":[]}]}
    )";

    try {
        auto root = JSON::parse(txt);

        Board board{9};
        board.from_json(root);
        std::cout << board << std::endl;
        SolverStats stats;
        auto sol = board.solve(1, 16384, &stats);
        std::cout << stats << std::endl;

        board.add_handler(std::make_shared<RuleStandard>(&board));

        SolverStats stats;
        auto sol = board.solve(1, 16384, &stats);
        std::cout << stats << std::endl;
    } catch (const std::exception &e) {
        std::cerr << "Parse error: " << e.what() << "\n";
    }
    
    return 0;
}
