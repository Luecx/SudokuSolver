#pragma once

#include <string>
#include <vector>

#include "../defs.h"
#include "../json.h"
#include "CellIdx.h"

namespace sudoku {

struct EdgeIdx {
    Row r1, r2;
    Col c1, c2;

    EdgeIdx(const Row r1_, const Col c1_, const Row r2_, const Col c2_) {
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

    bool operator==(const EdgeIdx& other) const {
        return r1 == other.r1 && c1 == other.c1 &&
               r2 == other.r2 && c2 == other.c2;
    }

    std::vector<CellIdx> attached_cells() const {
        return {
            CellIdx(r1, c1),
            CellIdx(r2, c2)
        };
    }

    static EdgeIdx from_json(JSON& node) {
        return {
            static_cast<Row>(node["r1"].get<double>()),
            static_cast<Col>(node["c1"].get<double>()),
            static_cast<Row>(node["r2"].get<double>()),
            static_cast<Col>(node["c2"].get<double>())
        };
    }


    friend std::ostream& operator<<(std::ostream& os, const EdgeIdx& idx) {
        return os << idx.r1 << "," << idx.c1 << "-" << idx.r2 << "," << idx.c2;
    }
};

} // namespace sudoku
