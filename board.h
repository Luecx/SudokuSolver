#ifndef BOARD_H
#define BOARD_H

#include <array>
#include <vector>
#include <memory>
#include "cell.h"
#include "position.h"
#include "rules.h"
#include "solver_stats.h"  // Assumes you have a SolverStats struct defined.

namespace sudoku {

    class Board {
    public:
        Board();

        // Get cell by Position.
        const Cell& get_cell(const Position& pos) const;
        Cell& get_cell(const Position& pos);

        // Add a rule.
        template<typename T, typename ...ARGS>
        void add_rule(ARGS... args) {
            rules_.push_back(std::make_shared<T>(args...));
        }

        // Check if placing a number (1–9) at pos is allowed per the cell’s candidate list.
        bool is_valid_move(const Position& pos, Number number) const;
        bool impossible(const Position& pos) const;

        // Set the cell at pos to number.
        // This updates the candidate lists (via peers and rules) and then verifies that the board remains valid.
        // (In the new approach, we do not always push the grid state to history.)
        bool set_cell(const Position& pos, Number number);

        // Undo the last move (kept for compatibility, not used by the new solver).
        bool undo_move();

        // Simple print: solved cells as numbers, unsolved as '.'.
        void print() const;

        // Display the board as a 3×3 block grid.
        void display() const;

        // Process candidates via all rules.
        void process_rule_candidates();

        // Solve the board using backtracking with trivial (forced) moves.
        SolverStats solve();

    private:
        // Internal solver that applies trivial moves (cells with one candidate)
        // before branching. The nodeCount parameter is passed by reference.
        bool solve_internal(int &nodeCount);

        // Board grid and rules.
        std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE> grid_;
        std::vector<std::shared_ptr<Rule>> rules_;

        // History vector (for undo, if needed)
        std::vector<std::array<std::array<Cell, BOARD_SIZE>, BOARD_SIZE>> history_;
    };

} // namespace sudoku

#endif // BOARD_H