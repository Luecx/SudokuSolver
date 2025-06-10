#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {
class RuleIrregular : public RuleHandler {
public:
    explicit RuleIrregular(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};
    void from_json(JSON &json) override;

private:
    std::vector<Region<CellIdx>> m_irregular_regions;
    std::vector<std::vector<Cell *>> m_irregular_units;
};
} // namespace sudoku
