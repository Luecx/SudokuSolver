#pragma once
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include "../defs.h"
#include "CellIdx.h"

namespace sudoku {

struct EdgeIdx {
    Row r1, r2;
    Col c1, c2;

    EdgeIdx(Row r1_, Col c1_, Row r2_, Col c2_) {
        if (r1_ < r2_ || (r1_ == r2_ && c1_ <= c2_)) {
            r1 = r1_;
            c1 = c1_;
            r2 = r2_;
            c2 = c2_;
        } else {
            r1 = r2_;
            c1 = c2_;
            r2 = r1_;
            c2 = c1_;
        }
    }

    std::string to_string() const {
        return std::to_string(r1) + "," + std::to_string(c1) + "-" + std::to_string(r2) + "," + std::to_string(c2);
    }

    bool operator==(const EdgeIdx& other) const {
        return r1 == other.r1 && c1 == other.c1 && r2 == other.r2 && c2 == other.c2;
    }

    EdgeIdx copy() const {
        return *this;
    }

    static EdgeIdx from_string(const std::string& key) {
        int r1, c1, r2, c2;
        char sep1, sep2, sep3;

        std::istringstream ss(key);
        ss >> r1 >> sep1 >> c1 >> sep2 >> r2 >> sep3 >> c2;

        if (sep1 != ',' || sep2 != '-' || sep3 != ',') {
            throw std::invalid_argument("Invalid format for EdgeIdx string: " + key);
        }

        return EdgeIdx(r1, c1, r2, c2);
    }

    std::vector<CellIdx> attached_cells() const {
        return {
            CellIdx(r1, c1),
            CellIdx(r2, c2)
        };
    }
};

inline std::ostream& operator<<(std::ostream& os, const EdgeIdx& idx) {
    return os << idx.to_string();
}

} // namespace sudoku
