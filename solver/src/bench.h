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

    // Pre-load all JSON files to avoid I/O overhead in timing
    std::vector<std::string> json_contents;
    for (const auto &file_path: json_files) {
        std::ifstream file(file_path);
        if (!file.is_open()) {
            std::cerr << "[ERROR] Failed to open " << file_path << std::endl;
            continue;
        }
        std::stringstream buffer;
        buffer << file.rdbuf();
        json_contents.push_back(buffer.str());
    }

    const int num_runs = 50;
    std::vector<float> run_times;
    
    // Run benchmark 50 times
    for (int run = 0; run < num_runs; ++run) {
        std::cout << "[RUN " << (run + 1) << "/" << num_runs << "]\n";
        
        // statistics for this run
        int total_puzzles = 0;
        int total_solutions = 0;
        uint64_t total_nodes = 0;
        int successful_solutions = 0;
        float total_time_ms = 0;

        for (size_t i = 0; i < json_files.size() && i < json_contents.size(); ++i) {
            const auto &file_path = json_files[i];
            const auto &txt = json_contents[i];

            total_puzzles++;

            try {
                auto root = JSON::parse(txt);

                Board board{9};
                board.from_json(root);

                SolverStats stats;
                auto sol = solve_complete ? board.solve_complete(&stats, max_nodes) : board.solve(max_solutions, max_nodes, &stats);

                total_solutions += stats.solutions_found;
                total_nodes += stats.nodes_explored;
                total_time_ms += stats.time_taken_ms;

                if (!sol.empty())
                    successful_solutions++;
            } catch (const std::exception &e) {
                std::cerr << "[ERROR] Error processing " << file_path << ": " << e.what() << "\n";
            }
        }
        
        run_times.push_back(total_time_ms);
        std::cout << "Run " << (run + 1) << " total time: " << std::fixed << std::setprecision(3) << total_time_ms << " ms\n";
    }

    // Calculate statistics across all runs
    float sum_time = 0;
    float min_time = run_times[0];
    float max_time = run_times[0];
    
    for (float time : run_times) {
        sum_time += time;
        min_time = std::min(min_time, time);
        max_time = std::max(max_time, time);
    }
    
    float avg_time = sum_time / num_runs;

    print_header("BENCHMARK SUMMARY(" + std::to_string(num_runs) + " RUNS)");

    std::cout << "+----------------------------------------+\n";

    // Average time row
    std::cout << "| " << std::setw(26) << std::left << "Average time (ms):";
    std::stringstream avg_ss;
    avg_ss << std::fixed << std::setprecision(3) << avg_time;
    std::cout << std::setw(12) << std::right << avg_ss.str() << " |\n";

    // Min time row
    std::cout << "| " << std::setw(26) << std::left << "Min time (ms):";
    std::stringstream min_ss;
    min_ss << std::fixed << std::setprecision(3) << min_time;
    std::cout << std::setw(12) << std::right << min_ss.str() << " |\n";

    // Max time row
    std::cout << "| " << std::setw(26) << std::left << "Max time (ms):";
    std::stringstream max_ss;
    max_ss << std::fixed << std::setprecision(3) << max_time;
    std::cout << std::setw(12) << std::right << max_ss.str() << " |\n";

    // Total time across all runs
    std::cout << "| " << std::setw(26) << std::left << "Total time (ms):";
    std::stringstream total_ss;
    total_ss << std::fixed << std::setprecision(3) << sum_time;
    std::cout << std::setw(12) << std::right << total_ss.str() << " |\n";

    std::cout << "+----------------------------------------+\n";

    print_header("BENCHMARK FINISHED");
}

} // namespace bench
