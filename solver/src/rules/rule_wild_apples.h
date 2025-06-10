#pragma once

#include "../cell.h"
#include "../json/json.h"
#include "../region/EdgeIdx.h"
#include "_rule_handler.h"


namespace sudoku {

class RuleWildApples : public RuleHandler {
public:
    explicit RuleWildApples(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    Region<EdgeIdx> m_apple_edges;
    Region<EdgeIdx> m_missing_edges;
    bool apply_apple_number(Cell &source, Cell &target) const;
    bool apply_apple_candidates(Cell &a, Cell &b) const;
    bool enforce_missing_dots();
    bool remove_apple_forbidden(Cell &a, Cell &b) const;
};

} // namespace sudoku
