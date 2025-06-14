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
    const int min_clones = 3;
    const int max_clones = 6;
    // min/max number of clones in a group
    const int min_clone_group_size = 2;
    const int max_clone_group_size = 4;
    // min/max size of a region
    const int min_region_size = 2;
    const int max_region_size = 6;

    // standard params
    std::vector<Region<CellIdx>> m_regions;
    std::vector<std::vector<int>> m_units;

    void initCloneGroups();
    bool isSameShape(const Region<CellIdx> &region1, const Region<CellIdx> &region2);
};

} // namespace sudoku
