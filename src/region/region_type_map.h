// region_type_map.h

#pragma once

#include "region_type.h"
#include "CellIdx.h"
#include "EdgeIdx.h"
#include "CornerIdx.h"
#include "RCIdx.h"
#include "DiagonalIdx.h"

namespace sudoku {

template <typename T>
struct region_type_map; // forward declaration

// Specializations

template <>
struct region_type_map<CellIdx> {
  static constexpr RegionType value = REGION_CELLS;
  static constexpr const char* str = "cells";
  static constexpr const char* item_str = "CellIdx";
};

template <>
struct region_type_map<EdgeIdx> {
  static constexpr RegionType value = REGION_EDGES;
  static constexpr const char* str = "edges";
  static constexpr const char* item_str = "EdgeIdx";
};

template <>
struct region_type_map<CornerIdx> {
  static constexpr RegionType value = REGION_CORNERS;
  static constexpr const char* str = "corners";
  static constexpr const char* item_str = "CornerIdx";
};

template <>
struct region_type_map<RCIdx> {
  static constexpr RegionType value = REGION_ROWCOL;
  static constexpr const char* str = "rowcol";
  static constexpr const char* item_str = "RCIdx";
};

template <>
struct region_type_map<DiagonalIdx> {
  static constexpr RegionType value = REGION_DIAGONAL;
  static constexpr const char* str = "diagonal";
  static constexpr const char* item_str = "DiagonalIdx";
};

} // namespace sudoku
