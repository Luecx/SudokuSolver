#pragma once

#include "rule_killer.h"


namespace sudoku {

class RuleCustomSum : public RuleKiller {
public:
    explicit RuleCustomSum(Board *board) : RuleKiller(board) { this->name = "Custom-Sum"; }

    void init_randomly() override;

private:
    // hyperparameters
    const int MIN_PAIRS = 1;
    const int MAX_PAIRS = 5;

    const int MIN_PATH_LENGTH = 2;
    const int MAX_PATH_LENGTH = 5;
};
} // namespace sudoku
