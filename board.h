#ifndef BOARD_H
#define BOARD_H

#include <array>
#include <vector>
#include <memory>
#include "cell.h"
#include "position.h"
#include "rules.h"
#include "solver_stats.h"

namespace sudoku {

/**
 * @brief Represents a Sudoku board.
 *
 * This class maintains a 2D grid of cells, applies Sudoku rules, and implements a
 * backtracking solver that supports forced moves. It also manages board state
 * history with a stack to easily push/pop moves during solving.
 */
class Board {
public:
    /**
     * @brief Constructor.
     *
     * Initializes the board by constructing a 9x9 grid of cells. Each cell is
     * initialized with its row and column indices.
     */
    Board();

    /**
     * @brief Gets a constant reference to a cell.
     * @param pos The position of the cell.
     * @return Constant reference to the cell at the specified position.
     */
    const Cell& get_cell(const Position& pos) const;

    /**
     * @brief Gets the entire grid.
     * @return Constant reference to the grid array.
     */
    const std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE>& get_grid() const;

    /**
     * @brief Gets the cells in a specific row.
     *
     * @param row The row index (0-based).
     * @return Constant reference to an array of pointers to the cells in that row.
     */
    const std::array<Cell*, BOARD_SIZE>& get_row(Row row) const;

    /**
     * @brief Gets the cells in a specific column.
     *
     * @param col The column index (0-based).
     * @return Constant reference to an array of pointers to the cells in that column.
     */
    const std::array<Cell*, BOARD_SIZE>& get_col(Col col) const;

    /**
     * @brief Gets the cells in the block containing the given cell.
     *
     * Blocks are defined as 3×3 subgrids in a 9x9 board. Given a cell's row and column,
     * this function returns the block (as an array of pointers) to which the cell belongs.
     *
     * @param row The row index of the cell.
     * @param col The column index of the cell.
     * @return Constant reference to an array of pointers to the cells in the corresponding block.
     */
    const std::array<Cell*, BOARD_SIZE>& get_block(Row row, Col col) const;

    /**
     * @brief Gets a modifiable reference to a cell.
     * @param pos The position of the cell.
     * @return Reference to the cell at the specified position.
     */
    Cell& get_cell(const Position& pos);

    /**
     * @brief Adds a new rule for candidate propagation and number placement.
     *
     * This template function allows constructing and adding rules with arbitrary parameters.
     *
     * @tparam T The type of rule.
     * @param args Arguments forwarded to the rule's constructor.
     */
    template<typename T, typename ...ARGS>
    void add_rule(ARGS... args) {
        rules_.push_back(std::make_shared<T>(args...));
    }

    /**
     * @brief Checks if placing a specific number at a given position is allowed.
     * @param pos The cell position.
     * @param number The number to be placed.
     * @return True if the move is valid, false otherwise.
     */
    bool is_valid_move(const Position& pos, Number number) const;

    /**
     * @brief Checks if the board is in an impossible state.
     *
     * The board is considered impossible if:
     * - An unsolved cell has no candidates.
     * - Any rule reports a contradiction.
     *
     * @return True if the board is impossible, false otherwise.
     */
    bool impossible() const;

    /**
     * @brief Attempts to set the cell at the given position to the specified number.
     *
     * The process involves:
     *  - Validating the move.
     *  - Saving the current board state (using stack_push()).
     *  - Updating the cell's value and clearing its candidate list.
     *  - Notifying rules via process_rule_number_changed().
     *  - Processing candidate updates.
     *  - Undoing the move if a contradiction is detected.
     *
     * @param pos The cell position.
     * @param number The number to place.
     * @return True if the move is successfully applied, false otherwise.
     */
    bool set_cell(const Position& pos, Number number);

    /**
     * @brief Displays the board.
     *
     * When details is false (default), prints a simple display showing only solved numbers.
     * When details is true, prints a detailed grid including candidate numbers for unsolved cells.
     *
     * @param details Flag to indicate detailed display.
     */
    void display(bool details = false) const;

    /**
     * @brief Processes candidate updates from all rules.
     *
     * Iteratively updates candidate lists until no further changes occur.
     */
    void process_rule_candidates();

    /**
     * @brief Notifies all rules that a cell's number has changed.
     *
     * This function is used to allow rules to update candidate lists or perform
     * additional logic after a cell's value is set.
     *
     * @param cell The cell that has changed.
     */
    void process_rule_number_changed(const Cell& cell);

    /**
     * @brief Solves the Sudoku board.
     *
     * Combines forced moves (cells with a single candidate) with backtracking
     * branching. Returns a SolverStats object with details about the solving process.
     *
     * @return SolverStats containing the solution status, nodes explored, and time taken.
     */
    SolverStats solve();

private:
    /**
     * @brief Internal recursive solver.
     *
     * Implements backtracking logic by applying forced moves, checking for a solved board,
     * and branching on the unsolved cell with the fewest candidates. The nodeCount is
     * incremented for performance statistics.
     *
     * @param nodeCount Reference to the node counter.
     * @return True if the board is solved, false otherwise.
     */
    bool solve_internal(int &nodeCount);

    /**
     * @brief Checks if the board is completely solved.
     *
     * @return True if every cell has a non-empty value, false otherwise.
     */
    bool is_solved() const;

    /**
     * @brief Finds the unsolved cell with the fewest candidates.
     *
     * This heuristic reduces branching and improves solver efficiency.
     *
     * @return The position of the next cell to fill.
     */
    Position get_next_cell() const;

    /**
     * @brief Applies forced moves repeatedly.
     *
     * Also known as trivial solving. Attempts to set cells that have exactly one candidate.
     *
     * @return True if all forced moves are applied successfully, false otherwise.
     */
    bool solve_trivial();

    /**
     * @brief Pushes the current board state onto the history stack.
     */
    void stack_push();

    /**
     * @brief Pops the most recent board state from the history stack.
     *
     * @return True if a state was successfully restored, false if the history is empty.
     */
    bool stack_pop();

    /**
     * @brief The 9x9 grid representing the Sudoku board.
     */
    std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE> grid_;

    /**
     * @brief Collection of Sudoku rules.
     */
    std::vector<std::shared_ptr<Rule>> rules_;

    /**
     * @brief Stack of previous board states for backtracking.
     */
    std::vector<std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE>> history_;

    /*
     * @brief Fields to extract rows, columns, and blocks for rule processing.
     */
    std::array<std::array<Cell*, BOARD_SIZE>, BOARD_SIZE> rows_;
    std::array<std::array<Cell*, BOARD_SIZE>, BOARD_SIZE> cols_;
    std::array<std::array<Cell*, BOARD_SIZE>, BOARD_SIZE> blocks_;
};

} // namespace sudoku

#endif // BOARD_H
