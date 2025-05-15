#pragma once
#include <string>
#include <vector>
#include <sstream>
#include "../defs.h"
#include "CellIdx.h"

namespace sudoku {

struct RCIdx {
    Row row;
    Col col;

    RCIdx(Row r, Col c) : row(r), col(c) {}

    std::string to_string() const {
        std::string rs = (row >= 0) ? std::to_string(row) : "x";
        std::string cs = (col >= 0) ? std::to_string(col) : "x";
        return rs + "," + cs;
    }

    bool operator==(const RCIdx& other) const {
        return row == other.row && col == other.col;
    }

    RCIdx copy() const {
        return *this;
    }

    static RCIdx from_string(const std::string& key) {
        std::string rstr, cstr;
        std::istringstream ss(key);
        std::getline(ss, rstr, ',');
        std::getline(ss, cstr);
        int r = (rstr == "x") ? -1 : std::stoi(rstr);
        int c = (cstr == "x") ? -1 : std::stoi(cstr);
        return RCIdx(r, c);
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
};

inline std::ostream& operator<<(std::ostream& os, const RCIdx& idx) {
    return os << idx.to_string();
}


} // namespace sudoku
