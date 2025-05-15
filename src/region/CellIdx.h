#pragma once
#include <string>
#include <vector>
#include <sstream>
#include "../defs.h"

namespace sudoku {

struct CellIdx {
    Row r;
    Col c;

    constexpr CellIdx(Row r, Col c) : r(r), c(c) {}

    std::string to_string() const {
        return std::to_string(r) + "," + std::to_string(c);
    }

    bool operator==(const CellIdx& other) const {
        return r == other.r && c == other.c;
    }

    CellIdx copy() const {
        return *this;
    }

    static CellIdx from_string(const std::string& key) {
        std::istringstream ss(key);
        int r, c;
        char sep;
        ss >> r >> sep >> c;
        return CellIdx(r, c);
    }

    std::vector<CellIdx> attached_cells() const {
        return {*this};
    }
};

inline std::ostream& operator<<(std::ostream& os, const CellIdx& idx) {
    return os << idx.to_string();
}

} // namespace sudoku
