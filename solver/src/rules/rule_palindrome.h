#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RulePalindrome : public RuleHandler {
public:
    explicit RulePalindrome(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // hyperparameters
    const int MIN_PATH_LENGTH = 2;
    const int MAX_PATH_LENGTH = 5;
    const int MIN_PATHS = 1;
    const int MAX_PATHS = 5;

    // standard parameter
    std::vector<Region<CellIdx>> m_paths;

    // private member function
    bool enforce_symmetry(Cell &a, Cell &b);
};

} // namespace sudoku
