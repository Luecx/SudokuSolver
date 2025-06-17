#include "rule_palindrome.h"
#include "../board/board.h"

namespace sudoku {

bool RulePalindrome::number_changed(CellIdx pos) {
    bool changed = false;

    for (auto &path: m_paths) {
        const std::vector<CellIdx> &items = path.items();

        const int unit_size = items.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = board_->get_cell(items[i]);
            Cell &b = board_->get_cell(items[unit_size - i - 1]);

            changed |= enforce_symmetry(a, b);
            changed |= enforce_symmetry(b, a);
        }
    }

    return changed;
}

bool RulePalindrome::candidates_changed() {
    bool changed = false;
    for (auto &path: m_paths) {
        const std::vector<CellIdx> &items = path.items();

        const int unit_size = items.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = board_->get_cell(items[i]);
            Cell &b = board_->get_cell(items[unit_size - i - 1]);

            NumberSet intersection = a.candidates & b.candidates;
            changed |= a.only_allow_candidates(intersection);
            changed |= b.only_allow_candidates(intersection);
        }
    }

    return changed;
}

bool RulePalindrome::valid() {
    for (auto &path: m_paths) {
        const std::vector<CellIdx> &items = path.items();

        const int unit_size = items.size();
        const int half = unit_size / 2;

        for (int i = 0; i < half; ++i) {
            Cell &a = board_->get_cell(items[i]);
            Cell &b = board_->get_cell(items[unit_size - i - 1]);
            // if both cell values arent the same, then false
            if (a.is_solved() && b.is_solved() && a.value != b.value)
                return false;
        }
    }
    return true;
}

void RulePalindrome::update_impact(ImpactMap &map) {
    for (auto &path: m_paths) {
        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                continue;
            map.increment(pos);
        }
    }
};

void RulePalindrome::from_json(JSON &json) {
    m_paths.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1) // only accept paths with more than 1 cell
            m_paths.emplace_back(path);
    }
}

JSON RulePalindrome::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Palindrome";
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

void RulePalindrome::init_randomly() {
    m_paths.clear();

    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<int> path_count_dist(MIN_PATHS, MAX_PATHS);
    std::uniform_int_distribution<int> path_length_dist(MIN_PATH_LENGTH, MAX_PATH_LENGTH);

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

bool RulePalindrome::enforce_symmetry(Cell &a, Cell &b) {
    if (!a.is_solved() || b.is_solved())
        return false;

    // if "b" is not solved, but "a" is, then "b" must equal to the value of "a"
    return b.only_allow_candidates(NumberSet(board_->size(), a.value));
}

} // namespace sudoku
