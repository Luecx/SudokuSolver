// board.cpp

#include "board.h"
#include "solver_stats.h"    // for SolverStats
#include <iostream>
#include <chrono>
#include <iomanip>

namespace sudoku {

    Board::Board() {
        // initialize grid cells
        for (int i = 0; i < BOARD_SIZE; ++i)
            for (int j = 0; j < BOARD_SIZE; ++j)
                grid_[i][j] = Cell(i, j);

        // rows
        for (int i = 0; i < BOARD_SIZE; ++i)
            for (int j = 0; j < BOARD_SIZE; ++j)
                rows_[i][j] = &grid_[i][j];

        // columns
        for (int j = 0; j < BOARD_SIZE; ++j)
            for (int i = 0; i < BOARD_SIZE; ++i)
                cols_[j][i] = &grid_[i][j];

        // 3×3 blocks
        std::array<int, BOARD_SIZE> blockCounter = {0};
        for (int i = 0; i < BOARD_SIZE; ++i) {
            for (int j = 0; j < BOARD_SIZE; ++j) {
                int bi = (i / 3) * 3 + (j / 3);
                blocks_[bi][blockCounter[bi]++] = &grid_[i][j];
            }
        }
    }

    const Cell& Board::get_cell(const Position& pos) const {
        return grid_[pos.row][pos.col];
    }

    Cell& Board::get_cell(const Position& pos) {
        return grid_[pos.row][pos.col];
    }

    const std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE>&
    Board::get_grid() const {
        return grid_;
    }

    const std::array<Cell*, BOARD_SIZE>& Board::get_row(Row row) const {
        return rows_[row];
    }

    const std::array<Cell*, BOARD_SIZE>& Board::get_col(Col col) const {
        return cols_[col];
    }

    const std::array<Cell*, BOARD_SIZE>&
    Board::get_block(Row row, Col col) const {
        int bi = (row / 3) * 3 + (col / 3);
        return blocks_[bi];
    }

    bool Board::is_valid_move(const Position& pos, Number number) const {
        return grid_[pos.row][pos.col].candidates.test(number);
    }

    bool Board::impossible() const {
        for (int i = 0; i < BOARD_SIZE; ++i)
            for (int j = 0; j < BOARD_SIZE; ++j)
                if (grid_[i][j].value == EMPTY
                    && grid_[i][j].candidates == CAND_NONE)
                    return true;

        for (auto &r : rules_)
            if (!r->check_plausibility(*this))
                return true;

        return false;
    }

    void Board::stack_push() {
        history_.push_back(grid_);
    }

    bool Board::stack_pop() {
        if (history_.empty()) return false;
        grid_ = history_.back();
        history_.pop_back();
        return true;
    }

    bool Board::set_cell(const Position& pos, Number number) {
        if (!is_valid_move(pos, number))
            return false;

        stack_push();
        Cell& c = grid_[pos.row][pos.col];
        c.value = number;
        c.candidates = CAND_NONE;

        process_rule_number_changed(c);
        process_rule_candidates();

        if (impossible()) {
            stack_pop();
            return false;
        }
        return true;
    }

    void Board::display(bool details) const {
        if (!details) {
            // Simple display with solved numbers in green.
            for (int i = 0; i < BOARD_SIZE; ++i) {
                for (int j = 0; j < BOARD_SIZE; ++j) {
                    int val = grid_[i][j].value;
                    if (val == EMPTY)
                        std::cout << ". ";
                    else
                        // "\033[32m" sets the color to green, "\033[0m" resets it.
                        std::cout << "\033[32m" << val << "\033[0m" << " ";
                }
                std::cout << std::endl;
            }
            return;
        }

        // Detailed display setup.
        constexpr int CELL_WIDTH  = 7;
        constexpr int CELL_HEIGHT = 3;
        const std::string withinBlockHorSep  = "   ";
        const std::string betweenBlockHorSep = "      ";
        constexpr int withinBlockVerSep = 1;
        constexpr int betweenBlockVerSep = 2;
        const char verticalSepFill = ' ';

        const int totalWidth = BOARD_SIZE * CELL_WIDTH
                               + 2 * betweenBlockHorSep.size()
                               + 6 * withinBlockHorSep.size();

        std::vector<std::string> buffer;

        // Lambda to create a display buffer for a cell.
        auto getCellBuffer = [](const Cell &cell) -> std::vector<std::string> {
            std::vector<std::string> cellBuf(CELL_HEIGHT, std::string(CELL_WIDTH, ' '));
            if (cell.value != EMPTY) {
                // Create a colored digit string.
                std::string coloredDigit = "\033[32m" + std::to_string(cell.value) + "\033[0m";
                // Replace the middle of the cell with the colored digit.
                // Note: The escape codes won't take up visible space, so we assume center alignment.
                cellBuf[1].replace(3, 1, coloredDigit);
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

        const std::string borderLine(totalWidth + 2, '#');
        std::cout << borderLine << "\n";
        for (const auto &line : buffer) {
            std::cout << "#" << line << "#\n";
        }
        std::cout << borderLine << "\n";
    }

    void Board::process_rule_candidates() {
        bool changed = true;
        while (changed) {
            changed = false;
            for (auto &r : rules_)
                changed |= r->candidates_changed(*this);
        }
    }

    void Board::process_rule_number_changed(const Cell& cell) {
        for (auto &r : rules_)
            r->number_changed(*this, cell);
    }

    bool Board::is_solved() const {
        for (int i = 0; i < BOARD_SIZE; ++i)
            for (int j = 0; j < BOARD_SIZE; ++j)
                if (grid_[i][j].value == EMPTY)
                    return false;
        return true;
    }

    Position Board::get_next_cell() const {
        Position best{-1,-1};
        int minC = BOARD_SIZE+1;
        for (int i = 0; i < BOARD_SIZE; ++i) {
            for (int j = 0; j < BOARD_SIZE; ++j) {
                const auto& cell = grid_[i][j];
                if (cell.value == EMPTY) {
                    int cnt = cell.candidates.count();
                    if (cnt < minC) {
                        minC = cnt;
                        best = {i,j};
                    }
                    if (cnt <= 2) return {i,j};
                }
            }
        }
        return best;
    }

    bool Board::solve_trivial() {
        bool applied = true;
        while (applied) {
            applied = false;
            for (int i = 0; i < BOARD_SIZE; ++i) {
                for (int j = 0; j < BOARD_SIZE; ++j) {
                    auto &cell = grid_[i][j];
                    if (cell.value == EMPTY && cell.candidates.count() == 1) {
                        for (Candidate c : cell.candidates) {
                            if (!set_cell({i,j}, c))
                                return false;
                            applied = true;
                            break;
                        }
                    }
                }
            }
        }
        return true;
    }

    bool Board::solve_internal(int &nodeCount,
                               int maxSolutions,
                               std::vector<Board> &solutions)
    {
        ++nodeCount;

        if (!solve_trivial())
            return true;  // contradiction → backtrack but keep looking

        if (is_solved()) {
            solutions.push_back(*this);
            // stop descending if we've hit our quota
            return (solutions.size() < static_cast<size_t>(maxSolutions));
        }

        Position next = get_next_cell();
        int branchLevel = history_.size();

        for (Candidate c : grid_[next.row][next.col].candidates) {
            if (set_cell(next, c)) {
                if (!solve_internal(nodeCount, maxSolutions, solutions))
                    return false;  // quota reached → unwind all
            }
            while (history_.size() > branchLevel)
                stack_pop();
        }
        return true;
    }

    std::vector<Board> Board::solve(int maxSolutions) {
        std::vector<Board> solutions;
        int nodeCount = 0;

        auto start = std::chrono::high_resolution_clock::now();
        solve_internal(nodeCount, maxSolutions, solutions);
        auto end = std::chrono::high_resolution_clock::now();

        double elapsedMs =
                std::chrono::duration_cast<std::chrono::microseconds>(end - start).count()
                / 1000.0;

        // print your stats
        std::cout
                << "\n------------------------------\n"
                << std::setw(20) << "Solutions Found:" << solutions.size() << "\n"
                << std::setw(20) << "Nodes Explored:"  << nodeCount           << "\n"
                << std::setw(20) << "Time (ms):"       << elapsedMs           << "\n"
                << "------------------------------\n";

        return solutions;
    }

} // namespace sudoku
