#include "rule_xv.h"
#include "../board/board.h"

namespace sudoku {

bool RuleXV::number_changed(CellIdx pos) {
    // unsure if this benefits solver or not
    return false;
}

bool RuleXV::candidates_changed() {
    bool changed = false;

    // process X edges
    for (const auto &edge: m_x_edges.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});
        changed |= enforce_sum(a, b, 10);
    }

    // process V edges
    for (const auto &edge: m_v_edges.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});
        changed |= enforce_sum(a, b, 5);
    }

    // if all symbols are given, enforce constraints on cells without symbols
    if (m_all_dots_given)
        changed |= denforce_missing_symbols();

    return changed;
}

bool RuleXV::valid() {
    // check if all X edges form valid pairs
    for (const auto &edge: m_x_edges.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});

        if (!a.is_solved() || !b.is_solved())
            continue;
        if (a.value + b.value != 10)
            return false;
    }

    // check if all V edges form valid pairs
    for (const auto &edge: m_v_edges.items()) {
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
    for (const auto &edge: m_x_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto &edge: m_v_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
}

void RuleXV::from_json(JSON &json) {
    m_x_edges.clear();
    m_v_edges.clear();
    m_combined_edges.clear();
    m_missing_symbol_edges.clear();
    m_all_dots_given = false;

    // NOTE: in xv rules allDotsGiven is given instead of allSymbolsGivenq
    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("allDotsGiven"))
        m_all_dots_given = json["fields"]["allDotsGiven"].get<bool>();

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
            m_x_edges = m_x_edges | region;
        else if (label == "V Rule")
            m_v_edges = m_v_edges | region;
    }

    m_combined_edges = m_x_edges | m_v_edges;
    m_missing_symbol_edges = Region<EdgeIdx>::all(board_->size()) - m_combined_edges;
}

JSON RuleXV::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "XV";

    JSON fields = JSON(JSON::object{});
    fields["allDotsGiven"] = m_all_dots_given;
    json["fields"] = fields;

    JSON::array rules = JSON::array();

    auto add_rule = [&rules](const auto &edges, const std::string &label) {
        if (edges.size() > 0) {
            JSON rule = JSON(JSON::object{});
            rule["label"] = label;
            JSON rule_fields = JSON(JSON::object{});

            rule_fields["region"] = edges.to_json();
            rule["fields"] = rule_fields;

            rules.push_back(rule);
        }
    };

    add_rule(m_x_edges, "X Rule");
    add_rule(m_v_edges, "V Rule");

    json["rules"] = rules;
    return json;
}

// private member functions

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

    if (b.is_solved() && !a.is_solved()) {
        Number target = sum - b.value;
        if (target >= 1 && target <= a.max_number) {
            NumberSet allowed(a.max_number, target);
            return a.only_allow_candidates(allowed);
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

        changed |= a.only_allow_candidates(valid_a);

        // filter candidates for cell b
        NumberSet valid_b(b.max_number);
        for (const auto n: b.get_candidates()) {
            Number other = sum - n;
            if (other >= 1 && other <= a.max_number && a.get_candidates().test(other)) {
                valid_b.add(n);
            }
        }

        changed |= b.only_allow_candidates(valid_b);
        return changed;
    }

    return false;
}

bool RuleXV::denforce_missing_symbols() const {
    bool changed = false;

    for (const auto &edge: m_missing_symbol_edges.items()) {
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
    // a cell is solved, b cell isn't
    if (a.is_solved() && !b.is_solved()) {
        int diff = sum - a.value;
        if (diff < 1 || diff > b.max_number)
            return false;
        return b.remove_candidate(diff);
    }
    return false;
}

} // namespace sudoku
