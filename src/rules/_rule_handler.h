#pragma once

#include "../region/region.h"
#include "../region/CellIdx.h"
#include "../impact_map.h"

namespace sudoku {
struct RuleHandler {
    virtual bool number_changed(CellIdx pos) = 0;
    virtual bool candidates_changed() = 0;
    virtual bool valid() = 0;
    virtual void update_impact(ImpactMap& impact_map) = 0;
    virtual void from_json(JSON& json) = 0;
};
}


