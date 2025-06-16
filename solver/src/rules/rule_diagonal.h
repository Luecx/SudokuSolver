#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleDiagonal : public RuleHandler {
public:
    explicit RuleDiagonal(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // hyperparameter
    double BOTH_DIAGONALS_EXIST_CHANCE = 0.5;

    // standard parameters
    bool m_main_diagonal = false;
    bool m_anti_diagonal = false;

    // private member functions
    bool check_unique_diagonal(bool is_main);
};

} // namespace sudoku
