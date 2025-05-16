#include <iostream>
#include <fstream>
#include <string>
#include <chrono>

//#include "board.h"
//#include "rules/include.h"
//#include "position.h"
#include "board/board.h"
#include "json/json.h"
#include "number_set.h"
#include "region/region.h"

using namespace sudoku;

int main() {
    std::string txt = R"(
{"fixedCells":[],"rules":[{"type":"Kropki","fields":{"allDotsGiven":false},"rules":[{"label":"White Kropki Dots","color":"white","fields":{"region":{"__type__":"Region","type":"edges","items":[{"__type__":"EdgeIdx","r1":2,"c1":1,"r2":2,"c2":2},{"__type__":"EdgeIdx","r1":1,"c1":4,"r2":1,"c2":5},{"__type__":"EdgeIdx","r1":3,"c1":4,"r2":3,"c2":5},{"__type__":"EdgeIdx","r1":2,"c1":4,"r2":3,"c2":4},{"__type__":"EdgeIdx","r1":5,"c1":5,"r2":5,"c2":6}]}}},{"label":"Black Kropki Dots","color":"black","fields":{"region":{"__type__":"Region","type":"edges","items":[{"__type__":"EdgeIdx","r1":2,"c1":8,"r2":3,"c2":8},{"__type__":"EdgeIdx","r1":3,"c1":8,"r2":4,"c2":8},{"__type__":"EdgeIdx","r1":4,"c1":8,"r2":5,"c2":8}]}}}]}]}
)";

    try {
        auto root = JSON::parse(txt);

        Board board{9};
        std::cout << board << std::endl;
        board.from_json(root);
        std::cout << board << std::endl;
        SolverStats stats;
        auto sol = board.solve(1, 16384, &stats);
        std::cout << stats << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Parse error: " << e.what() << "\n";
    }
    return 0;
}
