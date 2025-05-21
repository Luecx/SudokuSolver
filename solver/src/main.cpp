#include <iostream>

#include <chrono>
#include <functional>
#include <random>
#include <unordered_set>

#include "bench.h"
#include "board/board.h"
#include "json/json.h"
#include "rules/include.h"
#include "solver_stats.h"


int main(int argc, char *argv[]) {
    bench::bench(argv[1], 17, 16384, false);
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

        for (auto &sol: solutions) {
            std::cout << "[SOLUTION]" << sol << std::endl;
        }

        std::cout << "[INFO]solutions_found=" << stats.solutions_found << "\n";
        std::cout << "[INFO]nodes_explored=" << stats.nodes_explored << "\n";
        std::cout << "[INFO]time_taken_ms=" << std::fixed << std::setprecision(3) << stats.time_taken_ms << "\n";
        std::cout << "[INFO]interrupted_by_node_limit=" << (stats.interrupted_by_node_limit ? "true" : "false") << "\n";
        std::cout << "[INFO]interrupted_by_solution_limit=" << (stats.interrupted_by_solution_limit ? "true" : "false")
                  << "\n";
    } catch (const std::exception &e) {
        std::cout << "[INFO]error=" << e.what() << "\n";
    }
    std::cout << "[DONE]\n";
}


/**
 * @brief Solve using complete method with progress logging.
 *        Prints "STARTING" at start, regular progress updates, and "DONE" at end.
 * @param json Input puzzle JSON as string.
 * @param unused Not used; kept for signature consistency.
 * @param max_nodes Max decision nodes to explore (-1 for unlimited).
 */
void solveComplete(const char *json, int /*unused*/, int max_nodes) {
    std::cout << "STARTING\n";
    try {
        auto root = JSON::parse(json);
        Board board{9};
        board.from_json(root);

        SolverStats stats;

        float last_progress_reported = -1.0f;

        auto solutions = board.solve_complete(
                &stats, max_nodes,
                [&](float progress) {
                    float rounded = std::floor(progress * 100.0f) / 100.0f;
                    if (rounded > last_progress_reported) {
                        last_progress_reported = rounded;
                        std::cout << "[PROGRESS]" << std::fixed << std::setprecision(2) << rounded << "\n";
                    }
                },
                [&](Solution &sol) {
                    std::cout << "[SOLUTION]" << sol << std::endl;
                    ;
                });

        std::cout << "[INFO]solutions_found=" << stats.solutions_found << "\n";
        std::cout << "[INFO]nodes_explored=" << stats.nodes_explored << "\n";
        std::cout << "[INFO]time_taken_ms=" << std::fixed << std::setprecision(3) << stats.time_taken_ms << "\n";
        std::cout << "[INFO]interrupted_by_node_limit=" << (stats.interrupted_by_node_limit ? "true" : "false") << "\n";
        std::cout << "[INFO]interrupted_by_solution_limit=" << (stats.interrupted_by_solution_limit ? "true" : "false")
                  << "\n";
    } catch (const std::exception &e) {
        std::cout << "[INFO]error=" << e.what() << "\n";
    }
    std::cout << "[DONE]\n";
}


} // extern "C"
