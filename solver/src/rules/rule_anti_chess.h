#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct AntiChessPair {
    std::string label;
    bool enabled = true;
    bool allow_repeats = false;
    Region<CellIdx> region; // can be of size 0
    std::vector<int> forbidden_sums; // can be of size 0
};

class RuleAntiChess : public RuleHandler {
public:
    explicit RuleAntiChess(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    AntiChessPair m_pair[2];
    Region<CellIdx> m_remaining_cells;

    bool in_bounds(const CellIdx &pos);
    bool is_cage_valid(const Region<CellIdx> &region, bool allow_repeats);
    bool check_cage(const Region<CellIdx> &region, bool allow_repeats);
    bool enforce_forbidden_sums(const Cell &c1, Cell& c2, const AntiChessPair &pair);

    bool contains_sum(int sum, const std::vector<int> &forbidden_sums) {
        if (forbidden_sums.empty())
            return false;
        return std::binary_search(forbidden_sums.begin(), forbidden_sums.end(), sum);
    }

    std::vector<int> getForbiddenSums(const std::string input);
};

} // namespace sudoku
