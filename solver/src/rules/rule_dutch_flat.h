#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleDutchFlat : public RuleHandler {
public:
    explicit RuleDutchFlat(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};

    void from_json(JSON &json) override {};
    JSON to_json() const override { return ""; }

    void init_randomly() override {}

private:
    bool enforce_dutch_flat(CellIdx pos);

    Cell *get_above_cell(CellIdx pos);
    Cell *get_below_cell(CellIdx pos);
};

} // namespace sudoku
