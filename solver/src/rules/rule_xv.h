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

private:
    Region<EdgeIdx> x_edges_;
    Region<EdgeIdx> v_edges_;
    Region<EdgeIdx> combined_edges_;
    Region<EdgeIdx> missing_symbol_edges_;
    bool all_symbols_given_ = false;

    bool enforce() const;
    bool enforce_sum(Cell &a, Cell &b, int sum) const;

    bool denforce_missing_symbols() const;
    bool denforce_sum(Cell &a, Cell &b, int sum) const;
};

} // namespace sudoku
