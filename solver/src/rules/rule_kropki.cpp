#include "rule_kropki.h"
#include "../board/board.h"

namespace sudoku {

bool RuleKropki::number_changed(CellIdx pos) {
    // unsure if this benefits solver or not
    return false;
}

bool RuleKropki::candidates_changed() {
    bool changed = false;

    // white dots
    for (const auto &edge: m_white_edges.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
        changed |= apply_white_candidates(a, b);
        changed |= apply_white_candidates(b, a);
    }

    // black dots
    for (const auto &edge: m_black_edges.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
        changed |= apply_black_candidates(a, b);
        changed |= apply_black_candidates(b, a);
    }

    if (m_all_dots_given)
        changed |= enforce_missing_dots();

    return changed;
}

bool RuleKropki::valid() {
    // white dot constraints
    for (const auto &edge: m_white_edges.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));

        if (a.is_solved() && b.is_solved())
            if (std::abs(a.value - b.value) != 1)
                return false;
    }

    // black dot constraints
    for (const auto &edge: m_black_edges.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));

        if (a.is_solved() && b.is_solved())
            if (a.value != 2 * b.value && b.value != 2 * a.value)
                return false;
    }

    return true;
}

void RuleKropki::update_impact(ImpactMap &map) {
    for (const auto &edge: m_white_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto &edge: m_black_edges.items()) {
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

    return target.only_allow_candidates(allowed);
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

    return target.only_allow_candidates(allowed);
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
    if (!m_all_dots_given)
        return false;

    bool changed = false;

    // process cells that have no dot between them
    for (const auto &edge: m_missing_dot_edges.items()) {
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
    m_white_edges.clear();
    m_black_edges.clear();
    m_combined_edges.clear();
    m_missing_dot_edges.clear();
    m_all_dots_given = false;

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
        std::string color = rule["color"].get<std::string>();

        if (color == "white") {
            m_white_edges = m_white_edges | region;
        } else if (color == "black") {
            m_black_edges = m_black_edges | region;
        }
    }

    m_combined_edges = m_white_edges | m_black_edges;
    m_missing_dot_edges = Region<EdgeIdx>::all(board_->size()) - m_combined_edges;
}

JSON RuleKropki::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Kropki";

    JSON fields = JSON(JSON::object{});
    fields["allDotsGiven"] = m_all_dots_given;
    json["fields"] = fields;

    JSON::array rules = JSON::array();

    // Add white edges if they exist
    if (m_white_edges.size() > 0) {
        JSON rule = JSON(JSON::object{});
        JSON rule_fields = JSON(JSON::object{});

        rule_fields["region"] = m_white_edges.to_json();
        rule["fields"] = rule_fields;
        rule["color"] = "white";

        rules.push_back(rule);
    }

    // Add black edges if they exist
    if (m_black_edges.size() > 0) {
        JSON rule = JSON(JSON::object{});
        JSON rule_fields = JSON(JSON::object{});

        rule_fields["region"] = m_black_edges.to_json();
        rule["fields"] = rule_fields;
        rule["color"] = "black";

        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

} // namespace sudoku
