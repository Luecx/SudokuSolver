#pragma once

#include "_rule_handler.h"
#include "../region/EdgeIdx.h"
#include "../json/json.h"
#include "../cell.h"

namespace sudoku {

class RuleKropki : public RuleHandler {
public:
    explicit RuleKropki(Board* board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap& impact_map) override;
    void from_json(JSON& json) override;

private:
    Region<EdgeIdx> white_edges_;
    Region<EdgeIdx> black_edges_;
    Region<EdgeIdx> combined_edges_;
    Region<EdgeIdx> missing_dot_edges_;
    bool all_dots_given_ = false;

    bool apply_white_number(Cell& source, Cell& target) const;
    bool apply_black_number(Cell& source, Cell& target) const;
    bool apply_white_candidates(Cell& a, Cell& b) const;
    bool apply_black_candidates(Cell& a, Cell& b) const;
    bool enforce_missing_dots();
    bool remove_forbidden(Cell& a, Cell& b) const;
};

} // namespace sudoku
