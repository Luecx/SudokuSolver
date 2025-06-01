#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

struct ArrowPair {
    Region<CellIdx> base;
    Region<CellIdx> path;
};

/*
    Arrow is now the same implementation as the one in js
    But there is probably a mistake in the js implementation
    and therefore in this one too.
*/
class RuleArrow : public RuleHandler {
public:
    explicit RuleArrow(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    std::vector<ArrowPair> arrow_pairs_;

    bool determine_base_options(ArrowPair &arrow_pair);
    bool determine_path_options(ArrowPair &arrow_pair);

    std::pair<int, int> bounds_base(const Region<CellIdx> &base);
    std::pair<int, int> bounds_path(const Region<CellIdx> &path);
};
} // namespace sudoku
