#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

// NOTE: probably can be made more efficiently
class RuleRenban : public RuleHandler {
public:
    explicit RuleRenban(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override {};
    void from_json(JSON &json) override;

private:
    std::vector<Region<CellIdx>> renban_paths_;
    std::vector<std::vector<int>> ranges_;
    std::vector<int> solved_values_;
    std::vector<int> potential_range_;

    void init_all_consecutive_ranges(int length);
    void init_ranges_including_values(int length, int min_value, int max_value);

    bool enforce_renban(const Region<CellIdx> &path);
};
} // namespace sudoku
