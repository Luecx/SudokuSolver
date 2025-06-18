/**
 * @file CornerIdx.h
 * @brief Definition of the CornerIdx structure used to identify corner points in a Sudoku grid.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It defines a corner located at the top-left of a specific cell (r, c), corresponding to
 * the intersection of four adjacent cells in the grid.
 *
 * @date 2025-05-16
 * @author Finn Eggers
 */

#pragma once

#include <string>
#include <vector>

#include "../defs.h"
#include "../json/json.h"
#include "CellIdx.h"

namespace sudoku {

/**
 * @struct CornerIdx
 * @brief Represents a corner point located at the top-left of cell (r, c).
 *
 * A corner is a virtual point shared by four adjacent cells:
 * - (r - 1, c - 1)
 * - (r - 1, c)
 * - (r,     c - 1)
 * - (r,     c)
 *
 * This structure identifies that corner using grid coordinates (r, c),
 * interpreted as the bottom-right of the corner.
 */
struct CornerIdx {
    static constexpr const char *region_type_name = "corners";

    Row r; ///< Row index of the bottom-right cell sharing the corner
    Col c; ///< Column index of the bottom-right cell sharing the corner

    /**
     * @brief Constructs a CornerIdx at the top-left of cell (r, c).
     * @param r Row index.
     * @param c Column index.
     */
    constexpr CornerIdx(Row r, Col c) : r(r), c(c) {}

    /**
     * @brief Equality operator for comparing two CornerIdx instances.
     * @param other The other CornerIdx to compare.
     * @return True if both row and column match.
     */
    bool operator==(const CornerIdx &other) const { return r == other.r && c == other.c; }

    /**
     * @brief Returns the four cells that share this corner point.
     *
     * These cells surround the corner located at (r, c) in the top-left sense.
     *
     * @return A vector of four CellIdx instances.
     */
    std::vector<CellIdx> attached_cells(int board_size) const {
        std::vector<CellIdx> cells;
        if (r < board_size && c < board_size)
            cells.emplace_back(r, c);
        if (r > 0 && c < board_size)
            cells.emplace_back(r - 1, c);
        if (c > 0 && r < board_size)
            cells.emplace_back(r, c - 1);
        if (r > 0 && c > 0)
            cells.emplace_back(r - 1, c - 1);
        return cells;
    }

    /**
     * @brief Parses a CornerIdx from a JSON object.
     *
     * Expected format:
     * {
     *   "__type__": "CornerIdx",
     *   "r": <number>,
     *   "c": <number>
     * }
     *
     * @param node JSON object to parse.
     * @return Parsed CornerIdx instance.
     * @throws std::runtime_error if __type__ is missing or incorrect.
     */
    static CornerIdx from_json(JSON &node) {
        const std::string type_tag = node["__type__"].get<std::string>();
        if (type_tag != "CornerIdx")
            throw std::runtime_error("Invalid __type__ for CornerIdx: expected 'CornerIdx', got '" + type_tag + "'");

        return {static_cast<Row>(node["r"].get<double>()), static_cast<Col>(node["c"].get<double>())};
    }

    JSON to_json() const {
        JSON node = JSON(JSON::object{});
        node["__type__"] = "CornerIdx";
        node["r"] = static_cast<double>(r);
        node["c"] = static_cast<double>(c);
        return node;
    }

    /**
     * @brief Outputs the CornerIdx to a stream in "r,c" format.
     *
     * @param os Output stream.
     * @param idx The CornerIdx to print.
     * @return Reference to the output stream.
     */
    friend std::ostream &operator<<(std::ostream &os, const CornerIdx &idx) { return os << idx.r << "," << idx.c; }
};

} // namespace sudoku
