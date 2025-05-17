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
    std::string txt;
    {
        std::ifstream file("C:/Users/semio/Downloads/sudoku_jsons/extra-regions/extra-regions-1.json");
        if (!file.is_open()) {
            std::cerr << "Failed to open puzzle.json" << std::endl;
            return 1;
        }
        std::stringstream buffer;
        buffer << file.rdbuf();
        txt = buffer.str();
    }

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
        // return strdup(std::string("ERROR: " + std::string(e.what()) + "\n").c_str());
    }
}

/**
 * @brief Alias for solve (not implemented yet separately).
 */
const char *solveComplete(const char *json, int max_solutions, int max_nodes) {
    return solve(json, max_solutions, max_nodes);
}

} // extern "C"
