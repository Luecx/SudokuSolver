#pragma once
#include <string>
#include <vector>
#include <sstream>
#include "../defs.h"
#include "../json.h"

namespace sudoku {

struct CellIdx {
    Row r;
    Col c;

    constexpr CellIdx(const Row r, const Col c) : r(r), c(c) {}

    bool operator==(const CellIdx& other) const {
        return r == other.r && c == other.c;
    }

    std::vector<CellIdx> attached_cells() const {
        return {*this};
    }

    static CellIdx from_json(JSON& node) {
        return {
            static_cast<Row>(node["r"].get<double>()),
            static_cast<Col>(node["c"].get<double>())};
    }

    friend std::ostream& operator<<(std::ostream& os, const CellIdx& idx) {
        return os << std::to_string(idx.r) + "," + std::to_string(idx.c);;
    }
};

} // namespace sudoku
