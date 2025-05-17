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
        {"fixedCells":[{"r":0,"c":1,"value":5},{"r":0,"c":3,"value":6},{"r":2,"c":0,"value":3},{"r":7,"c":0,"value":4}],"rules":[{"type":"Kropki","fields":{"allDotsGiven":true},"rules":[{"label":"White Kropki Dots","color":"white","fields":{"region":{"__type__":"Region","type":"edges","items":[]}}},{"label":"Black Kropki Dots","color":"black","fields":{"region":{"__type__":"Region","type":"edges","items":[]}}}]},{"type":"Standard","fields":{},"rules":[]}]}
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

       // return strdup(out.str().c_str());
    } catch (const std::exception &e) {
      //  return strdup(std::string("ERROR: " + std::string(e.what()) + "\n").c_str());
    }
}

/**
 * @brief Alias for solve (not implemented yet separately).
 */
const char *solveComplete(const char *json, int max_solutions, int max_nodes) {
    return solve(json, max_solutions, max_nodes);
}

} // extern "C"
