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
        {"fixedCells":[{"r":0,"c":1,"value":5},{"r":0,"c":3,"value":6},{"r":2,"c":0,"value":3},{"r":7,"c":0,"value":4}, {"r":6,"c":3,"value":7}],"rules":[{"type":"Kropki","fields":{"allDotsGiven":true},"rules":[{"label":"White Kropki Dots","color":"white","fields":{"region":{"__type__":"Region","type":"edges","items":[]}}},{"label":"Black Kropki Dots","color":"black","fields":{"region":{"__type__":"Region","type":"edges","items":[]}}}]},{"type":"Standard","fields":{},"rules":[]}]}
    )";

    try {
        auto root = JSON::parse(txt);

        Board board{9};
        board.from_json(root);
        std::cout << board << std::endl;

        SolverStats stats;
        auto sol = board.solve(1, 16384, &stats);
        std::cout << stats << std::endl;
    } catch (const std::exception &e) {
        std::cerr << "Parse error: " << e.what() << "\n";
    }

    return 0;
}
