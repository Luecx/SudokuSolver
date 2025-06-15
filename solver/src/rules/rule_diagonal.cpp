#include "rule_diagonal.h"
#include "../board/board.h"

namespace sudoku {

bool RuleDiagonal::number_changed(CellIdx pos) {
    const int board_size = board_->size();
    const Cell &cell = board_->get_cell(pos);

    bool changed = false;

    if (m_main_diagonal && pos.r == pos.c) {
        for (int i = 0; i < board_size; ++i) {
            Cell &diag_cell = board_->get_cell({i, i});
            if (diag_cell.is_solved())
                continue;
            changed |= diag_cell.remove_candidate(cell.value);
        }
    }

    if (m_anti_diagonal && pos.r + pos.c == board_size - 1) {
        for (int i = 0; i < board_size; ++i) {
            Cell &anti_diag_cell = board_->get_cell({i, board_size - 1 - i});
            if (anti_diag_cell.is_solved())
                continue;
            changed |= anti_diag_cell.remove_candidate(cell.value);
        }
    }

    return changed;
}

bool RuleDiagonal::candidates_changed() {
    return false; // unnecessary to implement
}

bool RuleDiagonal::valid() {
    if (m_main_diagonal && !check_unique_diagonal(true))
        return false;
    if (m_anti_diagonal && !check_unique_diagonal(false))
        return false;
    return true;
}

void RuleDiagonal::from_json(JSON &json) {
    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("diagonal"))
        m_main_diagonal = json["fields"]["diagonal"].get<bool>();
    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("antiDiagonal"))
        m_anti_diagonal = json["fields"]["antiDiagonal"].get<bool>();
}

JSON RuleDiagonal::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Diagonal";

    JSON fields = JSON(JSON::object{});
    fields["diagonal"] = m_main_diagonal;
    fields["antiDiagonal"] = m_anti_diagonal;

    json["fields"] = fields;
    return json;
}

void RuleDiagonal::init_randomly() {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    std::uniform_real_distribution<double> dis(0.0, 1.0);

    if (dis(gen) < BOTH_DIAGONALS_EXIST_CHANCE) {
        m_main_diagonal = true;
        m_anti_diagonal = true;
    } else {
        // If both aren't enabled, 50% chance for main diagonal
        if (dis(gen) < 0.5) {
            m_main_diagonal = true;
            m_anti_diagonal = false;
        } else {
            m_main_diagonal = false;
            m_anti_diagonal = true;
        }
    }
}

// private member function

bool RuleDiagonal::check_unique_diagonal(bool is_main) {
    const int board_size = board_->size();

    NumberSet seen(board_size);

    for (int i = 0; i < board_size; ++i) {
        Cell &cell = is_main ? board_->get_cell({i, i}) : board_->get_cell({i, board_size - 1 - i});
        if (!cell.is_solved())
            continue;

        if (seen.test(cell.value))
            return false; // duplicate found
        seen.add(cell.value);
    }

    return true; // unique
}

} // namespace sudoku
