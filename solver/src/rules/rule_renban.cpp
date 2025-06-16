#include "rule_renban.h"
#include "../board/board.h"

namespace sudoku {

bool RuleRenban::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &path: m_paths) {
        if (!path.has(pos))
            continue;
        changed |= enforce_renban(path);
    }
    return changed;
}

bool RuleRenban::candidates_changed() {
    bool changed = false;
    for (const auto &path: m_paths)
        changed |= enforce_renban(path);
    return changed;
}

void RuleRenban::update_impact(ImpactMap &map) {
    for (const auto &path: m_paths) {
        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                continue;
            map.increment(pos);
        }
    }
}

bool RuleRenban::valid() {
    for (const auto &path: m_paths) {
        NumberSet solved_values(board_->size());
        for (const auto &pos: path) {
            const Cell &cell = board_->get_cell(pos);
            if (!cell.is_solved())
                continue;

            if (solved_values.test(cell.value))
                return false; // duplicate value in path
            solved_values.add(cell.value);
        }

        int path_size = path.size();
        if (solved_values.count() != path_size)
            continue;

        int dist = solved_values.highest() - solved_values.lowest() + 1;
        if (dist != path_size)
            return false;
    }

    return true;
}

void RuleRenban::from_json(JSON &json) {
    m_paths.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1)
            m_paths.push_back(path);
    }
}

JSON RuleRenban::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Renban";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();

    for (const auto &path: m_paths) {
        JSON rule = JSON(JSON::object{});
        JSON fields = JSON(JSON::object{});

        fields["path"] = path.to_json();

        rule["fields"] = fields;
        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

void RuleRenban::init_randomly() {
    m_paths.clear();

    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<int> path_length_dist(MIN_PATH_LENGTH, MAX_PATH_LENGTH);
    std::uniform_int_distribution<int> path_count_dist(MIN_PATHS, MAX_PATHS);

    Region<CellIdx> available_region = Region<CellIdx>::all(board_->size());

    const int path_count = path_count_dist(gen);

    int attempts = 0;
    while ((int) m_paths.size() < path_count && attempts++ < 100) {
        int path_length = path_length_dist(gen);
        Region<CellIdx> path = rule_utils::generate_random_path(board_, path_length, &available_region);

        if (path.size() < 2)
            continue; // skip paths that are too short
        m_paths.push_back(path);
    }
}

// private member functions

bool RuleRenban::enforce_renban(const Region<CellIdx> &path) {
    const int board_size = board_->size();
    const int length = path.size();

    bool changed = false;

    NumberSet all(board_size);

    // collect solved cells
    NumberSet solved_values(board_size);
    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);

        all |= cell.get_candidates();

        if (!cell.is_solved())
            continue;

        if (solved_values.test(cell.value))
            return false; // duplicate value in path
        solved_values.add(cell.value);
    }

    // check if certain candidates have no neighbors
    NumberSet invalid(board_size);
    for (const auto n: all) {
        bool has_valid_sequence = false;

        int start = std::max(1, n - length + 1);
        int end = std::min(board_size - length + 1, int(n));

        while (start <= end) {
            bool sequence_possible = true;
            // check if all numbers in this sequence have at least one candidate in the path
            for (int i = 0; i < length; i++)
                if (!all.test(start + i)) {
                    sequence_possible = false;
                    break;
                }

            if (sequence_possible) {
                has_valid_sequence = true;
                break;
            }
            start++;
        }

        if (!has_valid_sequence)
            invalid.add(n);
    }

    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);
        if (cell.is_solved())
            continue;
        changed |= cell.remove_candidates(invalid);
    }

    // if no cells are solved, we cannot enforce renban
    if (solved_values.count() == 0)
        return changed;

    int min_solved = solved_values.lowest();
    int max_solved = solved_values.highest();

    int min_start = std::max(1, max_solved - length + 1);
    int max_start = std::min(board_size - length + 1, min_solved);

    // check if range is valid
    if (min_start > max_start)
        return false;

    int max_possible = max_start + length - 1;

    if (min_start > 1 || max_possible < board_size) {
        NumberSet invalid =
                NumberSet::greaterThan(board_size, max_possible) | NumberSet::lessThan(board_size, min_start);
        for (const auto &pos: path)
            changed |= board_->get_cell(pos).remove_candidates(invalid);
    }

    return changed;
}

} // namespace sudoku
