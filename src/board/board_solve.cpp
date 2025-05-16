#include "board.h"
#include <random>
#include <chrono>
#include <functional>

namespace sudoku {

std::vector<Board> Board::solve_complete(SolverStats* stats_out) {
    std::vector<Board> all_solutions;
    Board solver = clone();
    Board tracker = clone();

    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            const CellIdx idx{r, c};

            if (solver.get_cell(idx).value != EMPTY)
                continue;

            NumberSet candidates_to_check = tracker.get_cell(idx).candidates;

            for (Number n : candidates_to_check) {
                if (!solver.set_cell(idx, n))
                    continue;

                SolverStats local_stats;
                std::vector<Board> result = solver.solve(1, 512, &local_stats);

                if (!result.empty()) {
                    // Keep unique solution
                    all_solutions.push_back(result.front());

                    // Remove seen values from tracker
                    for (Row rr = 0; rr < board_size_; ++rr) {
                        for (Col cc = 0; cc < board_size_; ++cc) {
                            Number solved_value = result.front().get_cell({rr, cc}).value;
                            tracker.get_cell({rr, cc}).candidates.remove(solved_value);
                        }
                    }
                } else if (!local_stats.interrupted_by_node_limit) {
                    // Eliminate candidate from both boards
                    solver.get_cell(idx).candidates.remove(n);
                    tracker.get_cell(idx).candidates.remove(n);
                }

                solver.pop_history(); // always backtrack
            }
        }
    }

    if (stats_out) {
        stats_out->solutions_found = static_cast<int>(all_solutions.size());
        // No good way to count nodes here; omit for now
    }

    return all_solutions;
}

std::vector<Board> Board::solve(int max_solutions, int max_nodes, SolverStats* stats_out) {
    std::vector<Board> solutions;
    int nodes_explored = 0;
    bool interrupted_by_node_limit = false;
    bool interrupted_by_solution_limit = false;

    const auto start_time = std::chrono::steady_clock::now();
    update_impact_map();

    std::function<bool()> backtrack = [&]() {
        if (++nodes_explored > max_nodes) {
            interrupted_by_node_limit = true;
            return false;
        }

        if (is_solved()) {
            solutions.push_back(clone());
            if (static_cast<int>(solutions.size()) >= max_solutions) {
                interrupted_by_solution_limit = true;
                return false;
            }
            return true;
        }

        const CellIdx pos = get_next_cell();
        const Cell& cell = get_cell(pos);

        for (Number n : cell.candidates) {
            if (set_cell(pos, n)) {
                bool keep_going = backtrack();
                pop_history();
                if (!keep_going)
                    return false;
            }
        }

        return true;
    };

    backtrack();

    const auto end_time = std::chrono::steady_clock::now();
    float elapsed_ms = std::chrono::duration<float, std::milli>(end_time - start_time).count();

    if (stats_out) {
        *stats_out = SolverStats{
                .solutions_found = static_cast<int>(solutions.size()),
                .nodes_explored = nodes_explored,
                .time_taken_ms = elapsed_ms,
                .interrupted_by_node_limit = interrupted_by_node_limit,
                .interrupted_by_solution_limit = interrupted_by_solution_limit
        };
    }

    return solutions;
}

CellIdx Board::get_next_cell() const {
    int min_candidates = board_size_ + 1;
    int max_impact = -1;
    std::vector<const Cell *> best_cells;

    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            const Cell &cell = grid_[r][c];
            if (cell.value != EMPTY)
                continue;

            int count = cell.candidates.count();
            if (count < min_candidates) {
                min_candidates = count;
                best_cells.clear();
                best_cells.push_back(&cell);
                max_impact = get_impact(cell.pos);
            } else if (count == min_candidates) {
                int impact = get_impact(cell.pos);
                if (impact > max_impact) {
                    best_cells.clear();
                    best_cells.push_back(&cell);
                    max_impact = impact;
                } else if (impact == max_impact) {
                    best_cells.push_back(&cell);
                }
            }
        }
    }

    if (best_cells.empty())
        throw std::runtime_error("No empty cell found");

    const Cell *chosen = best_cells[rand() % best_cells.size()];
    return chosen->pos;
}

Board Board::clone() const {
    Board copy(board_size_);

    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            copy.grid_[r][c].value = grid_[r][c].value;
            copy.grid_[r][c].candidates = grid_[r][c].candidates;
        }
    }

    copy.handlers_ = handlers_; // Note: shared_ptrs
    return copy;
}

};