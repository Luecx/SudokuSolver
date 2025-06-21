#include <iostream>
#include <fstream>
#include <iomanip>
#include <sstream>
#include <string>
#include <vector>

#include "argparser/arg_parser.h"
#include "bench.h"
#include "board/board.h"
#include "json/json.h"
#include "solver_stats.h"
#include "datagen.h"

// ---- Utility function ----

std::string load_json_input(const std::string& input) {
    std::ifstream in(input);
    if (in) {
        return std::string((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
    }
    return input; // fallback: treat as inline JSON string
}

// ---- Core solve logic ----

void solve(const std::string& json, int max_solutions, int max_nodes, bool smart_mode) {
    std::cout << "STARTING\n";
    try {
        auto root = JSON::parse(json);
        Board board{9};
        board.from_json(root);
        board.set_smart_hints(smart_mode);

        SolverStats stats;
        auto solutions = board.solve(max_solutions, max_nodes, &stats);

        for (auto& sol : solutions)
            std::cout << "[SOLUTION]" << sol << "\n";

        std::cout << "[INFO]solutions_found=" << stats.solutions_found << "\n";
        std::cout << "[INFO]nodes_explored=" << stats.nodes_explored << "\n";
        std::cout << "[INFO]guesses_made=" << stats.guesses_made << "\n";
        std::cout << "[INFO]time_taken_ms=" << std::fixed << std::setprecision(3) << stats.time_taken_ms << "\n";
        std::cout << "[INFO]interrupted_by_node_limit=" << (stats.interrupted_by_node_limit ? "true" : "false") << "\n";
        std::cout << "[INFO]interrupted_by_solution_limit=" << (stats.interrupted_by_solution_limit ? "true" : "false") << "\n";
    } catch (const std::exception& e) {
        std::cout << "[INFO]error=" << e.what() << "\n";
    }
    std::cout << "[DONE]\n";
}

void solve_complete(const std::string& json, int max_nodes, bool smart_mode) {
    std::cout << "STARTING\n";
    try {
        auto root = JSON::parse(json);
        Board board{9};
        board.from_json(root);
        board.set_smart_hints(smart_mode);

        SolverStats stats;
        float last_progress = -1.0f;

        board.solve_complete(&stats, max_nodes,
                             [&](float progress) {
                                 float rounded = std::floor(progress * 100.0f) / 100.0f;
                                 if (rounded > last_progress) {
                                     last_progress = rounded;
                                     std::cout << "[PROGRESS]" << std::fixed << std::setprecision(2) << rounded << "\n";
                                 }
                             },
                             [&](Solution& sol) {
                                 std::cout << "[SOLUTION]" << sol << "\n";
                             });

        std::cout << "[INFO]solutions_found=" << stats.solutions_found << "\n";
        std::cout << "[INFO]nodes_explored=" << stats.nodes_explored << "\n";
        std::cout << "[INFO]time_taken_ms=" << std::fixed << std::setprecision(3) << stats.time_taken_ms << "\n";
        std::cout << "[INFO]interrupted_by_node_limit=" << (stats.interrupted_by_node_limit ? "true" : "false") << "\n";
        std::cout << "[INFO]interrupted_by_solution_limit=" << (stats.interrupted_by_solution_limit ? "true" : "false") << "\n";
    } catch (const std::exception& e) {
        std::cout << "[INFO]error=" << e.what() << "\n";
    }
    std::cout << "[DONE]\n";
}

// ---- Setup and execution ----

int run_internal(const std::string& commandline) {


    std::cout << "[DEBUG] Input : " << commandline << "\n";

    ArgParser parser;

    auto& opt_json      = parser.add_option("json", "Input JSON file or raw JSON string");
    auto& opt_sol_limit = parser.add_option("sol_limit", "Max number of solutions");
    auto& opt_node_lim  = parser.add_option("node_limit", "Max number of nodes");
    auto& opt_smart     = parser.add_option("smart", "Enable smart solving");
    auto& opt_out       = parser.add_option("out", "Output path");

    auto& solve_cmd = parser.add_command("solve", [&](ArgParser& p) {
        std::string json = load_json_input(p.require<std::string>("json"));
        solve(json,
              p.require<int>("sol_limit"),
              p.require<int>("node_limit"),
              p.get<bool>("smart", false));
    });
    parser.add_required(solve_cmd, opt_json);
    parser.add_required(solve_cmd, opt_sol_limit);
    parser.add_required(solve_cmd, opt_node_lim);
    parser.add_optional(solve_cmd, opt_smart);

    auto& complete_cmd = parser.add_command("complete", [&](ArgParser& p) {
        std::string json = load_json_input(p.require<std::string>("json"));
        solve_complete(json,
                       p.require<int>("node_limit"),
                       p.get<bool>("smart", false));
    });
    parser.add_required(complete_cmd, opt_json);
    parser.add_required(complete_cmd, opt_node_lim);
    parser.add_optional(complete_cmd, opt_smart);

    auto& bench_cmd = parser.add_command("bench", [&](ArgParser& p) {
        std::string json = load_json_input(p.require<std::string>("json"));
        bench::bench(json, 17, 128000, p.get<bool>("smart", false));
    });
    parser.add_required(bench_cmd, opt_json);
    parser.add_optional(bench_cmd, opt_smart);

    auto& datagen_cmd = parser.add_command("datagen", [&](ArgParser& p) {
        std::string out = p.require<std::string>("out");
        for (int i = 0; i < 3; ++i) {
            std::cout << "Generating puzzle " << (i + 1) << "/3...\n";
            datagen::generate_random_puzzle(out, 17, 128000);
        }
    });
    parser.add_required(datagen_cmd, opt_out);

    try {
        parser.parse(commandline);

        std::cout << "[DEBUG] Command: " << parser.command_name() << "\n";
        for (const auto& [key, val] : parser.values()) {
            std::cout << "[DEBUG] Option: " << key << " = " << val << "\n";
        }

        parser.run();
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << "\n";
        parser.print_help("solver");
        return 1;
    }
}

// ---- C/WASM entrypoint ----

extern "C" int run(const char* commandline) {
    std::printf("[DEBUG] raw input: \"%s\"\n", commandline);
    try {
        return run_internal(std::string(commandline));
    } catch (...) {
        return 1;
    }
}

// ---- CLI main() entry ----

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Error: No command provided.\n";
        return run_internal("");
    }

    std::ostringstream oss;
    for (int i = 1; i < argc; ++i) {
        oss << argv[i] << " ";
    }

    return run_internal(oss.str());
}
