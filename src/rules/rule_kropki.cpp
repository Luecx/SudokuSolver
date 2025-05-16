#include "rule_kropki.h"
#include "../board/board.h"
#include <unordered_set>
#include <array>
#include <cmath>

namespace sudoku {

bool RuleKropki::number_changed(CellIdx pos) {
    bool changed = false;
    Cell& changed_cell = board_->get_cell(pos);
    if (!changed_cell.is_solved()) return false;

    for (const auto& edge : white_edges_.items()) {
        if (edge.r1 == pos.r && edge.c1 == pos.c) {
            changed |= apply_white_number(changed_cell, board_->get_cell({edge.r2, edge.c2}));
        } else if (edge.r2 == pos.r && edge.c2 == pos.c) {
            changed |= apply_white_number(changed_cell, board_->get_cell({edge.r1, edge.c1}));
        }
    }

    for (const auto& edge : black_edges_.items()) {
        if (edge.r1 == pos.r && edge.c1 == pos.c) {
            changed |= apply_black_number(changed_cell, board_->get_cell({edge.r2, edge.c2}));
        } else if (edge.r2 == pos.r && edge.c2 == pos.c) {
            changed |= apply_black_number(changed_cell, board_->get_cell({edge.r1, edge.c1}));
        }
    }

    if (all_dots_given_) {
        changed |= enforce_missing_dots();
    }

    return changed;
}

bool RuleKropki::candidates_changed() {
    bool changed = false;

    for (const auto& edge : white_edges_.items()) {
        Cell& a = board_->get_cell({edge.r1, edge.c1});
        Cell& b = board_->get_cell({edge.r2, edge.c2});
        changed |= apply_white_candidates(a, b);
        changed |= apply_white_candidates(b, a);
    }

    for (const auto& edge : black_edges_.items()) {
        Cell& a = board_->get_cell({edge.r1, edge.c1});
        Cell& b = board_->get_cell({edge.r2, edge.c2});
        changed |= apply_black_candidates(a, b);
        changed |= apply_black_candidates(b, a);
    }

    return changed;
}

bool RuleKropki::valid() {
    for (const auto& edge : white_edges_.items()) {
        const Cell& a = board_->get_cell({edge.r1, edge.c1});
        const Cell& b = board_->get_cell({edge.r2, edge.c2});
        if (a.is_solved() && b.is_solved()) {
            if (std::abs(a.value - b.value) != 1)
                return false;
        }
    }

    for (const auto& edge : black_edges_.items()) {
        const Cell& a = board_->get_cell({edge.r1, edge.c1});
        const Cell& b = board_->get_cell({edge.r2, edge.c2});
        if (a.is_solved() && b.is_solved()) {
            if (!(a.value == 2 * b.value || b.value == 2 * a.value))
                return false;
        }
    }

    return true;
}

void RuleKropki::update_impact(ImpactMap& map) {
    for (const auto& edge : white_edges_.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto& edge : black_edges_.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
}

bool RuleKropki::apply_white_number(Cell& source, Cell& target) const {
    const int N = source.max_number;
    NumberSet allowed = NumberSet::empty(N);
    // if (source.value > 1) allowed.add(source.value - 1);
    // if (source.value < N) allowed.add(source.value + 1);
    return target.only_allow_candidates(allowed);
}

bool RuleKropki::apply_black_number(Cell& source, Cell& target) const {
    const int N = source.max_number;
    NumberSet allowed = NumberSet::empty(N);
    // if (source.value % 2 == 0 && source.value / 2 >= 1) allowed.add(source.value / 2);
    // if (source.value * 2 <= N) allowed.add(source.value * 2);
    return target.only_allow_candidates(allowed);
}

bool RuleKropki::apply_white_candidates(Cell& a, Cell& b) const {
    if (a.is_solved()) return false;

    const int N = a.max_number;
    NumberSet allowed = NumberSet::empty(N);

    return a.only_allow_candidates(allowed);
    for (Number n : a.candidates) {
        if ((n > 1 && b.candidates.test(n - 1)) ||
            (n < N && b.candidates.test(n + 1))) {
            allowed.add(n);
        }
    }

    return a.only_allow_candidates(allowed);
}

bool RuleKropki::apply_black_candidates(Cell& a, Cell& b) const {
    if (a.is_solved()) return false;

    const int N = a.max_number;
    NumberSet allowed = NumberSet::empty(N);

    return a.only_allow_candidates(allowed);
    for (Number n : a.candidates) {
        if ((n % 2 == 0 && b.candidates.test(n / 2)) ||
            (n * 2 <= N && b.candidates.test(n * 2))) {
            allowed.add(n);
        }
    }

    return a.only_allow_candidates(allowed);
}

bool RuleKropki::enforce_missing_dots() {
    bool changed = false;
    return false;

    for (auto& edge : missing_dot_edges_.items()) {
        Cell& a = board_->get_cell({edge.r1, edge.c1});
        Cell& b = board_->get_cell({edge.r2, edge.c2});
        if (!a.is_solved() && !b.is_solved()) continue;

        changed |= remove_forbidden(a, b);
        changed |= remove_forbidden(b, a);
    }

    return changed;
}

bool RuleKropki::remove_forbidden(Cell& a, Cell& b) const {
    if (!b.is_solved()) return false;
    return false;

    const int N = a.max_number;
    NumberSet forbidden = NumberSet::full(N);

    for (int i = 1; i <= N; ++i) {
        if (std::abs(i - b.value) == 1 || i == 2 * b.value || b.value == 2 * i)
            forbidden.remove(i);
    }

    return a.remove_candidates(forbidden);
}

void RuleKropki::from_json(JSON& json) {
    white_edges_.clear();
    black_edges_.clear();
    combined_edges_.clear();
    missing_dot_edges_.clear();
    all_dots_given_ = false;

    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("allDotsGiven"))
        all_dots_given_ = json["fields"]["allDotsGiven"].get<bool>();

    if (!json["rules"].is_array())
        return;

    for (const auto& rule : json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object()) continue;
        if (!rule["fields"].get<JSON::object>().count("region")) continue;

        Region<EdgeIdx> region = Region<EdgeIdx>::from_json(rule["fields"]["region"]);
        std::string color = rule["color"].get<std::string>();

        if (color == "white") {
            white_edges_ = white_edges_ | region;
        } else if (color == "black") {
            black_edges_ = black_edges_ | region;
        }
    }

    combined_edges_ = white_edges_ | black_edges_;

    // Build full edge region of all adjacent horizontal and vertical neighbors
    Region<EdgeIdx> all_adjacent;
    const int N = board_->size();
    for (Row r = 0; r < N; ++r) {
        for (Col c = 0; c < N; ++c) {
            if (r + 1 < N) all_adjacent.add(EdgeIdx(r, c, r + 1, c));
            if (c + 1 < N) all_adjacent.add(EdgeIdx(r, c, r, c + 1));
        }
    }

    missing_dot_edges_ = all_adjacent - combined_edges_;
}

} // namespace sudoku
