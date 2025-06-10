#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct ArrowPair {
    Region<CellIdx> base;
    Region<CellIdx> path;
};

class RuleArrow : public RuleHandler {
public:
    explicit RuleArrow(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    std::vector<ArrowPair> m_arrow_pairs;

    bool determine_base_options(ArrowPair &arrow_pair);
    bool determine_path_options(ArrowPair &arrow_pair);

    std::pair<int, int> bounds_base(const Region<CellIdx> &base, bool clip = true);
    std::pair<int, int> bounds_path(const Region<CellIdx> &path, int base_size, bool clip = true);

    std::pair<int, int> clamp_bounds(int lb, int ub, int base_size);
};
} // namespace sudoku
