#include "rule_chevron.h"
#include "../board/board.h"


namespace sudoku {

bool RuleChevron::number_changed(CellIdx pos) { return enforce(); }

bool RuleChevron::candidates_changed() { return enforce(); }

bool RuleChevron::valid() {
    for (const auto &edge: m_up_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!checkPair(cell, neighbor, "up"))
            return false;
    }

    for (const auto &edge: m_down_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!checkPair(cell, neighbor, "down"))
            return false;
    }

    for (const auto &edge: m_right_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!checkPair(cell, neighbor, "right"))
            return false;
    }

    for (const auto &edge: m_left_edges.items()) {
        Cell &cell = board_->get_cell({edge.r1, edge.c1});
        Cell &neighbor = board_->get_cell({edge.r2, edge.c2});
        if (!checkPair(cell, neighbor, "left"))
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
            changed |= allowGreaterCandidates(neighbor, cell.value);
        } else if (neighbor.is_solved()) {
            changed |= allowLessCandidates(cell, neighbor.value);
        } else {
            Number min_cell_val = cell_candidates.lowest();
            changed |= allowGreaterCandidates(neighbor, min_cell_val);

            Number max_neighbor_val = neighbor_candidates.highest();
            changed |= allowLessCandidates(cell, max_neighbor_val);
        }
    } else {
        if (cell.is_solved()) {
            changed |= allowLessCandidates(neighbor, cell.value);
        } else if (neighbor.is_solved()) {
            changed |= allowGreaterCandidates(cell, neighbor.value);
        } else {
            Number max_cell_val = cell_candidates.highest();
            changed |= allowLessCandidates(neighbor, max_cell_val);

            Number min_neighbor_val = neighbor_candidates.lowest();
            changed |= allowGreaterCandidates(cell, min_neighbor_val);
        }
    }

    return changed;
}

bool RuleChevron::checkPair(Cell &cell, Cell &neighbor, std::string symbol) const {
    if (!cell.is_solved() || !neighbor.is_solved())
        return true;

    if (symbol == "up" || symbol == "left")
        return cell.value < neighbor.value;
    else
        return cell.value > neighbor.value;
}


// helper

bool RuleChevron::allowGreaterCandidates(Cell &cell, Number value) const {
    return cell.only_allow_candidates(NumberSet::greaterThan(board_->size(), value));
}

bool RuleChevron::allowLessCandidates(Cell &cell, Number value) const {
    return cell.only_allow_candidates(NumberSet::lessThan(board_->size(), value));
}

} // namespace sudoku
