#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct DiagSumPair {
    Region<DiagonalIdx> region;
    int sum = 0;
};

class RuleDiagonalSum : public RuleHandler {
public:
    explicit RuleDiagonalSum(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override { return ""; }

    void init_randomly() override {}

private:
    std::vector<DiagSumPair> m_diagsum_pairs;

    bool check_diagonal(DiagSumPair &pair);
};

} // namespace sudoku
