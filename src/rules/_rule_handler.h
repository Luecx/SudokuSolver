#pragma once

#include "../defs.h"
#include "../impact_map.h"
#include "../region/CellIdx.h"
#include "../region/region.h"

namespace sudoku {
struct RuleHandler {
    RuleHandler(Board *board) : board_(board) {}
    virtual ~RuleHandler() = default;

    virtual bool number_changed(CellIdx pos) = 0;
    virtual bool candidates_changed() = 0;
    virtual bool valid() = 0;
    virtual void update_impact(ImpactMap &impact_map) = 0;
    virtual void from_json(JSON &json) = 0;

protected:
    Board *board_ = nullptr;
};
} // namespace sudoku
