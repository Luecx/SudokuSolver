// RegionType.h
#pragma once
#include <string>

namespace sudoku {

enum RegionType : int {
    REGION_NONE = 0,
    REGION_CELLS,
    REGION_EDGES,
    REGION_CORNERS,
    REGION_ROWCOL,
    REGION_DIAGONAL
};

inline std::string to_string(RegionType type) {
    switch (type) {
        case REGION_CELLS: return "cells";
        case REGION_EDGES: return "edges";
        case REGION_CORNERS: return "corners";
        case REGION_ROWCOL: return "rowcol";
        case REGION_DIAGONAL: return "diagonal";
        default: return "none";
    }
}

inline RegionType region_type_from_string(const std::string& s) {
    if (s == "cells") return REGION_CELLS;
    if (s == "edges") return REGION_EDGES;
    if (s == "corners") return REGION_CORNERS;
    if (s == "rowcol") return REGION_ROWCOL;
    if (s == "diagonal") return REGION_DIAGONAL;
    return REGION_NONE;
}

} // namespace sudoku
