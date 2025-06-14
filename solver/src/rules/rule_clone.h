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
    int num_clone_groups = 3; // Number of different clone groups to create
    int max_clone_group_size = 4; // Maximum size of each clone group

    // standard params
    std::vector<Region<CellIdx>> m_regions;
    std::vector<std::vector<int>> m_units;

    void initCloneGroups();
    bool isSameShape(const Region<CellIdx> &region1, const Region<CellIdx> &region2);
};

} // namespace sudoku
