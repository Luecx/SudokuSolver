#pragma once

#include <string>
#include <vector>

#include "../defs.h"
#include "../json.h"
#include "CellIdx.h"

namespace sudoku {

struct RCIdx {
    Row row;
    Col col;

    RCIdx(Row r, Col c) : row(r), col(c) {}

    bool operator==(const RCIdx& other) const {
        return row == other.row && col == other.col;
    }

    bool is_row() const {
        return row >= 0 && col < 0;
    }

    bool is_col() const {
        return col >= 0 && row < 0;
    }

    std::vector<CellIdx> attached_cells(int board_size) const {
        std::vector<CellIdx> result;
        if (row >= 0 && col >= 0) {
            result.emplace_back(row, col);
        } else if (is_row()) {
            for (int j = 0; j < board_size; ++j)
                result.emplace_back(row, j);
        } else if (is_col()) {
            for (int i = 0; i < board_size; ++i)
                result.emplace_back(i, col);
        } else {
            for (int i = 0; i < board_size; ++i)
                for (int j = 0; j < board_size; ++j)
                    result.emplace_back(i, j);
        }
        return result;
    }

    static RCIdx from_json(JSON& node) {
        return {
            static_cast<Row>(node["row"].get<double>()),
            static_cast<Col>(node["col"].get<double>())
        };
    }


    friend std::ostream& operator<<(std::ostream& os, const RCIdx& idx) {
        if (idx.row >= 0) os << idx.row; else os << 'x';
        os << ',';
        if (idx.col >= 0) os << idx.col; else os << 'x';
        return os;
    }
};

} // namespace sudoku
