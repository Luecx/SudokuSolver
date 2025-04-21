#ifndef BOARD_H
#define BOARD_H

#include <array>
#include <vector>
#include <memory>
#include "cell.h"
#include "position.h"
#include "rules/include.h"

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
        Board();

        const Cell& get_cell(const Position& pos) const;
        Cell&       get_cell(const Position& pos);
        const std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE>& get_grid() const;
        const std::array<Cell*, BOARD_SIZE>& get_row(Row row) const;
        const std::array<Cell*, BOARD_SIZE>& get_col(Col col) const;
        const std::array<Cell*, BOARD_SIZE>& get_block(Row row, Col col) const;

        template<typename T, typename ...ARGS>
        void add_rule(ARGS... args) {
            rules_.push_back(std::make_shared<T>(args...));
            this->process_rule_candidates();
        }

        bool is_valid_move(const Position& pos, Number number) const;
        bool impossible() const;
        bool set_cell(const Position& pos, Number number);

        void display(bool details = false) const;
        void process_rule_candidates();
        void process_rule_number_changed(const Cell& cell);

        /**
         * @brief Solves the Sudoku board, up to a maximum number of solutions.
         *
         * Uses forced moves plus backtracking, returning each complete solution
         * as a full Board object. Stops once `maxSolutions` are found.
         *
         * @param maxSolutions Maximum number of distinct solutions to collect (default 1).
         * @return A vector of solved Board instances (size ≤ maxSolutions).
         */
        std::vector<Board> solve(int maxSolutions = 1);

    private:
        /**
         * @brief Internal recursive solver.
         *
         * Applies forced moves and backtracking. Whenever a full solution is found,
         * pushes a copy of *this* into `solutions`. Continues until `solutions.size()`
         * reaches `maxSolutions`.
         *
         * @param nodeCount    Reference to the node counter for stats.
         * @param maxSolutions The target number of solutions.
         * @param solutions    Vector collecting completed Board states.
         * @return True if should continue searching (i.e. haven’t hit maxSolutions), false otherwise.
         */
        bool solve_internal(int &nodeCount,
                            int maxSolutions,
                            std::vector<Board> &solutions);

        bool is_solved() const;
        Position get_next_cell() const;
        bool solve_trivial();
        void stack_push();
        bool stack_pop();

        std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE> grid_;
        std::vector<std::shared_ptr<Rule>> rules_;
        std::vector<std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE>> history_;
        std::array<std::array<Cell*, BOARD_SIZE>, BOARD_SIZE> rows_;
        std::array<std::array<Cell*, BOARD_SIZE>, BOARD_SIZE> cols_;
        std::array<std::array<Cell*, BOARD_SIZE>, BOARD_SIZE> blocks_;
    };

} // namespace sudoku

#endif // BOARD_H
