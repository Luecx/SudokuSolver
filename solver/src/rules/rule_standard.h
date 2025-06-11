#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

bool hidden_singles(Board *board_, std::vector<Cell *> &unit);

/**
 * @brief Check if a group contains all numbers from 1 to n.
 */
bool is_group_valid(const std::vector<Cell *> &unit);

class RuleStandard : public RuleHandler {
public:
    explicit RuleStandard(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};
    void from_json(JSON &json) override {};

private:
};

} // namespace sudoku
