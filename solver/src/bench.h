#pragma once

#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "board/board.h"
#include "json/json.h"

using namespace sudoku;

namespace bench {

void print_header(const std::string &title) {
    std::cout << "+----------------------------------------+\n";
    std::cout << "| " << std::setw(38) << std::left << title << " |\n";
    std::cout << "+----------------------------------------+\n";
}

/**
 * @brief Benchmarks the sudoku solver across multiple puzzles in a directory
 * @param directory_path Path to directory containing JSON puzzle files or path to a single JSON file
 * @param max_solutions How many solutions to find per puzzle
 * @param max_nodes Max decision nodes to explore per puzzle
 * @param solve_complete If true, does a complete solve
 */
void bench(const char *directory_path, int max_solutions, int max_nodes, bool solve_complete) {
    print_header("BENCHMARK STARTING");

    std::vector<std::string> json_files;
    std::filesystem::path path(directory_path);

    if (std::filesystem::exists(path)) {
        if (std::filesystem::is_directory(path)) {
            try {
                for (const auto &entry: std::filesystem::recursive_directory_iterator(path)) {
                    if (entry.is_regular_file() && entry.path().extension() == ".json") {
                        json_files.push_back(entry.path().string());
                    }
                }
            } catch (const std::exception &e) {
                std::cerr << "[ERROR] Error accessing directory: " << e.what() << std::endl;
                print_header("BENCHMARK FAILED");
                return;
            }

            if (json_files.empty()) {
                std::cout << "[WARNING] No JSON files found in directory (including subdirectories): " << directory_path
                          << std::endl;
                print_header("BENCHMARK FINISHED");
                return;
            }

            std::cout << "[INFO] Found " << json_files.size() << " puzzle files to benchmark\n";
        } else {
            // it's a file, check if it's a JSON file
            if (path.extension() == ".json") {
                json_files.push_back(path.string());
            } else {
                std::cerr << "[ERROR] The path is not a directory or a JSON file: " << directory_path << std::endl;
                print_header("BENCHMARK FAILED");
                return;
            }
        }
    } else {
        std::cerr << "[ERROR] Path does not exist: " << directory_path << std::endl;
        print_header("BENCHMARK FAILED");
        return;
    }

    std::cout << std::endl;

    // statistics for the benchmark
    int total_puzzles = 0;
    int total_solutions = 0;
    uint64_t total_nodes = 0;
    int successful_solutions = 0;
    float total_time_ms = 0;

    for (const auto &file_path: json_files) {
        std::string txt;
        {
            std::ifstream file(file_path);
            if (!file.is_open()) {
                std::cerr << "[ERROR] Failed to open " << file_path << std::endl;
                continue;
            }
            std::stringstream buffer;
            buffer << file.rdbuf();
            txt = buffer.str();
        }

        std::cout << "[PROCESSING] " << file_path << "\n";

        total_puzzles++;

        try {
            auto root = JSON::parse(txt);

            Board board{9};
            board.from_json(root);

            // Run 100 iterations
            const int iterations = 100;
            float total_iteration_time = 0.0f;
            int total_iteration_solutions = 0;
            uint64_t total_iteration_nodes = 0;
            bool any_solution_found = false;

            for (int i = 0; i < iterations; ++i) {
                SolverStats stats;
                auto sol = solve_complete ? board.solve_complete(&stats, max_nodes)
                                          : board.solve(max_solutions, max_nodes, &stats);

                total_iteration_time += stats.time_taken_ms;
                total_iteration_solutions += stats.solutions_found;
                total_iteration_nodes += stats.nodes_explored;

                if (!sol.empty()) {
                    any_solution_found = true;
                }
            }

            // Calculate averages
            float avg_time = total_iteration_time / iterations;
            float avg_solutions = static_cast<float>(total_iteration_solutions) / iterations;
            uint64_t avg_nodes = total_iteration_nodes / iterations;

            std::cout << "Average over " << iterations << " runs:\n";
            std::cout << "  Time: " << std::fixed << std::setprecision(3) << avg_time << " ms\n";
            std::cout << "  Solutions: " << std::fixed << std::setprecision(2) << avg_solutions << "\n";
            std::cout << "  Nodes: " << avg_nodes << "\n";

            // Add to totals (using averages)
            total_solutions += static_cast<int>(avg_solutions);
            total_nodes += avg_nodes;
            total_time_ms += avg_time;

            if (any_solution_found)
                successful_solutions++;

            // Show board if no solutions found in any iteration
            if (total_iteration_solutions == 0)
                std::cout << board << std::endl;

        } catch (const std::exception &e) {
            std::cerr << "[ERROR] Error processing " << file_path << ": " << e.what() << "\n";
        }
    }

    print_header("BENCHMARK SUMMARY");

    std::cout << "+----------------------------------------+\n";

    // Total puzzles row
    std::cout << "| " << std::setw(26) << std::left << "Total puzzles:";
    std::cout << std::setw(12) << std::right << total_puzzles << " |\n";

    // Puzzles solved row
    std::cout << "| " << std::setw(26) << std::left << "Puzzles solved:";
    std::cout << std::setw(12) << std::right << successful_solutions << " |\n";

    // Total solutions row
    std::cout << "| " << std::setw(26) << std::left << "Total solutions:";
    std::cout << std::setw(12) << std::right << total_solutions << " |\n";

    // Total nodes row
    std::cout << "| " << std::setw(26) << std::left << "Total nodes:";
    std::cout << std::setw(12) << std::right << total_nodes << " |\n";

    // Total time row
    std::cout << "| " << std::setw(26) << std::left << "Total time (ms):";
    std::stringstream time_ss;
    time_ss << std::fixed << std::setprecision(3) << total_time_ms;
    std::cout << std::setw(12) << std::right << time_ss.str() << " |\n";

    if (total_puzzles > 0) {
        // Success rate row
        std::cout << "| " << std::setw(25) << std::left << "Success rate:";
        double success_rate = (successful_solutions * 100.0 / total_puzzles);
        std::stringstream rate_ss;
        rate_ss << std::fixed << std::setprecision(2) << success_rate << "%";
        std::cout << std::setw(13) << std::right << rate_ss.str() << " |\n";
    }
    std::cout << "+----------------------------------------+\n";

    print_header("BENCHMARK FINISHED");
}

} // namespace bench
