#pragma once

#include "../cell.h"
#include "../json/json.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleQuadruple : public RuleHandler {
public:
    explicit RuleQuadruple(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override { };

private:
    struct QuadruplePair {
        Region<CornerIdx> region;
        NumberSet values; 
    };

    // hyperparameters

    // standard parameter
    std::vector<QuadruplePair> m_pairs;    
};

} // namespace sudoku
