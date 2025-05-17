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

#include <iostream>
#include <iomanip>

/**
* @struct SolverStats
* @brief Stores statistics collected during a Sudoku solving run.
*/
struct SolverStats {
   int solutions_found = 0;               ///< Number of valid solutions found.
   int nodes_explored = 0;                ///< Number of nodes (decisions) explored.
   float time_taken_ms = 0.0f;            ///< Elapsed time in milliseconds.

   bool interrupted_by_node_limit = false;     ///< Whether solving was interrupted due to a node limit.
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
inline std::ostream& operator<<(std::ostream& os, const SolverStats& stats) {
   os << "\n------------------------------\n";
   os << std::setw(28) << "Solutions Found:"            << stats.solutions_found << "\n";
   os << std::setw(28) << "Nodes Explored:"             << stats.nodes_explored << "\n";
   os << std::setw(28) << "Time (ms):"                  << std::fixed << std::setprecision(3) << stats.time_taken_ms << "\n";
   os << std::setw(28) << "Interrupted (Node Limit):"   << (stats.interrupted_by_node_limit ? "Yes" : "No") << "\n";
   os << std::setw(28) << "Interrupted (Solution Limit):" << (stats.interrupted_by_solution_limit ? "Yes" : "No") << "\n";
   os << "------------------------------\n";
   return os;
}
