#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleClone : public RuleHandler {
public:
    explicit RuleClone(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // Hyperparameters
    // min/max number of different clone groups
    const int MIN_CLONES = 3;
    const int MAX_CLONES = 6;
    // min/max number of clones in a group
    const int MIN_CLONE_GROUP_SIZE = 2;
    const int MAX_CLONE_GROUP_SIZE = 4;
    // min/max size of a region
    const int MIN_REGION_SIZE = 2;
    const int MAX_REGION_SIZE = 6;

    // standard params
    std::vector<Region<CellIdx>> m_regions;
    std::vector<std::vector<int>> m_units;

    void initCloneGroups();
    bool isSameShape(const Region<CellIdx> &region1, const Region<CellIdx> &region2);
};

} // namespace sudoku
