#include "rule_chevron.h"
#include "../board/board.h"

namespace sudoku {

bool RuleChevron::number_changed(CellIdx pos) {
    // unsure if this benefits solver or not
    return false;
}

bool RuleChevron::candidates_changed() { return enforce(); }

bool RuleChevron::valid() {
    for (const auto &edge: m_up_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!check_pair(cell, neighbor, "up"))
            return false;
    }

    for (const auto &edge: m_down_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!check_pair(cell, neighbor, "down"))
            return false;
    }

    for (const auto &edge: m_right_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!check_pair(cell, neighbor, "right"))
            return false;
    }

    for (const auto &edge: m_left_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!check_pair(cell, neighbor, "left"))
            return false;
    }

    return true;
}

void RuleChevron::update_impact(ImpactMap &map) {
    for (const auto &edge: m_up_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto &edge: m_down_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto &edge: m_right_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
    for (const auto &edge: m_left_edges.items()) {
        map.increment({edge.r1, edge.c1});
        map.increment({edge.r2, edge.c2});
    }
}

void RuleChevron::from_json(JSON &json) {
    m_up_edges.clear();
    m_down_edges.clear();
    m_right_edges.clear();
    m_left_edges.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;

        Region<EdgeIdx> region = Region<EdgeIdx>::from_json(rule["fields"]["region"]);
        std::string label = rule["label"].get<std::string>();

        if (label == "Up Chevron")
            m_up_edges = m_up_edges | region;
        else if (label == "Down Chevron")
            m_down_edges = m_down_edges | region;
        else if (label == "Right Chevron")
            m_right_edges = m_right_edges | region;
        else if (label == "Left Chevron")
            m_left_edges = m_left_edges | region;
    }
}

JSON RuleChevron::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Chevron";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();

    auto add_chevron = [&rules](const auto &edges, const std::string &label) {
        if (edges.size() > 0) {
            JSON rule = JSON(JSON::object{});
            rule["label"] = label;

            std::string first_word = label.substr(0, label.find(' '));
            rule["symbol"] = rule_utils::tolower_str(first_word);

            JSON fields = JSON(JSON::object{});
            fields["region"] = edges.to_json();
            rule["fields"] = fields;
            rules.push_back(rule);
        }
    };

    add_chevron(m_up_edges, "Up Chevron");
    add_chevron(m_down_edges, "Down Chevron");
    add_chevron(m_right_edges, "Right Chevron");
    add_chevron(m_left_edges, "Left Chevron");

    json["rules"] = rules;
    return json;
}

void RuleChevron::init_randomly() {
    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<int> up_dist(MIN_UP_EDGES, MAX_UP_EDGES);
    const int num_up = up_dist(gen);

    std::uniform_int_distribution<int> down_dist(MIN_DOWN_EDGES, MAX_DOWN_EDGES);
    const int num_down = down_dist(gen);

    Region<EdgeIdx> available_ver_edges;
    // only get vertical edges
    for (Row r = 0; r < board_->size(); ++r) {
        for (Col c = 0; c < board_->size(); ++c) {
            if (r > 0)
                available_ver_edges.add(EdgeIdx(r, c, r - 1, c)); // up edge
            if (r < board_->size() - 1)
                available_ver_edges.add(EdgeIdx(r, c, r + 1, c)); // down edge
        }
    }

    m_up_edges = rule_utils::generate_random_edges(board_, num_up, &available_ver_edges);
    m_down_edges = rule_utils::generate_random_edges(board_, num_down, &available_ver_edges);

    std::uniform_int_distribution<int> right_dist(MIN_RIGHT_EDGES, MAX_RIGHT_EDGES);
    const int num_right = right_dist(gen);

    std::uniform_int_distribution<int> left_dist(MIN_LEFT_EDGES, MAX_LEFT_EDGES);
    const int num_left = left_dist(gen);

    Region<EdgeIdx> available_hor_edges;
    // only get horizontal edges
    for (Row r = 0; r < board_->size(); ++r) {
        for (Col c = 0; c < board_->size(); ++c) {
            if (c > 0)
                available_hor_edges.add(EdgeIdx(r, c, r, c - 1)); // left edge
            if (c < board_->size() - 1)
                available_hor_edges.add(EdgeIdx(r, c, r, c + 1)); // right edge
        }
    }

    m_right_edges = rule_utils::generate_random_edges(board_, num_right, &available_hor_edges);
    m_left_edges = rule_utils::generate_random_edges(board_, num_left, &available_hor_edges);
}


// privte member functions

bool RuleChevron::enforce() const {
    bool changed = false;

    for (const auto &edge: m_up_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        changed |= enforce_greater_less(cell, neighbor, "up");
        changed |= enforce_greater_less(neighbor, cell, "down");
    }

    for (const auto &edge: m_down_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        changed |= enforce_greater_less(cell, neighbor, "down");
        changed |= enforce_greater_less(neighbor, cell, "up");
    }

    for (const auto &edge: m_right_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        changed |= enforce_greater_less(cell, neighbor, "right");
        changed |= enforce_greater_less(neighbor, cell, "left");
    }

    for (const auto &edge: m_left_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        changed |= enforce_greater_less(cell, neighbor, "left");
        changed |= enforce_greater_less(neighbor, cell, "right");
    }

    return changed;
}

bool RuleChevron::enforce_greater_less(Cell &cell, Cell &neighbor, std::string symbol) const {
    if (cell.is_solved() && neighbor.is_solved())
        return false;

    bool changed = false;
    NumberSet cell_candidates = cell.get_candidates();
    NumberSet neighbor_candidates = neighbor.get_candidates();

    if (symbol == "up" || symbol == "left") {
        if (cell.is_solved()) {
            changed |= allow_greater_cands(neighbor, cell.value);
        } else if (neighbor.is_solved()) {
            changed |= allow_less_cands(cell, neighbor.value);
        } else {
            Number min_cell_val = cell_candidates.lowest();
            changed |= allow_greater_cands(neighbor, min_cell_val);

            Number max_neighbor_val = neighbor_candidates.highest();
            changed |= allow_less_cands(cell, max_neighbor_val);
        }
    } else {
        if (cell.is_solved()) {
            changed |= allow_less_cands(neighbor, cell.value);
        } else if (neighbor.is_solved()) {
            changed |= allow_greater_cands(cell, neighbor.value);
        } else {
            Number max_cell_val = cell_candidates.highest();
            changed |= allow_less_cands(neighbor, max_cell_val);

            Number min_neighbor_val = neighbor_candidates.lowest();
            changed |= allow_greater_cands(cell, min_neighbor_val);
        }
    }

    return changed;
}

bool RuleChevron::check_pair(Cell &cell, Cell &neighbor, std::string symbol) const {
    if (!cell.is_solved() || !neighbor.is_solved())
        return true;

    if (symbol == "up" || symbol == "left")
        return cell.value < neighbor.value;
    else
        return cell.value > neighbor.value;
}

// helper

bool RuleChevron::allow_greater_cands(Cell &cell, Number value) const {
    return cell.only_allow_candidates(NumberSet::greaterThan(board_->size(), value));
}

bool RuleChevron::allow_less_cands(Cell &cell, Number value) const {
    return cell.only_allow_candidates(NumberSet::lessThan(board_->size(), value));
}

} // namespace sudoku
