#pragma once

#include "../cell.h"
#include "../number_set.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleArrow : public RuleHandler {
public:
    explicit RuleArrow(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // Hyperparameters
    const int MIN_ARROWS = 3;
    const int MAX_ARROWS = 10;
    const int MIN_PATH_LENGTH = 2;
    const int MAX_PATH_LENGTH = 5;
    const double BASE_SIZE_1_PROBABILITY = 0.6; // 60% chance for size 1
    const double BASE_SIZE_2_PROBABILITY = 0.4; // 40% chance for size 2

    // standard params

    struct ArrowPair {
        Region<CellIdx> base;
        Region<CellIdx> path;
    };

    std::vector<ArrowPair> m_arrow_pairs;

    bool determine_base_options(ArrowPair &arrow_pair);
    bool determine_path_options(ArrowPair &arrow_pair);

    std::pair<int, int> bounds_base(const Region<CellIdx> &base, bool clip = true);
    std::pair<int, int> bounds_path(const Region<CellIdx> &path, int base_size, bool clip = true);

    std::pair<int, int> clamp_bounds(int lb, int ub, int base_size);
};

} // namespace sudoku
