#include <iostream>

#include "bench.h"
#include "board/board.h"
#include "json/json.h"
#include "solver_stats.h"
#include "rules/include.h"

int main(int argc, char *argv[]) {
    bench::bench(argv[1], 17, 16384, true);
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

        for (auto &sol : solutions) {
            std::cout << "[SOLUTION]";
            int N = sol.size();
            for (int r = 0; r < N; ++r) {
                for (int c = 0; c < N; ++c) {
                    std::cout << (int)(sol.get_cell({r, c}).value);
                    if (!(r == N - 1 && c == N - 1)) std::cout << ",";
                }
            }
            std::cout << "\n";
        }

        std::cout << "[INFO]solutions_found=" << stats.solutions_found << "\n";
        std::cout << "[INFO]nodes_explored=" << stats.nodes_explored << "\n";
        std::cout << "[INFO]time_taken_ms=" << std::fixed << std::setprecision(3) << stats.time_taken_ms << "\n";
        std::cout << "[INFO]interrupted_by_node_limit=" << (stats.interrupted_by_node_limit ? "true" : "false") << "\n";
        std::cout << "[INFO]interrupted_by_solution_limit=" << (stats.interrupted_by_solution_limit ? "true" : "false") << "\n";
    } catch (const std::exception &e) {
        std::cout << "[INFO]error=" << e.what() << "\n";
    }
    std::cout << "[DONE]\n";
}

/**
 * @brief Alias for solve (no separate implementation).
 */
void solveComplete(const char *json, int max_solutions, int max_nodes) { solve(json, max_solutions, max_nodes); }

} // extern "C"
