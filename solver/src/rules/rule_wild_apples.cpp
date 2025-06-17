#include "rule_wild_apples.h"
#include "../board/board.h"

namespace sudoku {

bool RuleWildApples::number_changed(CellIdx pos) {
    bool changed = false;

    for (const auto &edge: m_apple_edges.items()) {
        Cell &a = board_->get_cell(pos);

        if (edge.r1 == pos.r && edge.c1 == pos.c) {
            Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));
            changed |= apply_apple_number(a, b);
        } else if (edge.r2 == pos.r && edge.c2 == pos.c) {
            Cell &b = board_->get_cell(CellIdx(edge.r1, edge.c1));
            changed |= apply_apple_number(a, b);
        }
    }

    // all dots are given in wild apples
    changed |= enforce_missing_dots();

    return changed;
}

bool RuleWildApples::candidates_changed() {
    bool changed = false;

    for (const auto &edge: m_apple_edges.items()) {
        Cell &a = board_->get_cell(CellIdx{edge.r1, edge.c1});
        Cell &b = board_->get_cell(CellIdx{edge.r2, edge.c2});
        changed |= apply_apple_candidates(a, b);
        changed |= apply_apple_candidates(b, a);
    }

    return changed;
}

bool RuleWildApples::valid() {
    for (const auto &edge: m_apple_edges.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));

        if (a.is_solved() && b.is_solved()) {
            // check non-consecutive
            if (std::abs(a.value - b.value) == 1)
                return false;
            // check one even, one odd
            if ((a.value % 2) == (b.value % 2))
                return false;
        }
    }

    return true;
}

void RuleWildApples::update_impact(ImpactMap &map) {
    for (const auto &edge: m_apple_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
}

void RuleWildApples::from_json(JSON &json) {
    m_apple_edges.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        std::string label = rule["label"].get<std::string>();
        if (label != "Wild Apples")
            continue;

        Region<EdgeIdx> region = Region<EdgeIdx>::from_json(rule["fields"]["region"]);
        m_apple_edges = m_apple_edges | region;
    }

    m_missing_edges = Region<EdgeIdx>::all(board_->size()) - m_apple_edges;
}

JSON RuleWildApples::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Wild-Apples";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();

    // Add Wild Apples if they exist
    if (m_apple_edges.size() > 0) {
        JSON rule = JSON(JSON::object{});
        rule["label"] = "Wild Apples";
        JSON fields = JSON(JSON::object{});

        fields["region"] = m_apple_edges.to_json();

        rule["fields"] = fields;
        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

void RuleWildApples::init_randomly() {
    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<int> dist(MIN_WILD_APPLES, MAX_WILD_APPLES);
    const int num_apples = dist(gen);

    Region<EdgeIdx> available_edges = Region<EdgeIdx>::all(board_->size());

    m_apple_edges = rule_utils::generate_random_edges(board_, num_apples, &available_edges);
    m_missing_edges = Region<EdgeIdx>::all(board_->size()) - m_apple_edges;
}

// private member functions

bool RuleWildApples::apply_apple_number(Cell &source, Cell &target) const {
    if (!source.is_solved() || target.is_solved())
        return false;

    const int N = board_->size();
    NumberSet allowed(N);

    for (Number i = 1; i <= N; ++i) {
        // must be non-consecutive
        if (std::abs(int(i) - source.value) == 1)
            continue;
        // must have different parity (one even, one odd)
        if ((i % 2) == (source.value % 2))
            continue;

        allowed.add(i);
    }

    return target.only_allow_candidates(allowed);
}

bool RuleWildApples::apply_apple_candidates(Cell &a, Cell &b) const {
    if (a.is_solved() || b.is_solved())
        return false;

    const int N = board_->size();
    NumberSet allowed(N);

    for (const auto n: a.candidates) {
        bool valid = false;
        // check if b has any valid candidates for this n
        for (const auto m: b.candidates) {
            // must be non-consecutive and different parity
            if (std::abs(int(n) - int(m)) != 1 && (n % 2) != (m % 2)) {
                valid = true;
                break;
            }
        }

        if (valid)
            allowed.add(n);
    }

    return a.only_allow_candidates(allowed);
}

bool RuleWildApples::enforce_missing_dots() {
    bool changed = false;

    for (const auto &edge: m_missing_edges.items()) {
        Cell &a = board_->get_cell(CellIdx(edge.r1, edge.c1));
        Cell &b = board_->get_cell(CellIdx(edge.r2, edge.c2));

        changed |= remove_apple_forbidden(a, b);
        changed |= remove_apple_forbidden(b, a);
    }

    return changed;
}

bool RuleWildApples::remove_apple_forbidden(Cell &a, Cell &b) const {
    if (!b.is_solved())
        return false;

    const int N = board_->size();
    NumberSet forbidden(N);

    for (Number i = 1; i <= N; ++i) {
        // if this would create an apple constraint, forbid it
        // (non-consecutive AND different parity)
        bool non_consecutive = std::abs(int(i) - b.value) != 1;
        bool different_parity = (i % 2) != (b.value % 2);

        if (non_consecutive && different_parity)
            forbidden.add(i);
    }

    return a.remove_candidates(forbidden);
}

} // namespace sudoku
