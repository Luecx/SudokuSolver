#include "board.h"
#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>
#include "solver_stats.h"

namespace sudoku {

    Board::Board() {
        for (int i = 0; i < BOARD_SIZE; ++i) {
            for (int j = 0; j < BOARD_SIZE; ++j) {
                grid_[i][j] = Cell(i, j);
            }
        }
    }

    const Cell& Board::get_cell(const Position& pos) const {
        return grid_[pos.row][pos.col];
    }

    Cell& Board::get_cell(const Position& pos) {
        return grid_[pos.row][pos.col];
    }

    bool Board::is_valid_move(const Position& pos, Number number) const {
        return grid_[pos.row][pos.col].candidates.test(number);
    }

    bool Board::impossible(const Position &pos) const {
        // Check for any unsolved cell that has no candidates.
        for (int i = 0; i < BOARD_SIZE; ++i) {
            for (int j = 0; j < BOARD_SIZE; ++j) {
                if (grid_[i][j].value == EMPTY && grid_[i][j].candidates == CAND_NONE)
                    return true;
            }
        }
        // Let each rule verify its plausibility.
        for (const auto& rule : rules_) {
            if (!rule->check_plausibility(*this)) {
                return true;
            }
        }
        return false;
    }

    bool Board::set_cell(const Position& pos, Number number) {
        if (!is_valid_move(pos, number))
            return false;

        // (Optional) In the branching part we make a backup so we don't push every move.
        // history_.push_back(grid_);
        grid_[pos.row][pos.col].value      = number;
        grid_[pos.row][pos.col].candidates = CAND_NONE;
        for (const auto& rule : rules_) {
            rule->number_changed(*this, grid_[pos.row][pos.col]);
        }
        process_rule_candidates();

        if (impossible(pos)) {
            // If move leads to contradiction, you might want to undo here.
            // undo_move();
            return false;
        }
        return true;
    }

    bool Board::undo_move() {
        if (history_.empty())
            return false;
        grid_ = history_.back();
        history_.pop_back();
        return true;
    }

    void Board::print() const {
        for (int i = 0; i < BOARD_SIZE; ++i) {
            for (int j = 0; j < BOARD_SIZE; ++j) {
                int val = grid_[i][j].value;
                std::cout << (val == EMPTY ? ". " : std::to_string(val) + " ");
            }
            std::cout << std::endl;
        }
    }

    void Board::display() const {
        // Dimensions for each cell.
        constexpr int CELL_WIDTH  = 7;
        constexpr int CELL_HEIGHT = 3;

        // Configurable separators between cells.
        const std::string withinBlockHorSep   = "   ";   // 3 spaces
        const std::string betweenBlockHorSep  = "      "; // 6 spaces

        // Vertical separator counts
        constexpr int withinBlockVerSep = 1;
        constexpr int betweenBlockVerSep = 2;
        const char verticalSepFill = ' ';

        const int totalWidth = BOARD_SIZE * CELL_WIDTH
                               + 2 * betweenBlockHorSep.size()
                               + 6 * withinBlockHorSep.size();

        std::vector<std::string> buffer;

        auto getCellBuffer = [](const Cell &cell) -> std::vector<std::string> {
            std::vector<std::string> cellBuf(CELL_HEIGHT, std::string(CELL_WIDTH, ' '));
            if (cell.value != EMPTY) {
                char digit = '0' + cell.value;
                cellBuf[1][3] = digit;
            } else {
                for (int d = 1; d <= 9; d++) {
                    if (cell.candidates.test(d)) {
                        int row = (d - 1) / 3;
                        int col = 1 + 2 * ((d - 1) % 3);
                        cellBuf[row][col] = '0' + d;
                    }
                }
            }
            return cellBuf;
        };

        std::array<std::array<std::vector<std::string>, BOARD_SIZE>, BOARD_SIZE> cellBuffers;
        for (int r = 0; r < BOARD_SIZE; r++) {
            for (int c = 0; c < BOARD_SIZE; c++) {
                cellBuffers[r][c] = getCellBuffer(grid_[r][c]);
            }
        }

        for (int cellRow = 0; cellRow < BOARD_SIZE; cellRow++) {
            for (int lineIndex = 0; lineIndex < CELL_HEIGHT; lineIndex++) {
                std::string line;
                for (int cellCol = 0; cellCol < BOARD_SIZE; cellCol++) {
                    line += cellBuffers[cellRow][cellCol][lineIndex];
                    if (cellCol < BOARD_SIZE - 1) {
                        line += ((cellCol + 1) % 3 == 0) ? betweenBlockHorSep : withinBlockHorSep;
                    }
                }
                buffer.push_back(line);
            }
            if (cellRow < BOARD_SIZE - 1) {
                int sepLines = ((cellRow + 1) % 3 == 0) ? betweenBlockVerSep : withinBlockVerSep;
                for (int i = 0; i < sepLines; i++) {
                    buffer.push_back(std::string(totalWidth, verticalSepFill));
                }
            }
        }

        const std::string borderLine(totalWidth + 2, '#'); // top/bottom border
        std::cout << borderLine << "\n";
        for (const auto &line : buffer) {
            std::cout << "#" << line << "#\n";
        }
        std::cout << borderLine << "\n";
    }

    void Board::process_rule_candidates() {
        bool any_changed = true;
        while (any_changed) {
            any_changed = false;
            for (const auto& rule : rules_) {
                any_changed |= rule->candidates_changed(*this);
            }
        }
    }

    // Internal solver:
    // First, repeatedly apply forced moves (cells with a single candidate) without making a full backup for each move.
    // Then, if the board is not solved, pick a cell with the fewest candidates and try each candidate in a branch.
    bool Board::solve_internal(int &nodeCount) {
        ++nodeCount;
        if (nodeCount % 1000 == 0) {
            std::cout << "Solve count: " << nodeCount << std::endl;
        }

        // Apply forced (trivial) moves.
        while (true) {
            bool forcedMoveFound = false;
            // Backup the grid before processing forced moves in this iteration.
            auto backup = grid_;
            for (int i = 0; i < BOARD_SIZE; ++i) {
                for (int j = 0; j < BOARD_SIZE; ++j) {
                    if (grid_[i][j].value == EMPTY && grid_[i][j].candidates.count() == 1) {
                        // There is a forced move: pick the sole candidate.
                        for (Candidate c : grid_[i][j].candidates) {
                            if (!set_cell({i, j}, c)) {
                                // Forced move failed. Restore state and backtrack.
                                grid_ = backup;
                                return false;
                            }
                            forcedMoveFound = true;
                            break;
                        }
                    }
                }
            }
            if (!forcedMoveFound)
                break; // No more forced moves.
        }

        // Check if the board is solved.
        bool solved = true;
        for (int i = 0; i < BOARD_SIZE && solved; ++i) {
            for (int j = 0; j < BOARD_SIZE && solved; ++j) {
                if (grid_[i][j].value == EMPTY) {
                    solved = false;
                }
            }
        }
        if (solved) {
            return true;
        }

        // Choose the cell with the fewest candidates to branch.
        Position best_pos = { -1, -1 };
        int min_candidates = 10;
        for (int i = 0; i < BOARD_SIZE; ++i) {
            for (int j = 0; j < BOARD_SIZE; ++j) {
                if (grid_[i][j].value == EMPTY) {
                    int count = grid_[i][j].candidates.count();
                    if (count < min_candidates) {
                        min_candidates = count;
                        best_pos = { i, j };
                    }
                }
            }
        }
        if (best_pos.row == -1) {
            return false; // Should not occur.
        }

        // Try each candidate for the chosen cell.
        for (Candidate c : grid_[best_pos.row][best_pos.col].candidates) {
            auto branch_backup = grid_; // Backup current state for this branch.
            if (set_cell(best_pos, c)) {
                if (solve_internal(nodeCount))
                    return true;
            }
            grid_ = branch_backup; // Restore state before trying the next candidate.
        }

        return false;
    }

    SolverStats Board::solve() {
        int nodeCount = 0;
        auto start = std::chrono::high_resolution_clock::now();
        bool solved = solve_internal(nodeCount);
        auto end = std::chrono::high_resolution_clock::now();
        long long elapsedMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

        SolverStats stats{ solved, nodeCount, elapsedMs };

        // Nicely aligned overview.
        std::cout << "\n------------------------------\n";
        std::cout << std::setw(20) << "Solution Found:" << (stats.solutionFound ? "Yes" : "No") << "\n";
        std::cout << std::setw(20) << "Nodes Explored:" << stats.nodesExplored << "\n";
        std::cout << std::setw(20) << "Time (ms):" << stats.timeTakenMs << "\n";
        std::cout << "------------------------------\n";

        return stats;
    }

} // namespace sudoku