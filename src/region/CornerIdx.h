#pragma once
#include <string>
#include <vector>
#include "../defs.h"
#include "CellIdx.h"
#include "../json.h"

namespace sudoku {

struct CornerIdx {
    Row r;
    Col c;

    constexpr CornerIdx(Row r, Col c) : r(r), c(c) {}

    bool operator==(const CornerIdx& other) const {
        return r == other.r && c == other.c;
    }

    std::vector<CellIdx> attached_cells() const {
        return {
            CellIdx(r, c),
            CellIdx(r + 1, c),
            CellIdx(r, c + 1),
            CellIdx(r + 1, c + 1)
        };
    }

    static CornerIdx from_json(JSON& node) {
        return {
            static_cast<Row>(node["r"].get<double>()),
            static_cast<Col>(node["c"].get<double>())
        };
    }


    friend std::ostream& operator<<(std::ostream& os, const CornerIdx& idx) {
        return os << idx.r << "," << idx.c;
    }
};

} // namespace sudoku
