#pragma once

#include "../cell.h"
#include "../json/json.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleThermo : public RuleHandler {
public:
    explicit RuleThermo(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override { return ""; }

    void init_randomly() override {}

private:
    std::vector<Region<CellIdx>> m_paths;
};

} // namespace sudoku
