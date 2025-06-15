#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleKiller : public RuleHandler {
public:
    explicit RuleKiller(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // Hyperparameters
    const double FILL_BOARD_WITH_CAGES = 0.75; // likelihood of the whole board being filled with cages
    const double NUMBER_CAN_REPEAT_PROBABILITY = 0.5;
    const int MIN_REGIONS = 1;
    const int MAX_REGIONS = 10;
    const int MIN_REGION_SIZE = 2;
    const int MAX_REGION_SIZE = 6;

    // Standard parameter
    struct KillerPair {
        Region<CellIdx> region;
        int sum;
    };

    bool m_number_can_repeat = false;

    std::vector<KillerPair> m_cage_pair;
    Region<CellIdx> m_remaining_cells;

    bool check_cage(KillerPair &pair);
};
} // namespace sudoku
