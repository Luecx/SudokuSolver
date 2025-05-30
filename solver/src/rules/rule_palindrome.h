#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RulePalindrome : public RuleHandler {
public:
    explicit RulePalindrome(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;
    void from_json(JSON &json) override;

private:
    std::vector<Region<CellIdx>> palindrome_paths_;

    bool enforce_symmetry(Cell &a, Cell &b);
};
} // namespace sudoku
