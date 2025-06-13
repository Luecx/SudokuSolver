#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

#include <array>

namespace sudoku {

class RuleMagic : public RuleHandler {
public:
    explicit RuleMagic(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override {}

private:
    std::vector<Region<CellIdx>> m_regions;
    std::vector<std::array<int, 9>> m_possible_layouts;

    bool is3x3Square(const Region<CellIdx> &region);

    bool isValidLayout(const Region<CellIdx> &region, const std::array<int, 9> &layout);
    void initPossibleLayouts(const Region<CellIdx> &region);

    bool applyCandidates(const Region<CellIdx> &region);
};

} // namespace sudoku
