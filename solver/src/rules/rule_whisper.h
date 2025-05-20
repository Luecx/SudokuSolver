#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleWhisper : public RuleHandler {
public:
    explicit RuleWhisper(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    std::vector<Region<CellIdx>> whisper_paths_;

    bool apply_number_contraint(Cell &cell1, Cell &cell2);
    bool apply_candidate_contraint(Cell &cell1, Cell &cell2);
    bool valid_pair(Cell &cell1, Cell &cell2);
};
} // namespace sudoku
