#pragma once

#include "../region/region.h"

struct RuleHandler {
    bool number_changed();
    bool candidates_changed();
    bool valid();
};

