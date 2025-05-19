/**
 * @file RCIdx.h
 * @brief Definition of the RCIdx structure for identifying rows or columns in the Sudoku grid.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It provides a compact representation of either:
 * - a full row (row ≥ 0, col < 0)
 * - or a full column (col ≥ 0, row < 0)
 *
 * Any other configuration is invalid and triggers an exception.
 *
 * @date 2025-05-16
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
 * @struct RCIdx
 * @brief Represents either a full row or full column in the Sudoku grid.
 *
 * Valid configurations:
 * - (row ≥ 0, col < 0): full row
 * - (col ≥ 0, row < 0): full column
 *
 * All other configurations are invalid and will throw.
 */
struct RCIdx {
    Row row; ///< Row index (≥ 0 for rows, < 0 if unused)
    Col col; ///< Column index (≥ 0 for columns, < 0 if unused)

    /**
     * @brief Constructs an RCIdx for a row or column.
     * @param r Row index (set to -1 if unused).
     * @param c Column index (set to -1 if unused).
     * @throws std::runtime_error if both are set or both are unset.
     */
    RCIdx(Row r, Col c) : row(r), col(c) {
        if (!((row >= 0 && col < 0) || (col >= 0 && row < 0))) {
            throw std::runtime_error("RCIdx must refer to exactly one of row or column");
        }
    }

    /**
     * @brief Equality operator.
     * @param other The RCIdx to compare.
     * @return True if both row and column match.
     */
    bool operator==(const RCIdx &other) const { return row == other.row && col == other.col; }

    /**
     * @brief Checks if this RCIdx refers to a full row.
     * @return True if col < 0 and row is valid.
     */
    bool is_row() const { return row >= 0; }

    /**
     * @brief Checks if this RCIdx refers to a full column.
     * @return True if row < 0 and col is valid.
     */
    bool is_col() const { return col >= 0; }

    /**
     * @brief Returns the cells of the referenced row or column.
     *
     * @param board_size The size of the board (typically 9).
     * @return Vector of CellIdx entries along the row or column.
     */
    std::vector<CellIdx> attached_cells(int board_size) const {
        std::vector<CellIdx> result;
        if (is_row()) {
            for (int j = 0; j < board_size; ++j)
                result.emplace_back(row, j);
        } else {
            for (int i = 0; i < board_size; ++i)
                result.emplace_back(i, col);
        }
        return result;
    }

    /**
     * @brief Parses an RCIdx from a JSON object.
     *
     * Expected format:
     * {
     *   "__type__": "RCIdx",
     *   "row": <number>,
     *   "col": <number>
     * }
     *
     * One of row or col must be ≥ 0, the other < 0.
     *
     * @param node JSON object to parse.
     * @return Parsed RCIdx.
     * @throws std::runtime_error if configuration is invalid or __type__ is wrong.
     */
    static RCIdx from_json(JSON &node) {
        const std::string type_tag = node["__type__"].get<std::string>();
        if (type_tag != "RCIdx")
            throw std::runtime_error("Invalid __type__ for RCIdx: expected 'RCIdx', got '" + type_tag + "'");

        Row r = -1;
        Col c = -1;

        if (!node["row"].is_null())
            r = static_cast<Row>(node["row"].get<double>());
        if (!node["col"].is_null())
            c = static_cast<Col>(node["col"].get<double>());

        return RCIdx(r, c);
    }

    /**
     * @brief Outputs the RCIdx in the format "r,x" for rows or "x,c" for columns.
     *
     * @param os Output stream.
     * @param idx The RCIdx to print.
     * @return Reference to the output stream.
     */
    friend std::ostream &operator<<(std::ostream &os, const RCIdx &idx) {
        if (idx.row >= 0)
            os << idx.row;
        else
            os << 'x';
        os << ',';
        if (idx.col >= 0)
            os << idx.col;
        else
            os << 'x';
        return os;
    }
};

} // namespace sudoku
