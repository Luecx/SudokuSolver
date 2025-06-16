#include <chrono>
#include <functional>
#include <random>
#include <unordered_set>
#include "board.h"


namespace sudoku {

std::vector<Solution> Board::solve_complete(SolverStats *stats_out, int max_nodes,
                                            std::function<void(float)> onProgress,
                                            std::function<void(Solution &)> onSolution) {
    std::vector<Solution> all_solutions;
    std::unordered_set<std::string> unique_solutions;
    Board tracker = clone_shallow();

    update_impact_map();

    std::vector<CellIdx> positions;
    for (Row r = 0; r < board_size_; ++r)
        for (Col c = 0; c < board_size_; ++c)
            positions.push_back({r, c});

    std::random_device rd;
    std::mt19937 g(rd());
    std::shuffle(positions.begin(), positions.end(), g);

    int nodes_explored = 0;
    const int total_positions = positions.size();
    int current_idx = 0;

    const auto start_time = std::chrono::steady_clock::now();

    for (const CellIdx &idx: positions) {
        current_idx++;
        Cell &cell = this->get_cell(idx);
        if (cell.is_solved())
            continue;

        Cell &tracker_cell = tracker.get_cell(idx);
        NumberSet cands = tracker_cell.candidates;

        for (Number n: cands) {
            if (!this->set_cell(idx, n)) {
                tracker_cell.candidates.remove(n);
                cell.remove_candidate(n);
                continue;
            }

            SolverStats local_stats;
            std::vector<Solution> boards = this->solve(1, max_nodes, &local_stats);
            nodes_explored += local_stats.nodes_explored;

            if (!boards.empty()) {
                Solution sol = boards[0];
                std::ostringstream oss;
                oss << sol;
                const std::string key = oss.str();
                if (unique_solutions.insert(key).second) {
                    all_solutions.push_back(sol);
                    if (onSolution)
                        onSolution(all_solutions.back());
                }

                for (Row r = 0; r < board_size_; ++r) {
                    for (Col c = 0; c < board_size_; ++c) {
                        Number solved_value = sol.get(r, c);
                        Cell &tracker_cell = tracker.get_cell({r, c});
                        if (tracker_cell.candidates.test(solved_value))
                            tracker_cell.candidates.remove(solved_value);
                    }
                }
            } else if (!local_stats.interrupted_by_node_limit) {
                tracker_cell.candidates.remove(n);
                cell.candidates.remove(n);
            }

            this->pop_history();
        }

        if (onProgress)
            onProgress(static_cast<float>(current_idx) / static_cast<float>(total_positions));
    }

    const auto end_time = std::chrono::steady_clock::now();
    float elapsed_ms = std::chrono::duration<float, std::milli>(end_time - start_time).count();

    if (stats_out) {
        stats_out->solutions_found = static_cast<int>(all_solutions.size());
        stats_out->nodes_explored = nodes_explored;
        stats_out->time_taken_ms = elapsed_ms;
        stats_out->interrupted_by_node_limit = false;
        stats_out->interrupted_by_solution_limit = false;
    }

    return all_solutions;
}


std::vector<Solution> Board::solve(int max_solutions, int max_nodes, SolverStats *stats_out) {
    std::vector<Solution> solutions;
    int nodes_explored = 0;
    int guesses_made = 0;
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
            solutions.push_back(copy_solution());
            if (static_cast<int>(solutions.size()) >= max_solutions) {
                interrupted_by_solution_limit = true;
                return false;
            }
            return true;
        }

        const CellIdx pos = get_next_cell();
        const Cell &cell = get_cell(pos);

        // Count as a guess if more than one candidate
        if (cell.candidates.count() > 1) {
            ++guesses_made;
        }

        for (Number n: cell.candidates) {
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
        *stats_out = SolverStats{.solutions_found = static_cast<int>(solutions.size()),
                                 .nodes_explored = nodes_explored,
                                 .guesses_made = guesses_made,
                                 .time_taken_ms = elapsed_ms,
                                 .interrupted_by_node_limit = interrupted_by_node_limit,
                                 .interrupted_by_solution_limit = interrupted_by_solution_limit};
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

sudoku::Solution Board::copy_solution() const {
    Solution sol(board_size_);
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            sol.set(r, c, grid_[r][c].value);
        }
    }
    return sol;
}

Board Board::clone_shallow() const {
    Board res{board_size_};

    // Copy cell values and candidates
    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            res.grid_[r][c].value = grid_[r][c].value;
            res.grid_[r][c].candidates = grid_[r][c].candidates;
        }
    }

    // no copying of handlers!

    return res;
}


}; // namespace sudoku
