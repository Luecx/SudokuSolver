#include "rule_parity.h"
#include "../board/board.h"


namespace sudoku {

bool RuleParity::number_changed(CellIdx pos) {
    bool changed = false;
    for (const auto &path: parity_paths_) {
        if (!path.has(pos))
            continue;
        changed |= enforceParityAlternation(path);
    }
    return changed;
}

bool RuleParity::candidates_changed() {
    bool changed = false;
    for (const auto &path: parity_paths_)
        changed |= enforceParityAlternation(path);
    return changed;
}

bool RuleParity::valid() {
    for (const auto &path: parity_paths_) {
        const std::vector<CellIdx> &items = path.items();

        for (size_t i = 0; i < items.size(); ++i) {
            Cell &cell = board_->get_cell(items[i]);
            if (cell.is_solved())
                continue;

            if (cell.candidates.count() == 0)
                return false;
        }
    }

    return true;
}

void RuleParity::from_json(JSON &json) {
    parity_paths_.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);
        if (path.size() > 1) // only accept paths with more than 1 cell
            parity_paths_.push_back(path);
    }
}

// private member functions

bool RuleParity::enforceParityAlternation(const Region<CellIdx> &path) {
    bool changed = false;

    const int board_size = board_->size();

    const NumberSet cand_even = NumberSet::even(board_size);
    const NumberSet cand_odd = NumberSet::odd(board_size);
    const NumberSet cand_all = NumberSet::full(board_size);

    NumberSet cand_mask_even_id = cand_all;
    NumberSet cand_mask_odd_id = cand_all;

    const std::vector<CellIdx> &items = path.items();

    // Step 1: Determine valid parity patterns from known values or candidates
    for (size_t i = 0; i < items.size(); ++i) {
        Cell &cell = board_->get_cell(items[i]);

        if (cell.is_solved()) {
            bool isEven = (cell.value % 2 == 0);
            if (i % 2 == 0) {
                cand_mask_even_id &= (isEven ? cand_even : cand_odd);
                cand_mask_odd_id &= (isEven ? cand_odd : cand_even);
            } else {
                cand_mask_even_id &= (isEven ? cand_odd : cand_even);
                cand_mask_odd_id &= (isEven ? cand_even : cand_odd);
            }
        } else {
            NumberSet even_candidates = cell.candidates & cand_even;
            NumberSet odd_candidates = cell.candidates & cand_odd;
            bool canBeEven = even_candidates.count() > 0;
            bool canBeOdd = odd_candidates.count() > 0;

            if (!canBeOdd) {
                if (i % 2 == 0) {
                    cand_mask_even_id &= cand_even;
                    cand_mask_odd_id &= cand_odd;
                } else {
                    cand_mask_even_id &= cand_odd;
                    cand_mask_odd_id &= cand_even;
                }
            } else if (!canBeEven) {
                if (i % 2 == 0) {
                    cand_mask_even_id &= cand_odd;
                    cand_mask_odd_id &= cand_even;
                } else {
                    cand_mask_even_id &= cand_even;
                    cand_mask_odd_id &= cand_odd;
                }
            }
        }
    }

    // Step 2: Apply the determined parity masks
    for (size_t i = 0; i < items.size(); ++i) {
        Cell &cell = board_->get_cell(items[i]);
        if (cell.is_solved())
            continue;

        const NumberSet &mask = (i % 2 == 0) ? cand_mask_even_id : cand_mask_odd_id;
        NumberSet before = cell.candidates;
        cell.candidates &= mask;
        if (cell.candidates != before)
            changed = true;
    }

    return changed;
}

} // namespace sudoku
