#pragma once

#include "../number_set.h"
#include "_rule_handler.h"
#include "../cell.h"

namespace sudoku {
class RuleStandard : public RuleHandler {
public:
    RuleStandard(Board *board) : RuleHandler(board) {}
    ~RuleStandard() override = default;

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &impact_map) override {};
    void from_json(JSON &json) override {};

private:
    bool check_group(const std::vector<Cell*> unit);
};
} // namespace sudoku
