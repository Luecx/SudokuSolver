#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleKiller : public RuleHandler {
public:
    explicit RuleKiller(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    struct KillerPair {
        Region<CellIdx> region;
        int sum;
    };

    // standard parameters
    bool m_number_can_repeat = false;
    Region<CellIdx> m_remaining_cells;

    // private member function
    bool check_cage(KillerPair &pair);

protected:
    // hyperparameters

    // standard parameter
    std::string name = "Killer";
    std::vector<KillerPair> m_pairs; // used by RuleCustomSum
};
} // namespace sudoku
