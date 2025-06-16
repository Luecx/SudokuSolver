/**
 * @file EdgeIdx.h
 * @brief Definition of the EdgeIdx structure used to identify edges between cells in a Sudoku grid.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It defines a normalized edge between two adjacent cells, used for edge-based constraints
 * like consecutive or arithmetic difference rules.
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
 * @struct EdgeIdx
 * @brief Represents an edge between two adjacent cells in the Sudoku grid.
 *
 * The edge connects (r1, c1) to (r2, c2) and is normalized so that:
 * - If (r1 < r2), or (r1 == r2 and c1 <= c2), the order is preserved.
 * - Otherwise, the two points are swapped for consistency.
 */
struct EdgeIdx {
    static constexpr const char *region_type_name = "edges";

    Row r1, r2; ///< Row indices of the two connected cells
    Col c1, c2; ///< Column indices of the two connected cells

    /**
     * @brief Constructs an EdgeIdx and normalizes the order.
     *
     * Ensures (r1, c1) is lexicographically less than or equal to (r2, c2).
     *
     * @param r1_ First cell row.
     * @param c1_ First cell column.
     * @param r2_ Second cell row.
     * @param c2_ Second cell column.
     */
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

    /**
     * @brief Equality operator for comparing two EdgeIdx instances.
     * @param other The other EdgeIdx to compare.
     * @return True if both ends of the edge match.
     */
    bool operator==(const EdgeIdx &other) const {
        return r1 == other.r1 && c1 == other.c1 && r2 == other.r2 && c2 == other.c2;
    }

    /**
     * @brief Returns the two cells that this edge connects.
     *
     * @return A vector of two CellIdx instances.
     */
    std::vector<CellIdx> attached_cells() const { return {CellIdx(r1, c1), CellIdx(r2, c2)}; }

    /**
     * @brief Parses an EdgeIdx from a JSON object.
     *
     * Expected format:
     * {
     *   "__type__": "EdgeIdx",
     *   "r1": <number>, "c1": <number>,
     *   "r2": <number>, "c2": <number>
     * }
     *
     * @param node JSON object to parse.
     * @return Parsed EdgeIdx instance.
     * @throws std::runtime_error if __type__ is missing or incorrect.
     */
    static EdgeIdx from_json(JSON &node) {
        const std::string type_tag = node["__type__"].get<std::string>();
        if (type_tag != "EdgeIdx")
            throw std::runtime_error("Invalid __type__ for EdgeIdx: expected 'EdgeIdx', got '" + type_tag + "'");

        return {static_cast<Row>(node["r1"].get<double>()), static_cast<Col>(node["c1"].get<double>()),
                static_cast<Row>(node["r2"].get<double>()), static_cast<Col>(node["c2"].get<double>())};
    }

    JSON to_json() const {
        JSON node = JSON(JSON::object{});
        node["__type__"] = "EdgeIdx";
        node["r1"] = static_cast<double>(r1);
        node["c1"] = static_cast<double>(c1);
        node["r2"] = static_cast<double>(r2);
        node["c2"] = static_cast<double>(c2);
        return node;
    }

    /**
     * @brief Outputs the EdgeIdx in the format "r1,c1-r2,c2".
     * @param os Output stream.
     * @param idx The EdgeIdx to print.
     * @return Reference to the output stream.
     */
    friend std::ostream &operator<<(std::ostream &os, const EdgeIdx &idx) {
        return os << idx.r1 << "," << idx.c1 << "-" << idx.r2 << "," << idx.c2;
    }
};

} // namespace sudoku
