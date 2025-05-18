#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleMagic : public RuleHandler {
public:
    explicit RuleMagic(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};
    void from_json(JSON &json) override;

private:
    std::vector<Region<CellIdx>> magic_regions_;
    std::vector<std::vector<Cell *>> magic_units_;
};
} // namespace sudoku
