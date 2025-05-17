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
        {"fixedCells":[{"r":1,"c":3,"value":8},{"r":1,"c":8,"value":7},{"r":2,"c":4,"value":2},{"r":3,"c":0,"value":8},{"r":3,"c":1,"value":4},{"r":3,"c":7,"value":2},{"r":4,"c":1,"value":2},{"r":4,"c":2,"value":5},{"r":4,"c":6,"value":1},{"r":4,"c":7,"value":8},{"r":5,"c":1,"value":3},{"r":5,"c":7,"value":5},{"r":5,"c":8,"value":4},{"r":6,"c":4,"value":5},{"r":6,"c":8,"value":1},{"r":7,"c":0,"value":4},{"r":7,"c":5,"value":9}],"rules":[{"type":"Standard","fields":{},"rules":[]},{"type":"Chevron","fields":{},"rules":[{"label":"Up Chevron","symbol":"up","fields":{"region":{"__type__":"Region","type":"edges","items":[{"__type__":"EdgeIdx","r1":0,"c1":0,"r2":1,"c2":0},{"__type__":"EdgeIdx","r1":0,"c1":1,"r2":1,"c2":1},{"__type__":"EdgeIdx","r1":0,"c1":4,"r2":1,"c2":4},{"__type__":"EdgeIdx","r1":6,"c1":3,"r2":7,"c2":3},{"__type__":"EdgeIdx","r1":7,"c1":4,"r2":8,"c2":4},{"__type__":"EdgeIdx","r1":7,"c1":6,"r2":8,"c2":6},{"__type__":"EdgeIdx","r1":5,"c1":2,"r2":6,"c2":2}]}}},{"label":"Down Chevron","symbol":"down","fields":{"region":{"__type__":"Region","type":"edges","items":[{"__type__":"EdgeIdx","r1":1,"c1":7,"r2":2,"c2":7},{"__type__":"EdgeIdx","r1":1,"c1":0,"r2":2,"c2":0},{"__type__":"EdgeIdx","r1":4,"c1":8,"r2":5,"c2":8},{"__type__":"EdgeIdx","r1":3,"c1":5,"r2":4,"c2":5},{"__type__":"EdgeIdx","r1":4,"c1":3,"r2":5,"c2":3},{"__type__":"EdgeIdx","r1":6,"c1":0,"r2":7,"c2":0},{"__type__":"EdgeIdx","r1":5,"c1":4,"r2":6,"c2":4}]}}},{"label":"Right Chevron","symbol":"right","fields":{"region":{"__type__":"Region","type":"edges","items":[{"__type__":"EdgeIdx","r1":4,"c1":3,"r2":4,"c2":4},{"__type__":"EdgeIdx","r1":8,"c1":6,"r2":8,"c2":7},{"__type__":"EdgeIdx","r1":6,"c1":6,"r2":6,"c2":7},{"__type__":"EdgeIdx","r1":5,"c1":4,"r2":5,"c2":5},{"__type__":"EdgeIdx","r1":3,"c1":6,"r2":3,"c2":7},{"__type__":"EdgeIdx","r1":0,"c1":4,"r2":0,"c2":5},{"__type__":"EdgeIdx","r1":0,"c1":2,"r2":0,"c2":3},{"__type__":"EdgeIdx","r1":2,"c1":1,"r2":2,"c2":2},{"__type__":"EdgeIdx","r1":4,"c1":0,"r2":4,"c2":1}]}}},{"label":"Left Chevron","symbol":"left","fields":{"region":{"__type__":"Region","type":"edges","items":[{"__type__":"EdgeIdx","r1":7,"c1":6,"r2":7,"c2":7},{"__type__":"EdgeIdx","r1":8,"c1":4,"r2":8,"c2":5},{"__type__":"EdgeIdx","r1":7,"c1":1,"r2":7,"c2":2},{"__type__":"EdgeIdx","r1":3,"c1":5,"r2":3,"c2":6},{"__type__":"EdgeIdx","r1":1,"c1":5,"r2":1,"c2":6},{"__type__":"EdgeIdx","r1":2,"c1":4,"r2":2,"c2":5},{"__type__":"EdgeIdx","r1":2,"c1":2,"r2":2,"c2":3},{"__type__":"EdgeIdx","r1":1,"c1":2,"r2":1,"c2":3},{"__type__":"EdgeIdx","r1":6,"c1":5,"r2":6,"c2":6}]}}}]}]}
    )";

    try {
        auto root = JSON::parse(txt);

        Board board{9};
        board.from_json(root);
        std::cout << board << std::endl;

        SolverStats stats;
        auto sol = board.solve(10, 16384, &stats);
        std::cout << stats << std::endl;
    } catch (const std::exception &e) {
        std::cerr << "Parse error: " << e.what() << "\n";
    }

    return 0;
}

extern "C" {

/**
 * @brief Solve with configurable limits and output summary.
 * @param json Input puzzle JSON as string.
 * @param max_solutions How many solutions to find (-1 for unlimited).
 * @param max_nodes Max decision nodes to explore (-1 for unlimited).
 * @return Allocated C string with formatted output. Must be freed by JS host.
 */
const char *solve(const char *json, int max_solutions, int max_nodes) {
    try {
        auto root = JSON::parse(json);
        Board board{9};
        board.from_json(root);

        SolverStats stats;
        auto solutions = board.solve(max_solutions, max_nodes, &stats);

        std::ostringstream out;

        for (size_t i = 0; i < solutions.size(); ++i) {
            out << "\nSOLUTION " << (i + 1) << ":\n";
            Board &sol = solutions[i];
            int N = sol.size();
            for (int r = 0; r < N; ++r) {
                for (int c = 0; c < N; ++c) {
                    if (c > 0)
                        out << ",";
                    out << sol.get_cell({r, c}).value;
                }
                out << "\n";
            }
        }

        out << stats; // Pretty-prints using operator<<

        //return strdup(out.str().c_str());
    } catch (const std::exception &e) {
        //return strdup(std::string("ERROR: " + std::string(e.what()) + "\n").c_str());
    }
}

/**
 * @brief Alias for solve (not implemented yet separately).
 */
const char *solveComplete(const char *json, int max_solutions, int max_nodes) {
    return solve(json, max_solutions, max_nodes);
}

} // extern "C"
