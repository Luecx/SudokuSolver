#include <iostream>
#include <fstream>
#include <string>
#include <chrono>

#include "board.h"
#include "rules.h"
#include "rule_standard.h"
#include "position.h"

using namespace sudoku;

int main() {
    std::ifstream infile("test.txt");
    if (!infile) {
        std::cerr << "Failed to open test.txt\n";
        return 1;
    }

    std::string line;
    int puzzle_count = 0;

    auto total_start = std::chrono::high_resolution_clock::now();

    while (std::getline(infile, line)) {
        if (line.length() < 81) {
            std::cerr << "Skipping invalid line " << puzzle_count + 1 << ": not 81 digits.\n";
            continue;
        }

        Board board;
        board.add_rule<StandardRule>();

        // Fill board
        for (int i = 0; i < 81; ++i) {
            char ch = line[i];
            if (ch >= '1' && ch <= '9') {
                int value = ch - '0';
                int row = i / 9;
                int col = i % 9;
                board.set_cell({row, col}, value);
            }
        }

        // Solve
        board.process_rule_candidates();
        board.solve();

        // Uncomment to display each solved board
        // std::cout << "Puzzle " << puzzle_count + 1 << " solved:\n";
        // board.display();

        ++puzzle_count;
    }

    auto total_end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> total_time = total_end - total_start;

    std::cout << "Solved " << puzzle_count << " puzzles in " << total_time.count() << " seconds.\n";

    return 0;
}
