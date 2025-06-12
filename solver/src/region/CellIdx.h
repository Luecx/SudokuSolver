/**
 * @file CellIdx.h
 * @brief Definition of the CellIdx structure used to identify Sudoku grid cells.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It provides a lightweight representation of individual cells within the Sudoku grid,
 * including JSON deserialization and stream output.
 *
 * @date 2025-05-16
 * @author Finn Eggers
 */

#pragma once

#include <sstream>
#include <string>
#include <vector>
#include "../defs.h"
#include "../json/json.h"

namespace sudoku {

/**
 * @struct CellIdx
 * @brief Represents a unique cell in the Sudoku grid using row and column indices.
 *
 * Provides basic comparison, stream output, and JSON parsing.
 */
struct CellIdx {
    static constexpr const char *region_type_name = "cells";

    Row r; ///< Zero-based row index
    Col c; ///< Zero-based column index

    /**
     * @brief Constructs a CellIdx from given row and column.
     * @param r Row index.
     * @param c Column index.
     */
    constexpr CellIdx(Row r, Col c) : r(r), c(c) {}

    /**
     * @brief Equality operator for comparing two CellIdx instances.
     * @param other The other CellIdx to compare against.
     * @return True if both row and column match; otherwise, false.
     */
    bool operator==(const CellIdx &other) const { return r == other.r && c == other.c; }

    /**
     * @brief Returns this cell wrapped in a single-element vector.
     *
     * Useful for treating individual cells in algorithms expecting a list.
     *
     * @return A vector containing only this CellIdx.
     */
    std::vector<CellIdx> attached_cells() const { return {*this}; }

    /**
     * @brief Parses a CellIdx from a JSON object.
     *
     * The JSON must have the form:
     * {
     *   "__type__": "CellIdx",
     *   "r": <number>,
     *   "c": <number>
     * }
     *
     * @param node The JSON object representing the cell.
     * @return A parsed CellIdx instance.
     * @throws std::runtime_error if __type__ is missing or incorrect.
     */
    static CellIdx from_json(JSON &node) {
        const std::string type_tag = node["__type__"].get<std::string>();
        if (type_tag != "CellIdx")
            throw std::runtime_error("Invalid __type__ for CellIdx: expected 'CellIdx', got '" + type_tag + "'");

        return {static_cast<Row>(node["r"].get<double>()), static_cast<Col>(node["c"].get<double>())};
    }

    JSON to_json() const {
        JSON node = JSON(JSON::object{});
        node["__type__"] = "CellIdx";
        node["r"] = static_cast<double>(r);
        node["c"] = static_cast<double>(c);
        return node;
    }

    /**
     * @brief Outputs the CellIdx to a stream in "r,c" format.
     *
     * @param os Output stream.
     * @param idx The CellIdx to print.
     * @return Reference to the output stream.
     */
    friend std::ostream &operator<<(std::ostream &os, const CellIdx &idx) {
        return os << std::to_string(idx.r) + "," + std::to_string(idx.c);
    }
};

} // namespace sudoku
