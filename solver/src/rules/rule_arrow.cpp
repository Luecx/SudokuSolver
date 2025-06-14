#include "rule_arrow.h"
#include "../board/board.h"
#include "rule_killer.h"

namespace sudoku {

bool RuleArrow::number_changed(CellIdx pos) {
    bool changed = false;
    for (auto &arrow_pair: m_arrow_pairs) {
        const Region<CellIdx> &base = arrow_pair.base;
        const Region<CellIdx> &path = arrow_pair.path;
        // check if the changed cell is in the base or path
        if (!base.has(pos) && !path.has(pos))
            continue;
        changed |= determine_base_options(arrow_pair);
        changed |= determine_path_options(arrow_pair);
    }
    return changed;
}

bool RuleArrow::candidates_changed() {
    bool changed = false;
    for (auto &arrow_pair: m_arrow_pairs) {
        changed |= determine_base_options(arrow_pair);
        changed |= determine_path_options(arrow_pair);
    }
    return changed;
}

bool RuleArrow::valid() {
    for (const auto &arrow_pair: m_arrow_pairs) {
        const Region<CellIdx> &base = arrow_pair.base;
        const Region<CellIdx> &path = arrow_pair.path;

        auto [base_lb, base_ub] = bounds_base(base, false);
        auto [path_lb, path_ub] = bounds_path(path, base.size(), false);

        if (base_ub < path_lb || base_lb > path_ub)
            return false;
    }

    return true;
}

void RuleArrow::update_impact(ImpactMap &map) {
    for (const auto &arrow_pair: m_arrow_pairs) {
        const Region<CellIdx> &base = arrow_pair.base;
        const Region<CellIdx> &path = arrow_pair.path;

        map.increment_region(base);
        map.increment_region(path);
    }
}

void RuleArrow::from_json(JSON &json) {
    m_arrow_pairs.clear();

    if (board_->size() != 9)
        return; // arrow rules only supported for 9x9 boards

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("base"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("path"))
            continue;

        Region<CellIdx> base = Region<CellIdx>::from_json(rule["fields"]["base"]);
        Region<CellIdx> path = Region<CellIdx>::from_json(rule["fields"]["path"]);

        if (base.size() > 0 && path.size() > 0) {
            // sort base regions by row if horizontal, or by column if vertical
            if (base.size() == 2) {
                if (base.items()[0].r == base.items()[1].r) { // horizontal arrow
                    std::sort(base.items().begin(), base.items().end(),
                              [](const CellIdx &a, const CellIdx &b) { return a.c < b.c; });
                } else { // vertical arrow
                    std::sort(base.items().begin(), base.items().end(),
                              [](const CellIdx &a, const CellIdx &b) { return a.r < b.r; });
                }
            }

            ArrowPair arrow_pair;
            arrow_pair.base = base;
            arrow_pair.path = path;

            m_arrow_pairs.push_back(arrow_pair);
        }
    }
}

JSON RuleArrow::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Arrow";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();

    for (const auto &arrow_pair: m_arrow_pairs) {
        JSON rule = JSON(JSON::object{});
        JSON fields = JSON(JSON::object{});

        fields["base"] = arrow_pair.base.to_json();
        fields["path"] = arrow_pair.path.to_json();

        rule["fields"] = fields;
        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

void RuleArrow::init_randomly() {
    m_arrow_pairs.clear();

    const int board_size = board_->size();
    if (board_size != 9)
        return; // arrow rules only supported for 9x9 boards

    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<int> arrow_dist(MIN_ARROWS, MAX_ARROWS);
    std::uniform_int_distribution<int> path_length_dist(MIN_PATH_LENGTH, MAX_PATH_LENGTH);
    std::uniform_real_distribution<double> base_size_dist(0.0, 1.0);

    int num_arrows = arrow_dist(gen);

    for (int i = 0; i < num_arrows; ++i) {
        while (true) {
            int base_cell_size;
            if (base_size_dist(gen) < BASE_SIZE_1_PROBABILITY)
                base_cell_size = 1;
            else
                base_cell_size = 2;

            int path_length = path_length_dist(gen);
            auto path_region = rule_utils::generate_random_path(board_, path_length);

            Region<CellIdx> base_region;
            CellIdx path_start = path_region.items()[0];

            std::uniform_int_distribution<int> dir_dist(0, 3);
            int directions[][2] = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}}; // up, down, left, right

            // find a valid adjacent position for base region
            std::vector<CellIdx> valid_positions;
            for (int dir = 0; dir < 4; ++dir) {
                CellIdx adj_pos{path_start.r + directions[dir][0], path_start.c + directions[dir][1]};

                if (rule_utils::pos_in_bounds(board_, adj_pos) && !path_region.has(adj_pos)) {
                    valid_positions.push_back(adj_pos);
                }
            }

            if (!valid_positions.empty()) {
                std::uniform_int_distribution<int> pos_dist(0, valid_positions.size() - 1);
                CellIdx base_start = valid_positions[pos_dist(gen)];
                base_region.add(base_start);

                // if base_cell_size is 2, add one more adjacent cell
                if (base_cell_size == 2) {
                    for (int dir = 0; dir < 4; ++dir) {
                        CellIdx adj_pos{base_start.r + directions[dir][0], base_start.c + directions[dir][1]};

                        if (path_region.has(adj_pos) || //
                            base_region.has(adj_pos) || //
                            !rule_utils::pos_in_bounds(board_, adj_pos)) {
                            continue; // skip if out of bounds or already in path/base region
                        }

                        base_region.add(adj_pos);
                        break;
                    }
                }

                // only add if we successfully created both regions
                if ((int) base_region.size() < base_cell_size || (int) path_region.size() < MIN_PATH_LENGTH) {
                    continue;
                }

                ArrowPair arrow_pair;
                arrow_pair.base = base_region;
                arrow_pair.path = path_region;

                m_arrow_pairs.push_back(arrow_pair);
                break;
            }
        }
    }
}

// private member functions

bool RuleArrow::determine_base_options(ArrowPair &arrow_pair) {
    bool changed = false;
    Region<CellIdx> &base = arrow_pair.base;
    Region<CellIdx> &path = arrow_pair.path;

    auto [path_lb, path_ub] = bounds_path(path, base.size());
    Cell &cell1 = board_->get_cell(base.items()[0]);

    if (base.size() == 1) {
        if (cell1.is_solved())
            return false;
        changed |= cell1.only_allow_candidates(NumberSet::greaterEqThan(cell1.max_number, path_lb));
    } else {
        Cell &cell2 = board_->get_cell(base.items()[1]);
        if (cell1.is_solved() && cell2.is_solved())
            return false;

        NumberSet cands1(cell1.max_number);
        NumberSet cands2(cell2.max_number);

        for (int i = path_lb; i <= path_ub; i++) {
            if (i > 10)
                cands1.add(i / 10);
            if (i % 10 > 0)
                cands2.add(i % 10);
        }

        changed |= cell1.only_allow_candidates(cands1);
        changed |= cell2.only_allow_candidates(cands2);
    }

    return changed;
}

bool RuleArrow::determine_path_options(ArrowPair &arrow_pair) {
    bool changed = false;

    Region<CellIdx> &base = arrow_pair.base;
    Region<CellIdx> &path = arrow_pair.path;

    auto [base_lb, base_ub] = bounds_base(base);
    auto [path_lb, path_ub] = bounds_path(path, base.size(), base.size() == 2);

    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);
        if (cell.is_solved())
            continue;

        int lb_rest = path_lb - cell.candidates.lowest();
        int ub_rest = path_ub - cell.candidates.highest();

        int lb = std::clamp(base_lb - ub_rest, 1, cell.max_number);
        int ub = std::clamp(base_ub - lb_rest, 1, cell.max_number);

        NumberSet cands = NumberSet::greaterEqThan(cell.max_number, lb) & NumberSet::lessEqThan(cell.max_number, ub);
        changed |= cell.only_allow_candidates(cands);
    }

    return changed;
}

std::pair<int, int> RuleArrow::bounds_base(const Region<CellIdx> &base, bool clip) {
    int lb = 0;
    int ub = 0;
    Cell &cell1 = board_->get_cell(base.items()[0]);

    if (base.size() == 2) {
        Cell &cell2 = board_->get_cell(base.items()[1]);
        lb = cell1.candidates.lowest() * 10 + cell2.candidates.lowest();
        ub = cell1.candidates.highest() * 10 + cell2.candidates.highest();
    } else {
        lb = cell1.candidates.lowest();
        ub = cell1.candidates.highest();
    }

    if (clip)
        return clamp_bounds(lb, ub, base.size());
    else
        return {lb, ub};
}

std::pair<int, int> RuleArrow::bounds_path(const Region<CellIdx> &path, int base_size, bool clip) {
    int lb = 0;
    int ub = 0;

    for (const auto &pos: path) {
        Cell &cell = board_->get_cell(pos);
        lb += cell.candidates.lowest();
        ub += cell.candidates.highest();
    }

    if (clip)
        return clamp_bounds(lb, ub, base_size);
    else
        return {lb, ub};
}

std::pair<int, int> RuleArrow::clamp_bounds(int lb, int ub, int base_size) {
    int max = base_size == 1 ? board_->size() : 10 * board_->size() + board_->size();
    return {std::clamp(lb, 1, max), std::clamp(ub, 1, max)};
}

} // namespace sudoku
