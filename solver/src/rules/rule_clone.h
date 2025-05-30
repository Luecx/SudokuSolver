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

private:
    std::vector<Region<CellIdx>> clone_regions_;
    std::vector<std::vector<int>> clone_groups_;

    bool isSameShape(const Region<CellIdx> &region1, const Region<CellIdx> &region2);
    void initCloneGroups();
};
} // namespace sudoku
