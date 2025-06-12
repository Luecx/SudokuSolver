#pragma once

#include "../cell.h"
#include "../json/json.h"
#include "../region/EdgeIdx.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleKropki : public RuleHandler {
public:
    explicit RuleKropki(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override { return ""; }

    void init_randomly() override {}

private:
    bool m_all_dots_given = false;

    Region<EdgeIdx> m_white_edges;
    Region<EdgeIdx> m_black_edges;
    Region<EdgeIdx> m_combined_edges;
    Region<EdgeIdx> m_missing_dot_edges;

    bool pos_in_edge(const CellIdx &pos, const EdgeIdx &edge) const;

    bool apply_white_number(Cell &source, Cell &target) const;
    bool apply_black_number(Cell &source, Cell &target) const;
    bool apply_white_candidates(Cell &a, Cell &b) const;
    bool apply_black_candidates(Cell &a, Cell &b) const;

    bool enforce_missing_dots();
    bool remove_forbidden(Cell &a, Cell &b) const;
};

} // namespace sudoku
