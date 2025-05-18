#include "rule_xv.h"
#include "../board/board.h"

namespace sudoku {

bool RuleXV::number_changed(CellIdx pos) {
    return enforce();
}

bool RuleXV::candidates_changed() { return enforce(); }

bool RuleXV::valid() {
    // check if all X edges form valid pairs
    for (const auto &edge: x_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});

        if (!a.is_solved() || !b.is_solved())
            continue;
        if (a.value + b.value != 10)
            return false;
    }

    // check if all V edges form valid pairs
    for (const auto &edge: v_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});

        if (!a.is_solved() || !b.is_solved())
            continue;

        if (a.value + b.value != 5)
            return false;
    }

    return true;
}

void RuleXV::update_impact(ImpactMap &map) {
    for (const auto &edge: x_edges_.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto &edge: v_edges_.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
}

void RuleXV::from_json(JSON &json) {
    x_edges_.clear();
    v_edges_.clear();
    combined_edges_.clear();
    missing_symbol_edges_.clear();
    all_symbols_given_ = false;

    // NOTE: in xv rules allDotsGiven is given instead of allSymbolsGivenq
    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("allDotsGiven"))
        all_symbols_given_ = json["fields"]["allDotsGiven"].get<bool>();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<EdgeIdx> region = Region<EdgeIdx>::from_json(rule["fields"]["region"]);
        std::string label = rule["label"].get<std::string>();

        if (label == "X Rule")
            x_edges_ = x_edges_ | region;
        else if (label == "V Rule")
            v_edges_ = v_edges_ | region;
    }

    combined_edges_ = x_edges_ | v_edges_;
    missing_symbol_edges_ = Region<EdgeIdx>::all(board_->size()) - combined_edges_;
}

// private member functions

bool RuleXV::enforce() const {
    bool changed = false;

    // Process X edges
    for (const auto &edge: x_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});

        changed |= enforce_sum(a, b, 10);
        changed |= enforce_sum(b, a, 10);
    }

    // Process V edges
    for (const auto &edge: v_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});

        changed |= enforce_sum(a, b, 5);
        changed |= enforce_sum(b, a, 5);
    }

    // If all symbols are given, enforce constraints on cells without symbols
    if (all_symbols_given_)
        changed |= denforce_missing_symbols();

    return changed;
}

bool RuleXV::enforce_sum(Cell &a, Cell &b, int sum) const {
    // case 1: one cell is solved, the other isn't
    if (a.is_solved() && !b.is_solved()) {
        Number target = sum - a.value;
        if (target >= 1 && target <= b.max_number) {
            NumberSet allowed(b.max_number, target);
            return b.only_allow_candidates(allowed);
        }
        return false;
    }

    // case 2: both cells are unsolved
    if (!a.is_solved() && !b.is_solved()) {
        bool changed = false;

        // filter candidates for cell a
        NumberSet valid_a(a.max_number);
        for (const auto n: a.get_candidates()) {
            Number other = sum - n;
            if (other >= 1 && other <= b.max_number && b.get_candidates().test(other)) {
                valid_a.add(n);
            }
        }

        changed = a.only_allow_candidates(valid_a) || changed;

        // filter candidates for cell b
        NumberSet valid_b(b.max_number);
        for (const auto n: b.get_candidates()) {
            Number other = sum - n;
            if (other >= 1 && other <= a.max_number && a.get_candidates().test(other)) {
                valid_b.add(n);
            }
        }

        changed = b.only_allow_candidates(valid_b) || changed;

        return changed;
    }

    return false;
}

bool RuleXV::denforce_missing_symbols() const {
    bool changed = false;

    for (const auto &edge: missing_symbol_edges_.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});

        changed |= denforce_sum(a, b, 10);
        changed |= denforce_sum(b, a, 10);
        changed |= denforce_sum(a, b, 5);
        changed |= denforce_sum(b, a, 5);
    }

    return changed;
}

bool RuleXV::denforce_sum(Cell &a, Cell &b, int sum) const {
    // case 1: a cell is solved, b cell isn't
    if (a.is_solved() && !b.is_solved()) {
        NumberSet forbidden(a.max_number, Number(sum - a.value));
        return b.remove_candidates(forbidden);
    }

    // case 2: b cell is solved a cell isn't
    if (!a.is_solved() && b.is_solved()) {
        NumberSet forbidden(b.max_number, Number(sum - b.value));
        return a.remove_candidates(forbidden);
    }

    // case 3: both cells are unsolved/solved
    return false;
}

} // namespace sudoku
