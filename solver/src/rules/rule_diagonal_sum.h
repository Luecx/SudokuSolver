#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {


class RuleDiagonalSum : public RuleHandler {
public:
    explicit RuleDiagonalSum(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // Hyperparameters
    const int MIN_PAIRS = 1;
    const int MAX_PAIRS = 3;
    const int MIN_REGION_SIZE = 1; 
    const int MAX_REGION_SIZE = 2;

    // Standard parameters
    struct DiagSumPair {
        Region<DiagonalIdx> region;
        int sum = 0;
    };

    std::vector<DiagSumPair> m_diagsum_pairs;

    bool check_diagonal(const DiagonalIdx &diag, const int pair_sum);
    int diagonal_length(const DiagonalIdx &diag) const;
};

} // namespace sudoku
