#include <iostream>

#include <chrono>
#include <cstdlib> // for std::atoi
#include <functional>
#include <random>
#include <unordered_set>

#include "bench.h"
#include "board/board.h"
#include "json/json.h"
#include "solver_stats.h"

#include "datagen.h"
#include "rules/include.h"

extern "C" {
void solve(const char *json, int max_solutions, int max_nodes);
void solveComplete(const char *json, int unused, int max_nodes);
}

void print_help() {
    std::cout << "Usage:\n"
              << "  ./solver solve <json_path> <solution_limit> <node_limit>\n"
              << "  ./solver complete <json_path> <node_limit>\n"
              << "  ./solver bench <json_path>\n";
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        std::cerr << "Error: No command provided.\n";
        print_help();
        return 1;
    }

    std::string command = argv[1];

    if (command == "solve") {
        if (argc != 5) {
            std::cerr << "Error: 'solve' requires <json_path> <solution_limit> <node_limit>\n";
            print_help();
            return 1;
        }

        const char *json_path = argv[2];
        int max_solutions = std::atoi(argv[3]);
        int max_nodes = std::atoi(argv[4]);

        std::ifstream in(json_path);
        if (!in) {
            std::cerr << "Error: Cannot open file '" << json_path << "'\n";
            return 1;
        }

        std::string json((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
        solve(json.c_str(), max_solutions, max_nodes);
        return 0;
    }

    if (command == "complete") {
        if (argc != 4) {
            std::cerr << "Error: 'complete' requires <json_path> <node_limit>\n";
            print_help();
            return 1;
        }

        const char *json_path = argv[2];
        int max_nodes = std::atoi(argv[3]);

        std::ifstream in(json_path);
        if (!in) {
            std::cerr << "Error: Cannot open file '" << json_path << "'\n";
            return 1;
        }

        std::string json((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
        solveComplete(json.c_str(), 0, max_nodes);
        return 0;
    }

    if (command == "bench") {
        if (argc != 3) {
            std::cerr << "Error: 'bench' requires <json_path>\n";
            print_help();
            return 1;
        }

        bench::bench(argv[2], 17, 128000, false);
        return 0;
    } else if (command == "datagen") {
        if (argc != 3) {
            std::cerr << "Error: 'datagen' requires <output_path>\n";
            print_help();
            return 1;
        }

        Board board{9};

        // initialize all handlers needed
        board.add_handler(std::make_shared<RuleStandard>(&board));
        board.add_handler(std::make_shared<RuleClone>(&board));

        const int puzzle_count = 1;
        for (int i = 0; i < puzzle_count; i++) {
            std::cout << "Generating puzzle " << (i + 1) << "/" << puzzle_count << "...\n";
            datagen::generate_random_puzzle(argv[2], board, 17, 16384);
        }

        return 0;
    }

    std::cerr << "Error: Unknown command '" << command << "'\n";
    print_help();
    return 1;
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
        std::cout << "[INFO]guesses_made=" << stats.guesses_made << "\n";
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
