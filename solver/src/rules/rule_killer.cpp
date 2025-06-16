#include "rule_killer.h"
#include "../board/board.h"

namespace sudoku {

bool RuleKiller::number_changed(CellIdx pos) {
    bool changed = false;
    for (auto &pair: m_pairs) {
        const Region<CellIdx> &region = pair.region;
        if (!region.has(pos))
            continue;

        changed |= check_cage(pair);
        break; // regions can't overlap
    }
    return changed;
}

bool RuleKiller::candidates_changed() {
    bool changed = false;
    for (auto &pair: m_pairs)
        changed |= check_cage(pair);
    return changed;
}

bool RuleKiller::valid() {
    for (const auto &pair: m_pairs) {
        int sum = 0;
        NumberSet seen_values(board_->size());
        bool all_solved = true;

        for (const auto &item: pair.region) {
            const Cell &cell = board_->get_cell(item);

            if (!cell.is_solved()) {
                all_solved = false;
                continue;
            }

            sum += cell.value;

            if (!m_number_can_repeat) {
                if (seen_values.test(cell.value))
                    return false;
                seen_values.add(cell.value);
            }
        }

        if (sum > pair.sum || (all_solved && sum != pair.sum))
            return false;
    }
    return true;
}

void RuleKiller::from_json(JSON &json) {
    m_pairs.clear();

    if (json["fields"].is_object() && json["fields"].get<JSON::object>().count("NumberCanRepeat"))
        m_number_can_repeat = json["fields"]["NumberCanRepeat"].get<bool>();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("sum"))
            continue;

        Region<CellIdx> region = Region<CellIdx>::from_json(rule["fields"]["region"]);
        if (region.size() > 0) {
            KillerPair cage_pair;
            cage_pair.region = region;
            cage_pair.sum = static_cast<int>(rule["fields"]["sum"].get<double>());
            m_pairs.push_back(cage_pair);
        }
    }
}

JSON RuleKiller::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = name;

    JSON fields = JSON(JSON::object{});
    fields["NumberCanRepeat"] = m_number_can_repeat;
    json["fields"] = fields;

    JSON::array rules = JSON::array();

    for (const auto &cage_pair: m_pairs) {
        JSON rule = JSON(JSON::object{});
        JSON rule_fields = JSON(JSON::object{});

        rule_fields["region"] = cage_pair.region.to_json();
        rule_fields["sum"] = static_cast<double>(cage_pair.sum);

        rule["fields"] = rule_fields;
        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

void RuleKiller::init_randomly() { m_pairs.clear(); }

// private member functions

bool RuleKiller::check_cage(KillerPair &pair) {
    const int board_size = board_->size();
    m_remaining_cells.clear();

    int sum = 0;
    NumberSet seen(board_size);

    Number min_cand = board_size;
    Number max_cand = 1;

    for (const auto &item: pair.region) {
        Cell &cell = board_->get_cell(item);

        if (cell.is_solved()) {
            sum += cell.value;

            if (m_number_can_repeat)
                continue; // repetition allowed, no need to check

            if (seen.test(cell.value))
                return false;
            seen.add(cell.value);
        } else {
            m_remaining_cells.add(cell.pos);
            min_cand = std::min(min_cand, cell.candidates.lowest());
            max_cand = std::max(max_cand, cell.candidates.highest());
        }
    }

    if (m_remaining_cells.size() == 0)
        return false;

    auto [min, max] = rule_utils::getSoftBounds(m_remaining_cells.size(), pair.sum - sum, min_cand, max_cand,
                                                board_size, m_number_can_repeat);

    bool changed = false;
    for (const auto &pos: m_remaining_cells) {
        Cell &cell = board_->get_cell(pos);
        for (const auto n: cell.candidates) {
            if ((!m_number_can_repeat && seen.test(n)) || n < min || n > max)
                changed |= cell.remove_candidate(n);
        }
    }

    return changed;
}

} // namespace sudoku
