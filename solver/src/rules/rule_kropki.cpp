#include "rule_kropki.h"
#include <array>
#include <cmath>
#include <unordered_set>
#include "../board/board.h"


namespace sudoku {

bool RuleKropki::number_changed(CellIdx pos) {
    bool changed = false;

    // white dots
    for (const auto &edge: white_edges_.items()) {
        Cell &a = board_->get_cell(pos);

        if (edge.r1 == pos.r && edge.c1 == pos.c) {
            Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
            changed |= apply_white_number(a, b);
        } else if (edge.r2 == pos.r && edge.c2 == pos.c) {
            Cell &b = board_->get_cell(CellIdx(edge.r1, edge.c1));
            changed |= apply_white_number(a, b);
        }
    }

    // Process black dots
    for (const auto &edge: black_edges_.items()) {
        Cell &a = board_->get_cell(pos);

        if (edge.r1 == pos.r && edge.c1 == pos.c) {
            Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
            changed |= apply_black_number(a, b);
        } else if (edge.r2 == pos.r && edge.c2 == pos.c) {
            Cell &b = board_->get_cell(CellIdx(edge.r1, edge.c1));
            changed |= apply_black_number(a, b);
        }
    }

    if (all_dots_given_)
        changed |= enforce_missing_dots();

    return changed;
}

bool RuleKropki::candidates_changed() {
    bool changed = false;

    // white dots
    for (const auto &edge: white_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
        changed |= apply_white_candidates(a, b);
        changed |= apply_white_candidates(b, a);
    }

    // black dots
    for (const auto &edge: black_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
        changed |= apply_black_candidates(a, b);
        changed |= apply_black_candidates(b, a);
    }

    return changed;
}

bool RuleKropki::valid() {
    // white dot constraints
    for (const auto &edge: white_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));

        if (a.is_solved() && b.is_solved())
            if (std::abs(a.value - b.value) != 1)
                return false;
    }

    // black dot constraints
    for (const auto &edge: black_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));

        if (a.is_solved() && b.is_solved())
            if (a.value != 2 * b.value && b.value != 2 * a.value)
                return false;
    }

    return true;
}

void RuleKropki::update_impact(ImpactMap &map) {
    for (const auto &edge: white_edges_.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto &edge: black_edges_.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
}

bool RuleKropki::apply_white_number(Cell &source, Cell &target) const {
    if (!source.is_solved() || target.is_solved())
        return false;

    const int N = board_->size();
    NumberSet allowed(N);

    // consecutive numbers: +1 or -1
    if (source.value > 1)
        allowed.add(source.value - 1);
    if (source.value < N)
        allowed.add(source.value + 1);

    NumberSet before = target.candidates;
    target.only_allow_candidates(allowed);
    return target.candidates != before;
}

bool RuleKropki::apply_black_number(Cell &source, Cell &target) const {
    if (!source.is_solved() || target.is_solved())
        return false;

    const int N = board_->size();
    NumberSet allowed(N);

    // double/half: *2 or /2
    if (source.value % 2 == 0 && source.value / 2 >= 1)
        allowed.add(source.value / 2);
    if (source.value * 2 <= N)
        allowed.add(source.value * 2);

    NumberSet before = target.candidates;
    target.only_allow_candidates(allowed);
    return target.candidates != before;
}

bool RuleKropki::apply_white_candidates(Cell &a, Cell &b) const {
    if (a.is_solved() || b.is_solved())
        return false;

    const int N = board_->size();
    NumberSet allowed(N);

    for (Number n = 1; n <= N; ++n) {
        if (!a.candidates.test(n))
            continue;

        bool valid = false;
        // for each candidate n in a, check if b has a valid consecutive number
        if ((n > 1 && b.candidates.test(n - 1)) || (n < N && b.candidates.test(n + 1))) {
            valid = true;
        }

        if (valid)
            allowed.add(n);
    }

    return a.only_allow_candidates(allowed);
}

bool RuleKropki::apply_black_candidates(Cell &a, Cell &b) const {
    if (a.is_solved() || b.is_solved())
        return false;

    const int N = board_->size();
    NumberSet allowed(N);

    for (Number n = 1; n <= N; ++n) {
        if (!a.candidates.test(n))
            continue;

        bool valid = false;
        // for each candidate n in a, check if b has a valid double/half
        if ((n % 2 == 0 && n / 2 >= 1 && b.candidates.test(n / 2)) || (n * 2 <= N && b.candidates.test(n * 2))) {
            valid = true;
        }

        if (valid)
            allowed.add(n);
    }

    return a.only_allow_candidates(allowed);
}

bool RuleKropki::enforce_missing_dots() {
    if (!all_dots_given_)
        return false;

    bool changed = false;
    const int N = board_->size();

    // process cells that have no dot between them
    for (const auto &edge: missing_dot_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
        if (!a.is_solved() && !b.is_solved())
            continue;
        changed |= remove_forbidden(a, b);
        changed |= remove_forbidden(b, a);
    }

    return changed;
}

bool RuleKropki::remove_forbidden(Cell &a, Cell &b) const {
    if (!b.is_solved())
        return false;

    const int N = board_->size();
    NumberSet forbidden(N);

    for (Number i = 1; i <= N; ++i) {
        // consecutive numbers need a white dot
        if (std::abs(static_cast<int>(i) - b.value) == 1)
            forbidden.add(i);
        // double/half relationships need a black dot
        if (i == 2 * b.value || b.value == 2 * i)
            forbidden.add(i);
    }

    return a.remove_candidates(forbidden);
}

void RuleKropki::from_json(JSON &json) {
    white_edges_.clear();
    black_edges_.clear();
    combined_edges_.clear();
    missing_dot_edges_.clear();
    all_dots_given_ = false;

    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("allDotsGiven"))
        all_dots_given_ = json["fields"]["allDotsGiven"].get<bool>();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<EdgeIdx> region = Region<EdgeIdx>::from_json(rule["fields"]["region"]);
        std::string color = rule["color"].get<std::string>();

        if (color == "white") {
            white_edges_ = white_edges_ | region;
        } else if (color == "black") {
            black_edges_ = black_edges_ | region;
        }
    }

    combined_edges_ = white_edges_ | black_edges_;
    missing_dot_edges_ = Region<EdgeIdx>::all(board_->size()) - combined_edges_;
}

} // namespace sudoku
