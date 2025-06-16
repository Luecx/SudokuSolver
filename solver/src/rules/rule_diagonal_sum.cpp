#include "rule_diagonal_sum.h"
#include "../board/board.h"
#include "rule_killer.h"

namespace sudoku {

bool RuleDiagonalSum::number_changed(CellIdx pos) {
    DiagonalIdx main(DiagonalType::MAIN, pos.r - pos.c);
    DiagonalIdx anti(DiagonalType::ANTI, pos.r + pos.c);

    bool changed = false;
    for (auto &pair: m_diagsum_pairs) {
        if (pair.region.has(main))
            changed |= check_diagonal(main, pair.sum);
        if (pair.region.has(anti))
            changed |= check_diagonal(anti, pair.sum);
    }
    return changed;
}

bool RuleDiagonalSum::candidates_changed() {
    bool changed = false;
    for (auto &pair: m_diagsum_pairs)
        for (const auto &diag: pair.region)
            changed |= check_diagonal(diag, pair.sum);
    return changed;
};

bool RuleDiagonalSum::valid() {
    for (const auto &pair: m_diagsum_pairs) {
        for (const auto &diag: pair.region) {
            const std::vector<CellIdx> &cell_pos = diag.attached_cells(board_->size());

            bool all_solved = true;
            int sum = 0;
            for (const auto &pos: cell_pos) {
                Cell &c = board_->get_cell(pos);
                if (c.is_solved())
                    sum += c.value;
                else
                    all_solved = false;
            }
            // if sum is greater than the target sum, return false
            // since it doesnt matter if cell aren't fully solved
            // otherwise if cells are all solved and sum is not equal to target sum, return false
            // if cells are not all solved but the sum is equal to target sum, return false
            // since adding any number to the sum will make it greater than target sum
            if (sum > pair.sum || (sum == pair.sum) != all_solved)
                return false;
        }
    }

    return true;
}

void RuleDiagonalSum::update_impact(ImpactMap &map) {
    const int board_size = board_->size();
    for (const auto &pair: m_diagsum_pairs) {
        const Region<CellIdx> &cell_pos = pair.region.attached_cells(board_size);
        for (const auto &pos: cell_pos) {
            Cell &c = board_->get_cell(pos);
            if (c.is_solved())
                continue;
            map.increment(pos);
        }
    }
}

void RuleDiagonalSum::from_json(JSON &json) {
    m_diagsum_pairs.clear();

    if (!json["rules"].is_array())
        return;

    for (const auto &rule: json["rules"].get<JSON::array>()) {
        if (!rule["fields"].is_object())
            continue;
        if (!rule["fields"].get<JSON::object>().count("region"))
            continue;
        if (!rule["fields"].get<JSON::object>().count("sum"))
            continue;

        Region<DiagonalIdx> region = Region<DiagonalIdx>::from_json(rule["fields"]["region"]);
        int sum = static_cast<int>(rule["fields"]["sum"].get<double>());

        if (sum != 0 && region.size() > 0) {
            DiagSumPair pair;
            pair.region = region;
            pair.sum = sum;

            m_diagsum_pairs.push_back(pair);
        }
    }
}

JSON RuleDiagonalSum::to_json() const {
    JSON json = JSON(JSON::object{});
    json["type"] = "Diagonal-Sum";
    json["fields"] = JSON(JSON::object{});

    JSON::array rules = JSON::array();

    for (const auto &diagsum_pair: m_diagsum_pairs) {
        JSON rule = JSON(JSON::object{});
        JSON fields = JSON(JSON::object{});

        fields["region"] = diagsum_pair.region.to_json();
        fields["sum"] = static_cast<double>(diagsum_pair.sum);

        rule["fields"] = fields;
        rules.push_back(rule);
    }

    json["rules"] = rules;
    return json;
}

void RuleDiagonalSum::init_randomly() {
    m_diagsum_pairs.clear();

    static std::random_device rd;
    static std::mt19937 gen(rd());

    std::uniform_int_distribution<int> diag_count_dist(MIN_PAIRS, MAX_PAIRS);
    int diag_count = diag_count_dist(gen);

    const int board_size = board_->size();

    std::uniform_int_distribution<int> index_dist(-(board_size - 1), board_size - 1);
    std::uniform_int_distribution<int> region_size_dist(MIN_REGION_SIZE, MAX_REGION_SIZE);

    Region<DiagonalIdx> occupied_region;

    int attempts = 0;
    while ((int) m_diagsum_pairs.size() < diag_count && attempts < 100) {
        int region_size = region_size_dist(gen);

        Region<DiagonalIdx> region;

        int min_length = board_size;
        int max_length = 0;

        int region_attempts = 0;
        while ((int) region.size() < region_size && region_attempts < 25) {
            // randomly select a diagonal type and index
            DiagonalType type = (rand() % 2 == 0) ? DiagonalType::MAIN : DiagonalType::ANTI;
            int index = index_dist(gen);

            DiagonalIdx diag(type, index);
            if (occupied_region.has(diag))
                continue; // already used this diagonal

            region.add(diag);
            occupied_region.add(diag);

            min_length = std::min(min_length, diagonal_length(diag));
            max_length = std::max(max_length, diagonal_length(diag));
            region_attempts++;
        }

        std::uniform_int_distribution<int> sum_dist(min_length, max_length * board_->size());

        int sum = sum_dist(gen);
        m_diagsum_pairs.push_back({region, sum});

        attempts++;
        if ((int) region.size() != region_size)
            break; // prevent infinite loop if not enough space
    }
}


// private member function

bool RuleDiagonalSum::check_diagonal(const DiagonalIdx &diag, const int pair_sum) {
    const int board_size = board_->size();
    const std::vector<CellIdx> &cells_pos = diag.attached_cells(board_size);

    int reamining_size = 0;
    int sum = 0;

    Number min_candidate = board_size;
    Number max_candidate = 1;

    for (const auto &pos: cells_pos) {
        Cell &cell = board_->get_cell(pos);
        if (cell.is_solved()) {
            sum += cell.value;
            continue;
        }

        for (Number d = 1; d <= board_size; ++d) {
            if (!cell.candidates.test(d))
                continue;
            min_candidate = std::min(min_candidate, d);
            max_candidate = std::max(max_candidate, d);
        }

        reamining_size++;
    }

    auto [min, max] =
            rule_utils::getSoftBounds(reamining_size, pair_sum - sum, min_candidate, max_candidate, board_size);

    bool changed = false;
    for (const auto &pos: cells_pos) {
        Cell &cell = board_->get_cell(pos);
        for (Number d = 1; d <= board_size; ++d) {
            if (!cell.candidates.test(d))
                continue;
            if (d < min || d > max)
                changed |= cell.remove_candidate(d);
        }
    }
    return changed;
}

int RuleDiagonalSum::diagonal_length(const DiagonalIdx &diag) const {
    const int board_size = board_->size();

    if (diag.type == DiagonalType::MAIN) {
        int start_c = std::max(0, diag.index);
        int end_c = std::min(board_size, board_size + diag.index);
        return std::max(0, end_c - start_c);
    } else {
        int start_c = std::max(0, -diag.index);
        int end_c = std::min(board_size, board_size - diag.index);
        return std::max(0, end_c - start_c);
    }
}

} // namespace sudoku
