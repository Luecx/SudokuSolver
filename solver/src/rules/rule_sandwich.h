#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct SandwichPair {
    Region<RCIdx> region;
    int sum = 0;
};

// NOTE: For some reason this is very slow!
class RuleSandwich : public RuleHandler {
public:
    explicit RuleSandwich(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    std::vector<int> m_min_digits;
    std::vector<int> m_max_digits;
    std::vector<std::vector<std::vector<NumberSet>>> m_valid_combinations;
    std::vector<Cell *> m_line;
    std::vector<SandwichPair> m_pairs;

    void generateSandwichTables();
    void initLine(const RCIdx &pos);
    bool has_possible_pair(int i, int other_digit, int minD, int maxD);
    bool check_sandwich(const RCIdx &pos, const int sum);
};
} // namespace sudoku
