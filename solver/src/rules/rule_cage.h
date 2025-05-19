#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct CagePair {
    Region<CellIdx> region;
    int sum;
};

class RuleCage : public RuleHandler {
public:
    explicit RuleCage(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};
    void from_json(JSON &json) override;

private:
    bool number_can_repeat_ = false;

    std::vector<CagePair> cage_pair_;
    Region<CellIdx> remaining_cells;

    bool check_cage(CagePair &pair);
    bool check_group(const CagePair &pair) const;

    int maxSum(int small, int N, int maxC) const;
    int minSum(int large, int N, int minC) const;
    int lowerBound(int N, int sum, int maxC, int size) const;
    int upperBound(int N, int sum, int minC, int size) const;
    std::pair<int, int> getSoftBounds(int N, int sum, int minC, int maxC, int size) const;
};
} // namespace sudoku
