/**
 * @file ORCIdx.h
 * @brief Definition of the ORCIdx structure for identifying rows or columns with orientation.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It represents either:
 * - an oriented row (row ≥ 0, col < 0) or
 * - an oriented column (col ≥ 0, row < 0),
 * with an additional `reversed` flag indicating direction.
 *
 * @date 2025-06-08
 * @author Finn Eggers
 */

#pragma once

#include <stdexcept>
#include <string>
#include <vector>
#include "../defs.h"
#include "../json/json.h"
#include "CellIdx.h"

namespace sudoku {

/**
 * @struct ORCIdx
 * @brief Represents either a full row or full column in the grid, with a direction.
 *
 * Valid configurations:
 * - (row ≥ 0, col < 0): a row, direction left-to-right (reversed = false) or right-to-left (reversed = true)
 * - (col ≥ 0, row < 0): a column, direction top-down (reversed = false) or bottom-up (reversed = true)
 *
 * All other configurations are invalid and will throw.
 */
struct ORCIdx {
    Row row;       ///< Row index (≥ 0 for row, < 0 otherwise)
    Col col;       ///< Column index (≥ 0 for column, < 0 otherwise)
    bool reversed; ///< Direction of the row or column

    ORCIdx(Row r, Col c, bool rev) : row(r), col(c), reversed(rev) {
        if (!((row >= 0 && col < 0) || (col >= 0 && row < 0))) {
            throw std::runtime_error("ORCIdx must refer to exactly one of row or column");
        }
    }

    bool operator==(const ORCIdx &other) const {
        return row == other.row && col == other.col && reversed == other.reversed;
    }

    bool is_row() const { return row >= 0; }
    bool is_col() const { return col >= 0; }

    std::vector<CellIdx> attached_cells(int board_size) const {
        std::vector<CellIdx> result;
        if (is_row()) {
            for (int j = 0; j < board_size; ++j) {
                int index = reversed ? (board_size - 1 - j) : j;
                result.emplace_back(row, index);
            }
        } else {
            for (int i = 0; i < board_size; ++i) {
                int index = reversed ? (board_size - 1 - i) : i;
                result.emplace_back(index, col);
            }
        }
        return result;
    }

    static ORCIdx from_json(JSON &node) {
        const std::string type_tag = node["__type__"].get<std::string>();
        if (type_tag != "ORCIdx")
            throw std::runtime_error("Invalid __type__ for ORCIdx: expected 'ORCIdx', got '" + type_tag + "'");

        Row r = -1;
        Col c = -1;
        bool rev = false;

        if (!node["row"].is_null())
            r = static_cast<Row>(node["row"].get<double>());
        if (!node["col"].is_null())
            c = static_cast<Col>(node["col"].get<double>());
        if (!node["reversed"].is_null())
            rev = node["reversed"].get<bool>();

        return ORCIdx(r, c, rev);
    }

    friend std::ostream &operator<<(std::ostream &os, const ORCIdx &idx) {
        if (idx.row >= 0)
            os << idx.row;
        else
            os << 'x';
        os << ',';
        if (idx.col >= 0)
            os << idx.col;
        else
            os << 'x';
        os << (idx.reversed ? " (rev)" : "");
        return os;
    }
};

} // namespace sudoku
