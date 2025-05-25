#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

std::pair<int, int> getSoftBounds(int N, int sum, int minC, int maxC, int size, bool number_can_repeat_ = false);


struct CagePair {
    Region<CellIdx> region;
    int sum;
};

class RuleKiller : public RuleHandler {
public:
    explicit RuleKiller(Board *board) : RuleHandler(board) {}

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
};
} // namespace sudoku
