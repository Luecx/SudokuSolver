#pragma once

#include <iostream>
#include <random>

#include "board/board.h"
#include "rules/include.h"

namespace sudoku::datagen {

/**
 * @brief Generates a random Sudoku puzzle with unique solution and saves it as JSON.
 *
 * @param output_dir Directory to save the puzzle JSON
 * @param solutions_limit Maximum number of solutions to find
 * @param node_limit Node limit for uniqueness check
 * @param guesses_limit Maximum number of guesses allowed (default: 0, meaning no limit)
 *
 */
// clang-format off
 void generate_random_puzzle
(
    const std::string &output_dir, 
    int solutions_limit, 
    int node_limit, 
    int guesses_limit = 0
) {
    // clang-format on
    Board board{9};

    // initialize all handlers needed
    board.add_handler(std::make_shared<RuleStandard>(&board));
    board.add_handler(std::make_shared<RuleExtraRegions>(&board));

    std::vector<CellIdx> filled_pos;

    // find a random solution
    while (true) {
        // something weird is happening here
        // some sodukus who have no solution, still return a solution
        // this only gets noticed when the jsons are loaded and benchmarked
        board.clear();
        board.init_randomly();

        SolverStats stats;
        auto solutions = board.solve(solutions_limit, node_limit, &stats);
        if (stats.solutions_found < 1)
            continue; // no solution found, try again

        int idx = rand() % solutions.size();
        const auto &solution = solutions[idx];

        for (Row r = 0; r < board.size(); ++r) {
            for (Col c = 0; c < board.size(); ++c) {
                CellIdx pos{r, c};
                filled_pos.push_back(pos);
                board.get_cell(pos).set_value(solution.get(r, c));
            }
        }

        break;
    }

    std::random_device rd;
    std::mt19937 gen(rd());
    std::shuffle(filled_pos.begin(), filled_pos.end(), gen);

    for (const auto &pos: filled_pos) {
        Cell &cell = board.get_cell(pos);
        Number original_value = cell.value;
        cell.clear();

        SolverStats test_stats;
        auto test_solutions = board.solve(2, node_limit, &test_stats);

        bool keep_cell = false;
        if (test_stats.solutions_found != 1)
            keep_cell = true; // if we didn't get exactly one solution, keep the cell
        else if (test_stats.interrupted_by_node_limit)
            keep_cell = true; // if we hit the node limit, keep the cell
        else if (test_stats.guesses_made > guesses_limit && guesses_limit > 0)
            keep_cell = true; // if we made too many guesses, keep the cell

        if (keep_cell)
            cell.set_value(original_value);
    }

    // save the puzzle
    try {
        auto now = std::chrono::system_clock::now();
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();

        std::string dir = output_dir;
        if (!dir.empty() && dir.back() != '/' && dir.back() != '\\')
            dir += '/';

        std::filesystem::create_directories(dir);
        std::string filename = dir + "sudoku_puzzle_" + std::to_string(ms) + ".json";
        board.to_json(filename);
    } catch (const std::exception &e) {
        std::cerr << "Error saving puzzle: " << e.what() << std::endl;
        return;
    }
}

} // namespace sudoku::datagen
