#pragma once

#include "../cell.h"
#include "../json/json.h"
#include "../region/EdgeIdx.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleXV : public RuleHandler {
public:
    explicit RuleXV(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // hyperparameters
    const int MIN_X_EDGES = 1;
    const int MAX_X_EDGES = 3;
    const int MIN_V_EDGES = 1;
    const int MAX_V_EDGES = 3;

    // standard parameters
    bool m_all_dots_given = false;

    Region<EdgeIdx> m_x_edges;
    Region<EdgeIdx> m_v_edges;
    Region<EdgeIdx> m_combined_edges;
    Region<EdgeIdx> m_missing_edges;

    // private member functions
    bool enforce_sum(Cell &a, Cell &b, int sum) const;

    bool denforce_missing_symbols() const;
    bool denforce_sum(Cell &a, Cell &b, int sum) const;
};

} // namespace sudoku
