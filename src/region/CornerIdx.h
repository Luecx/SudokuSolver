#pragma once
#include <string>
#include <vector>
#include "../defs.h"
#include "CellIdx.h"

namespace sudoku {

struct CornerIdx {
    Row r;
    Col c;

    constexpr CornerIdx(Row r, Col c) : r(r), c(c) {}

    std::string to_string() const {
        return std::to_string(r) + "," + std::to_string(c);
    }

    bool operator==(const CornerIdx& other) const {
        return r == other.r && c == other.c;
    }

    CornerIdx copy() const {
        return *this;
    }

    static CornerIdx from_string(const std::string& key) {
        int r, c;
        char sep;
        std::istringstream ss(key);
        ss >> r >> sep >> c;
        return CornerIdx(r, c);
    }

    std::vector<CellIdx> attached_cells() const {
        return {
            CellIdx(r, c),
            CellIdx(r + 1, c),
            CellIdx(r, c + 1),
            CellIdx(r + 1, c + 1)
        };
    }
};

inline std::ostream& operator<<(std::ostream& os, const CornerIdx& idx) {
    return os << idx.to_string();
}

} // namespace sudoku
