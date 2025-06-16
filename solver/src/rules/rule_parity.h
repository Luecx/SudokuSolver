#pragma once

#include "../cell.h"
#include "../json/json.h"
#include "_rule_handler.h"

namespace sudoku {

class RuleParity : public RuleHandler {
public:
    explicit RuleParity(Board *board) : RuleHandler(board) {}

    bool number_changed(CellIdx pos) override;
    bool candidates_changed() override;
    bool valid() override;
    void update_impact(ImpactMap &map) override;

    void from_json(JSON &json) override;
    JSON to_json() const override;

    void init_randomly() override;

private:
    // Hyperparameters
    const int MIN_PATH_LENGTH = 2;
    const int MAX_PATH_LENGTH = 5;
    const int MIN_PATHS = 1;
    const int MAX_PATHS = 5;

    // Standard Parameter
    std::vector<Region<CellIdx>> m_paths;

    bool enforceParityAlternation(const Region<CellIdx> &path);
};

} // namespace sudoku
