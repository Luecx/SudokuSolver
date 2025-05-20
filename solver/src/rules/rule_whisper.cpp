#include "rule_whisper.h"
#include "../board/board.h"


namespace sudoku {

bool RuleWhisper::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &path: whisper_paths_) {
        if (!path.has(pos))
            continue;

        const auto &items = path.items();
        for (size_t i = 0; i < path.size() - 1; i++) {
            Cell &cell1 = board_->get_cell(items[i]);
            Cell &cell2 = board_->get_cell(items[i + 1]);

            changed |= apply_number_contraint(cell1, cell2);
            changed |= apply_number_contraint(cell2, cell1);
        }
    }

    return changed;
}

bool RuleWhisper::candidates_changed() {
    bool changed = false;
    for (const auto &path: whisper_paths_) {
        const auto &items = path.items();
        for (size_t i = 0; i < path.size() - 1; i++) {
            Cell &cell1 = board_->get_cell(items[i]);
            Cell &cell2 = board_->get_cell(items[i + 1]);

            changed |= apply_candidate_contraint(cell1, cell2);
            changed |= apply_candidate_contraint(cell2, cell1);
        }
    }

    return changed;
}

bool RuleWhisper::valid() {
    for (const auto &path: whisper_paths_) {
        const auto &items = path.items();
        for (size_t i = 0; i < path.size() - 1; i++) {
            Cell &cell1 = board_->get_cell(items[i]);
            Cell &cell2 = board_->get_cell(items[i + 1]);

            if (!valid_pair(cell1, cell2))
                return false;
        }
    }

    return true;
}

void RuleWhisper::update_impact(ImpactMap &map) {
    for (const auto &path: whisper_paths_) {
        for (const auto &pos: path) {
            Cell &cell = board_->get_cell(pos);
            if (cell.is_solved())
                continue;
            map.increment(pos);
        }
    }
}

void RuleWhisper::from_json(JSON &json) {
    whisper_paths_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1)
            whisper_paths_.push_back(path);
    }
}

// private member functions

bool RuleWhisper::apply_number_contraint(Cell &cell1, Cell &cell2) {
    if (!cell1.is_solved() || cell2.is_solved())
        return false;

    const int board_size = board_->size();

    NumberSet allowed(board_size);
    for (int i = 1; i <= board_size; i++)
        if (std::abs(i - cell1.value) >= 5)
            allowed.add(i);

    return cell2.only_allow_candidates(allowed);
}

bool RuleWhisper::apply_candidate_contraint(Cell &cell1, Cell &cell2) {
    bool changed = false;

    // Whisper rule disallows 5 entirely
    if (cell1.candidates.test(5))
        changed |= cell1.remove_candidate(5);
    if (cell2.candidates.test(5))
        changed |= cell2.remove_candidate(5);

    if (cell1.is_solved() || cell2.is_solved())
        return changed;

    const int board_size = board_->size();

    NumberSet valid_cell1(board_size);
    for (const auto n: cell1.candidates) {
        for (const auto m: cell2.candidates) {
            if (std::abs(n - m) >= 5) {
                valid_cell1.add(n);
                break;
            }
        }
    }

    changed |= cell1.only_allow_candidates(valid_cell1);

    // Find valid candidates for cell2
    NumberSet valid_cell2(board_size);
    for (const auto n: cell2.candidates) {
        for (const auto m: cell1.candidates) {
            if (std::abs(n - m) >= 5) {
                valid_cell2.add(n);
                break;
            }
        }
    }

    changed |= cell2.only_allow_candidates(valid_cell2);

    return changed;
}

bool RuleWhisper::valid_pair(Cell &cell1, Cell &cell2) {
    if (cell1.value == 5 || cell2.value == 5)
        return false;

    if (!cell1.is_solved() || !cell2.is_solved())
        return true;

    return std::abs(cell1.value - cell2.value) >= 5;
}

} // namespace sudoku
