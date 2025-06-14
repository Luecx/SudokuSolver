#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleSandwich : public RuleHandler {
public:
    explicit RuleSandwich(Board *board) : RuleHandler(board) {}
    ~RuleSandwich();

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
    const int MAX_PAIRS = 5;
    const int MIN_REGION_SIZE = 1;
    const int MAX_REGION_SIZE = 3;

    // Standard Parameters
    struct SandwichPair {
        Region<RCIdx> region;
        int sum = 0;
    };

    int *m_min_digits;
    int *m_max_digits;

    std::vector<std::vector<NumberSet>> m_union_sets;
    std::vector<SandwichPair> m_pairs;

    void initTables();

    bool check_sandwich(const RCIdx &pos, const int sum);
    bool check_unkown_digits(int idx1, int idxBoardSize, const RCIdx &pos, const int sum);
    bool check_known_digit(int idx1, int idxBoardSize, const RCIdx &pos, const int sum);
    bool check_known_digits(int idx1, int idxBoardSize, const RCIdx &pos, const int sum);

    const std::vector<Cell *> &get_line(const RCIdx &pos) const;
    const std::pair<int, int> get_digits(const std::vector<Cell *> &line) const;
};

} // namespace sudoku
