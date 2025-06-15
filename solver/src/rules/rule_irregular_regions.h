#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleIrregularRegions : public RuleHandler {
public:
    explicit RuleIrregularRegions(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;
private:
    std::vector<Region<CellIdx>> m_regions;
    std::vector<std::vector<Cell *>> m_irregular_units;
};

} // namespace sudoku
