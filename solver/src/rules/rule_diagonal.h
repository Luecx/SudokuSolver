#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleDiagonal : public RuleHandler {
public:
    explicit RuleDiagonal(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override { return false; };
    bool valid() override;
    void update_impact(ImpactMap &map) override {};
    void from_json(JSON &json) override;

private:
    bool m_diagonal = false;
    bool m_anti_diagonal = false;

    bool check_unique_diagonal(bool is_main);
};
} // namespace sudoku
