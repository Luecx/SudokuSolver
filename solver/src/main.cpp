#include <iostream>

#include "bench.h"
#include "board/board.h"
#include "json/json.h"
#include "solver_stats.h"


int main(int argc, char *argv[]) {
    bench::bench(argv[1], 17, 10 * 16384, false);
    return 0;
}

extern "C" {

/**
 * @brief Solve with configurable limits and output summary.
 *        Prints "STARTING" at start and "FINISHED" at end.
 * @param json Input puzzle JSON as string.
 * @param max_solutions How many solutions to find (-1 for unlimited).
 * @param max_nodes Max decision nodes to explore (-1 for unlimited).
 */
void solve(const char *json, int max_solutions, int max_nodes) {
    std::cout << "STARTING\n";
    try {
        auto root = JSON::parse(json);
        Board board{9};
        board.from_json(root);

        SolverStats stats;
        auto solutions = board.solve(max_solutions, max_nodes, &stats);

        for (size_t i = 0; i < solutions.size(); ++i) {
            std::cout << "\nSOLUTION " << (i + 1) << ":";
            Board &sol = solutions[i];
            int N = sol.size();
            for (int r = 0; r < N; ++r) {
                for (int c = 0; c < N; ++c) {
                    std::cout << (int) sol.get_cell({r, c}).value << ",";
                }
            }
            std::cout << "\n";
        }

        std::cout << stats; // Pretty-prints using operator<<

    } catch (const std::exception &e) {
        std::cout << "ERROR: " << e.what() << "\n";
    }
    std::cout << "FINISHED\n";
}
/**
 * @brief Alias for solve (no separate implementation).
 */
void solveComplete(const char *json, int max_solutions, int max_nodes) { solve(json, max_solutions, max_nodes); }

} // extern "C"
