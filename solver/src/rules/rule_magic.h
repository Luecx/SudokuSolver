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
    std::vector<std::array<int, 9>> possible_layouts_;

    bool is3x3Square(const Region<CellIdx> &region);

    bool isValidLayout(const std::vector<Cell *>& unit, const std::array<int, 9>& layout);
    void initPossibleLayouts(const std::vector<Cell *> &unit);

    bool applyCandidates(const std::vector<Cell *> &unit);
};
} // namespace sudoku
