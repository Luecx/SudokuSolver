#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleExtraRegions : public RuleHandler {
public:
    explicit RuleExtraRegions(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;
private:
    // Hyperparameters
    const int MIN_NUM_REGIONS = 1;
    const int MAX_NUM_REGIONS = 5;

    // Standard parameters
    std::vector<Region<CellIdx>> m_regions;
};

} // namespace sudoku
