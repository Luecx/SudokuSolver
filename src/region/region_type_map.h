#pragma once
#include "region_type.h"
#include "CellIdx.h"
#include "EdgeIdx.h"
#include "CornerIdx.h"
#include "RCIdx.h"
#include "DiagonalIdx.h"

namespace sudoku {

template <typename T> struct region_type_map;

template <> struct region_type_map<CellIdx>     { static constexpr RegionType value = REGION_CELLS; };
template <> struct region_type_map<EdgeIdx>     { static constexpr RegionType value = REGION_EDGES; };
template <> struct region_type_map<CornerIdx>   { static constexpr RegionType value = REGION_CORNERS; };
template <> struct region_type_map<RCIdx>       { static constexpr RegionType value = REGION_ROWCOL; };
template <> struct region_type_map<DiagonalIdx> { static constexpr RegionType value = REGION_DIAGONAL; };

} // namespace sudoku
