#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleAntiChess : public RuleHandler {
public:
    explicit RuleAntiChess(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    struct AntiChessPair {
        std::string label;
        bool enabled = true;
        bool allow_repeats = false;
        Region<CellIdx> region; // can be of size 0
        std::vector<int> forbidden_sums; // can be of size 0
    };

    // hyperparameters
    const double REGION_EXIST_CHANCE = 0.30;
    const double BOTH_REGIONS_ENABLED_CHANCE = 0.75;

    const int REGION_SIZE_MIN = 8;
    const int REGION_SIZE_MAX = 16;

    // standard parameters
    AntiChessPair m_pair[2];
    Region<CellIdx> m_remaining_cells;

    // private member functions
    bool is_cage_valid(const Region<CellIdx> &region, bool allow_repeats);
    bool check_cage(const Region<CellIdx> &region, bool allow_repeats);
    bool enforce_forbidden_sums(const Cell &c1, Cell &c2, const AntiChessPair &pair);

    bool contains_sum(int sum, const std::vector<int> &forbidden_sums) {
        if (forbidden_sums.empty())
            return false;
        return std::binary_search(forbidden_sums.begin(), forbidden_sums.end(), sum);
    }
};

} // namespace sudoku
