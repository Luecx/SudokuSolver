#include "board.h"
#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>
#include "solver_stats.h"

namespace sudoku {

/// Constructor: initializes the grid and sets up pointer arrays for rows, columns, and blocks.
Board::Board() {
    // Initialize the 9x9 grid.
    for (int i = 0; i < BOARD_SIZE; ++i) {
        for (int j = 0; j < BOARD_SIZE; ++j) {
            grid_[i][j] = Cell(i, j);
        }
    }

    // Initialize rows_: each row pointer array points to the corresponding cells in grid_.
    for (int i = 0; i < BOARD_SIZE; ++i) {
        for (int j = 0; j < BOARD_SIZE; ++j) {
            rows_[i][j] = &grid_[i][j];
        }
    }

    // Initialize cols_: for each column, store pointers to cells in that column.
    for (int j = 0; j < BOARD_SIZE; ++j) {
        for (int i = 0; i < BOARD_SIZE; ++i) {
            cols_[j][i] = &grid_[i][j];  // Note: using [j] for the column's pointer array.
        }
    }

    // Initialize blocks_: there are 9 blocks (each 3x3).
    // For each cell, compute its block index as (row/3)*3 + (col/3)
    // and assign the pointer in the appropriate position.
    std::array<int, BOARD_SIZE> blockCounter = {0}; // One counter per block.
    for (int i = 0; i < BOARD_SIZE; i++) {
        for (int j = 0; j < BOARD_SIZE; j++) {
            int blockIndex = (i / 3) * 3 + (j / 3);
            blocks_[blockIndex][blockCounter[blockIndex]++] = &grid_[i][j];
        }
    }
}

// Existing member function implementations (get_cell, etc.)...

const Cell& Board::get_cell(const Position& pos) const {
    return grid_[pos.row][pos.col];
}

Cell& Board::get_cell(const Position& pos) {
    return grid_[pos.row][pos.col];
}

/**
 * @brief Returns the entire grid.
 *
 * @return Constant reference to the 9x9 grid array of cells.
 */
const std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE>& Board::get_grid() const {
    return grid_;
}

/**
 * @brief Returns the cells in the specified row.
 *
 * This function returns an array of pointers corresponding to the cells in the given row.
 *
 * @param row The row index (0-based).
 * @return Constant reference to an array of pointers to cells in that row.
 */
const std::array<Cell*, BOARD_SIZE>& Board::get_row(Row row) const {
    return rows_[row];
}

/**
 * @brief Returns the cells in the specified column.
 *
 * This function returns an array of pointers corresponding to the cells in the given column.
 *
 * @param col The column index (0-based).
 * @return Constant reference to an array of pointers to cells in that column.
 */
const std::array<Cell*, BOARD_SIZE>& Board::get_col(Col col) const {
    return cols_[col];
}

/**
 * @brief Returns the cells in the block containing the given cell.
 *
 * Given a cell position (row, col), this function computes the block index (based on a 3x3 grid)
 * and returns an array of pointers corresponding to all cells in that block.
 *
 * @param row The row index of the cell.
 * @param col The column index of the cell.
 * @return Constant reference to an array of pointers to cells in the corresponding block.
 */
const std::array<Cell*, BOARD_SIZE>& Board::get_block(Row row, Col col) const {
    int blockIndex = (row / 3) * 3 + (col / 3);
    return blocks_[blockIndex];
}


/**
 * @brief Checks if a move is valid based on the cell's candidate list.
 * @param pos The position where the number is to be placed.
 * @param number The number to be placed.
 * @return True if the move is allowed, false otherwise.
 */
bool Board::is_valid_move(const Position& pos, Number number) const {
    return grid_[pos.row][pos.col].candidates.test(number);
}

/**
 * @brief Determines if the board is in an impossible state.
 *
 * A board is impossible if an unsolved cell has no candidates or if any rule
 * detects a contradiction.
 *
 * @param pos A position (unused in this check).
 * @return True if the board is impossible, false otherwise.
 */
bool Board::impossible() const {
    for (int i = 0; i < BOARD_SIZE; ++i) {
        for (int j = 0; j < BOARD_SIZE; ++j) {
            if (grid_[i][j].value == EMPTY && grid_[i][j].candidates == CAND_NONE)
                return true;
        }
    }
    for (const auto& rule : rules_) {
        if (!rule->check_plausibility(*this))
            return true;
    }
    return false;
}

/**
 * @brief Saves the current board state to the history stack.
 */
void Board::stack_push() {
    history_.push_back(grid_);
}

/**
 * @brief Restores the board state from the history stack.
 *
 * @return True if a previous state was restored, false otherwise.
 */
bool Board::stack_pop() {
    if (history_.empty())
        return false;
    grid_ = history_.back();
    history_.pop_back();
    return true;
}

/**
 * @brief Attempts to set a cell's value.
 *
 * Validates the move, saves the current state, updates the cell, notifies rules,
 * processes candidate updates, and undoes the move if a contradiction occurs.
 *
 * @param pos The cell position.
 * @param number The number to be placed.
 * @return True if the move is successful, false otherwise.
 */
bool Board::set_cell(const Position& pos, Number number) {
    if (!is_valid_move(pos, number))
        return false;

    // Save current board state for backtracking.
    stack_push();

    // Update the cell.
    grid_[pos.row][pos.col].value = number;
    grid_[pos.row][pos.col].candidates = CAND_NONE;

    // Notify rules that the cell's number has changed.
    process_rule_number_changed(grid_[pos.row][pos.col]);

    // Update candidate lists based on all rules.
    process_rule_candidates();

    // If the board becomes impossible, undo the move.
    if (impossible()) {
        stack_pop();
        return false;
    }
    return true;
}

/**
 * @brief Displays the board.
 *
 * If details is false, prints a simple view (solved cells only). If true, prints a
 * detailed grid showing candidate numbers in unsolved cells.
 *
 * @param details Flag for detailed display.
 */
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

/**
 * @brief Processes candidate updates by iterating through all rules.
 */
void Board::process_rule_candidates() {
    bool any_changed = true;
    while (any_changed) {
        any_changed = false;
        for (const auto& rule : rules_) {
            any_changed |= rule->candidates_changed(*this);
        }
    }
}

/**
 * @brief Notifies all rules that a cell's number has changed.
 * @param cell The cell that changed.
 */
void Board::process_rule_number_changed(const Cell& cell) {
    for (const auto& rule : rules_) {
        rule->number_changed(*this, cell);
    }
}

/**
 * @brief Checks if the board is completely solved.
 * @return True if all cells have a value, false otherwise.
 */
bool Board::is_solved() const {
    for (int i = 0; i < BOARD_SIZE; ++i)
        for (int j = 0; j < BOARD_SIZE; ++j)
            if (grid_[i][j].value == EMPTY)
                return false;
    return true;
}

/**
 * @brief Finds the unsolved cell with the fewest candidates.
 * @return The position of the cell to fill next.
 */
Position Board::get_next_cell() const {
    Position best{-1, -1};
    int min_candidates = BOARD_SIZE + 1;
    for (int i = 0; i < BOARD_SIZE; ++i) {
        for (int j = 0; j < BOARD_SIZE; ++j) {
            if (grid_[i][j].value == EMPTY) {
                int count = grid_[i][j].candidates.count();
                if (count < min_candidates) {
                    min_candidates = count;
                    best = {i, j};
                }
                if (count <= 2)
                    return {i, j};
            }
        }
    }
    return best;
}

/**
 * @brief Applies forced moves repeatedly (trivial solving).
 *
 * Cells with exactly one candidate are set until no further moves can be made.
 *
 * @return True if all forced moves are applied successfully, false otherwise.
 */
bool Board::solve_trivial() {
    bool moveApplied = true;
    while (moveApplied) {
        moveApplied = false;
        for (int i = 0; i < BOARD_SIZE; ++i) {
            for (int j = 0; j < BOARD_SIZE; ++j) {
                if (grid_[i][j].value == EMPTY && grid_[i][j].candidates.count() == 1) {
                    for (Candidate c : grid_[i][j].candidates) {
                        if (!set_cell({i, j}, c))
                            return false;
                        moveApplied = true;
                        break;
                    }
                }
            }
        }
    }
    return true;
}

/**
 * @brief Internal recursive solver.
 *
 * Increments the node counter, applies forced moves, checks if solved, and
 * recursively branches on the unsolved cell with the fewest candidates.
 *
 * @param nodeCount Reference to the node counter.
 * @return True if the board is solved, false otherwise.
 */
bool Board::solve_internal(int &nodeCount) {
    ++nodeCount;
    if (nodeCount % 1000 == 0) {
        std::cout << "Solve count: " << nodeCount << std::endl;
    }

    if (!solve_trivial())
        return false;

    if (is_solved())
        return true;

    Position next = get_next_cell();
    if (next.row == -1)
        return false; // Should not occur.

    int branchLevel = history_.size();

    for (Candidate c : grid_[next.row][next.col].candidates) {
        if (set_cell(next, c)) {
            if (solve_internal(nodeCount))
                return true;
        }
        while (history_.size() > branchLevel) {
            stack_pop();
        }
    }
    return false;
}

/**
 * @brief Public solver function.
 *
 * Tracks performance (node count and elapsed time) and displays solving statistics.
 *
 * @return SolverStats with solution status, nodes explored, and time taken.
 */
SolverStats Board::solve() {
    int nodeCount = 0;
    auto start = std::chrono::high_resolution_clock::now();
    bool solved = solve_internal(nodeCount);
    auto end = std::chrono::high_resolution_clock::now();
    long long elapsedMMs = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();

    SolverStats stats{ solved, nodeCount, elapsedMMs / 1000.0f };

    std::cout << "\n------------------------------\n";
    std::cout << std::setw(20) << "Solution Found:" << (stats.solutionFound ? "Yes" : "No") << "\n";
    std::cout << std::setw(20) << "Nodes Explored:" << stats.nodesExplored << "\n";
    std::cout << std::setw(20) << "Time (ms):" << stats.timeTakenMs << "\n";
    std::cout << "------------------------------\n";

    return stats;
}

} // namespace sudoku
