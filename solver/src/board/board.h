/**
 * @file board.h
 * @brief Main solver board holding Sudoku cells and rule handlers.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It defines the core board structure and state management logic, including:
 * - Cell access by row, column, and block
 * - Rule handler registration and execution
 * - History stack for backtracking
 * - An internal impact map to support heuristic-based solving
 *
 * @date 2025-05-16
 * @author Finn Eggers
 */

#pragma once

#include <cassert>
#include <cmath>
#include <memory>
#include <stack>
#include <unordered_map>
#include <vector>
#include <functional>


#include "../cell.h"
#include "../impact_map.h"
#include "../number_set.h"
#include "../rules/_rule_handler.h"
#include "../solver_stats.h"
#include "../solution.h"


namespace sudoku {

/**
 * @class Board
 * @brief Represents the current state of a Sudoku puzzle and its solving logic.
 *
 * The board owns the cell grid, rule handlers, and metadata like block structure
 * and heuristic tracking (via an internal ImpactMap).
 */
class Board {
public:
    /**
     * @brief Construct a new Board of given size.
     * @param size The board dimension (e.g. 9 for 9x9). Must be ≥ 1.
     */
    explicit Board(int size);

    /**
     * loads from json
     * @param json
     */
    void from_json(JSON &json);

    /**
     * @brief Access a specific cell by index.
     */
    Cell &get_cell(const CellIdx &idx);

    /**
     * @brief Access an entire row by index.
     */
    std::vector<Cell *> &get_row(Row r);

    /**
     * @brief Access an entire column by index.
     */
    std::vector<Cell *> &get_col(Col c);

    /**
     * @brief Access the block that contains cell (r, c).
     *
     * Only valid if the board size is a square number (e.g., 9).
     */
    std::vector<Cell *> &get_block(Row r, Col c);

    /**
     * @brief Add a rule handler to the board.
     */
    void add_handler(std::shared_ptr<RuleHandler> handler);

    /**
     * @brief Check whether a given number is allowed at the given position.
     */
    bool is_valid_move(const CellIdx &idx, Number number) const;

    /**
     * @brief Returns false if any contradiction is detected (e.g., empty cell with no candidates).
     * Or any rule handler dislikes the board.
     */
    bool valid() const;

    /**
     * @brief Push the current board state onto the history stack.
     */
    void push_history();

    /**
     * @brief Pop the previous state from the history stack and restore it.
     * @return True if successful, false if stack was empty.
     */
    bool pop_history();

    /**
     * @brief Set a number at a given cell.
     *
     * If `force` is false (default), the move is only applied if it's valid
     * and the board remains consistent. If `force` is true, the value is applied
     * directly with no checks or history tracking.
     *
     * @param idx Cell index
     * @param number Value to assign (1–N)
     * @param force Whether to bypass validation and tracking
     * @return True if the assignment was accepted or forced, false if rejected
     */
    bool set_cell(const CellIdx &idx, Number number, bool force = false);

    /**
     * @brief Returns true if all cells are filled (value ≠ 0).
     */
    bool is_solved() const;

    /**
     * @brief Process candidate updates by invoking `candidates_changed()` on all rules until no change occurs.
     */
    void process_rule_candidates();

    /**
     * @brief Notify all rule handlers that a number has changed at a specific cell.
     */
    void process_rule_number_changed(const CellIdx &idx);

    /**
     * @brief Recompute the internal impact map based on the current rule handlers.
     *
     * Each handler may increment the impact values for affected cells.
     */
    void update_impact_map();

    /**
     * @brief Get the current impact value at a given cell.
     */
    int get_impact(const CellIdx &idx) const;

    /**
     * @brief Read-only access to the full impact map.
     */
    const ImpactMap &impact_map() const;

    /**
     * @brief Get the board size (e.g. 9 for 9x9).
     */
    int size() const { return board_size_; }

    /**
     * @brief Returns the board in a string representation.
     */
    std::string to_string();

    /**
     * @brief Get the block dimension (e.g. 3 for 9x9).
     */
    int block_size() const { return block_size_; }

    std::vector<Solution> solve(int max_solutions = 1, int max_nodes = 1024, SolverStats *stats_out = nullptr);
    CellIdx get_next_cell() const;
    std::vector<Number> get_random_candidates(const CellIdx &idx) const;
    Solution copy_solution() const;
    Board clone() const;
    std::vector<Solution> solve_complete(
        SolverStats *stats_out = nullptr,
        int max_nodes = 1024,
        std::function<void(float)> onProgress = nullptr,
        std::function<void(Solution&)> onSolution = nullptr);

private:
    int board_size_; ///< Board size (typically 9)
    int block_size_; ///< Block dimension (e.g., 3 for 9x9)

    std::vector<std::vector<Cell>> grid_; ///< 2D grid of cells
    std::vector<std::vector<Cell *>> rows_; ///< Row accessors
    std::vector<std::vector<Cell *>> cols_; ///< Column accessors
    std::vector<std::vector<Cell *>> blocks_; ///< Block accessors

    std::vector<std::shared_ptr<RuleHandler>> handlers_; ///< All registered rule handlers

    //   using Snapshot = std::vector<std::vector<std::pair<Number, NumberSet>>>;
    //   std::stack<Snapshot> history_; ///< History stack for backtracking

    std::vector<Snapshot> snapshot_pool_;
    int history_top_ = -1;


    ImpactMap impact_map_; ///< Per-cell heuristic values computed by rule handlers

    void initialize_accessors();
    void initialize_blocks();
};

std::ostream &operator<<(std::ostream &os, Board &board);


} // namespace sudoku
