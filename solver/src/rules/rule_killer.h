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

    void init_randomly() override {}

private:
    struct KillerPair {
        Region<CellIdx> region;
        int sum;
    };

    bool m_number_can_repeat = false;

    std::vector<KillerPair> m_cage_pair;
    Region<CellIdx> m_remaining_cells;

    bool check_cage(KillerPair &pair);
};
} // namespace sudoku
