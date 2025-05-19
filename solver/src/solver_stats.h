/**
 * @file solver_stats.h
 * @brief Struct for reporting statistics after solving a Sudoku puzzle.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It defines a structure to track solver performance and status, including counts of
 * solutions found, node exploration metrics, and interruption flags.
 *
 * @date 2025-05-16
 * @author Finn Eggers
 */

#pragma once

#include <iomanip>
#include <iostream>


/**
 * @struct SolverStats
 * @brief Stores statistics collected during a Sudoku solving run.
 */
struct SolverStats {
    int solutions_found = 0; ///< Number of valid solutions found.
    int nodes_explored = 0; ///< Number of nodes (decisions) explored.
    float time_taken_ms = 0.0f; ///< Elapsed time in milliseconds.

    bool interrupted_by_node_limit = false; ///< Whether solving was interrupted due to a node limit.
    bool interrupted_by_solution_limit = false; ///< Whether solving was interrupted due to a solution limit.

    /**
     * @brief Returns true if at least one solution has been found.
     */
    bool solution_found() const { return solutions_found > 0; }
};

/**
 * @brief Pretty-prints the solver statistics to a stream.
 *
 * @param os Output stream to write to.
 * @param stats The SolverStats instance to print.
 * @return Reference to the output stream.
 */
inline std::ostream &operator<<(std::ostream &os, const SolverStats &stats) {
    os << "+----------------------------------------+\n";
    os << "| " << std::setw(38) << std::left << "SOLVER STATISTICS" << " |\n";
    os << "+----------------------------------------+\n";

    os << "| " << std::setw(26) << std::left << "Solutions Found:";
    os << std::setw(12) << std::right << stats.solutions_found << " |\n";

    os << "| " << std::setw(26) << std::left << "Nodes Explored:";
    os << std::setw(12) << std::right << stats.nodes_explored << " |\n";

    os << "| " << std::setw(26) << std::left << "Time (ms):";
    std::stringstream time_ss;
    time_ss << std::fixed << std::setprecision(3) << stats.time_taken_ms;
    os << std::setw(12) << std::right << time_ss.str() << " |\n";

    os << "| " << std::setw(26) << std::left << "Node Limit Reached:";
    std::string node_limit_str = stats.interrupted_by_node_limit ? "Yes" : "No";
    os << std::setw(12) << std::right << node_limit_str << " |\n";

    os << "| " << std::setw(26) << std::left << "Solution Limit Reached:";
    std::string soln_limit_str = stats.interrupted_by_solution_limit ? "Yes" : "No";
    os << std::setw(12) << std::right << soln_limit_str << " |\n";

    os << "+----------------------------------------+\n";
    return os;
}
