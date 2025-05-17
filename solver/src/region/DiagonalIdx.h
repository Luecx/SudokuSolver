/**
 * @file DiagonalIdx.h
 * @brief Definition of the DiagonalIdx structure for diagonal regions in a Sudoku grid.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * It defines main and anti-diagonals using a compact index-based representation,
 * with support for enumeration, equality, and JSON deserialization.
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
 * @enum DiagonalType
 * @brief Type of diagonal direction in the Sudoku grid.
 *
 * - MAIN: runs from top-left to bottom-right (like r = c)
 * - ANTI: runs from top-right to bottom-left (like r = -c)
 */
enum class DiagonalType {
    MAIN, ///< Main diagonal (↘ direction)
    ANTI ///< Anti-diagonal (↙ direction)
};

/**
 * @struct DiagonalIdx
 * @brief Represents a shifted main or anti-diagonal in the Sudoku grid.
 *
 * A diagonal is identified by its type (MAIN or ANTI) and an integer index indicating its shift.
 * For a board of size N, valid diagonals may range from index = -(N-1) to index = N-1.
 */
struct DiagonalIdx {
    DiagonalType type; ///< Type of the diagonal (MAIN or ANTI)
    int index; ///< Shift index from the main diagonal

    /**
     * @brief Constructs a DiagonalIdx.
     * @param type Diagonal type (MAIN or ANTI).
     * @param index Shifted index of the diagonal.
     */
    DiagonalIdx(DiagonalType type, int index) : type(type), index(index) {}

    /**
     * @brief Equality operator for comparing two DiagonalIdx instances.
     * @param other Another DiagonalIdx.
     * @return True if both type and index match.
     */
    bool operator==(const DiagonalIdx &other) const { return type == other.type && index == other.index; }

    /**
     * @brief Returns all cells belonging to this diagonal on a given board size.
     *
     * For MAIN diagonals: r = c + index
     * For ANTI diagonals: r = index - c
     *
     * @param board_size The size of the Sudoku grid (typically 9).
     * @return Vector of CellIdx objects on the diagonal.
     */
    std::vector<CellIdx> attached_cells(int board_size) const {
        std::vector<CellIdx> cells;
        if (type == DiagonalType::MAIN) {
            for (int c = 0; c < board_size; ++c) {
                int r = c + index;
                if (r >= 0 && r < board_size)
                    cells.emplace_back(r, c);
            }
        } else {
            for (int c = 0; c < board_size; ++c) {
                int r = index - c;
                if (r >= 0 && r < board_size)
                    cells.emplace_back(r, c);
            }
        }
        return cells;
    }

    /**
     * @brief Parses a DiagonalIdx from a JSON object.
     *
     * Expected format:
     * {
     *   "__type__": "DiagonalIdx",
     *   "type": "main" | "anti",
     *   "index": <integer>
     * }
     *
     * @param node JSON object to parse.
     * @return Parsed DiagonalIdx.
     * @throws std::runtime_error if __type__ is missing or incorrect.
     */
    static DiagonalIdx from_json(JSON &node) {
        const std::string type_tag = node["__type__"].get<std::string>();
        if (type_tag != "DiagonalIdx")
            throw std::runtime_error("Invalid __type__ for DiagonalIdx: expected 'DiagonalIdx', got '" + type_tag +
                                     "'");

        const std::string type_str = node["type"].get<std::string>();
        DiagonalType type = (type_str == "main") ? DiagonalType::MAIN : DiagonalType::ANTI;

        return {type, static_cast<int>(node["index"].get<double>())};
    }

    /**
     * @brief Outputs the DiagonalIdx in the format "main:0" or "anti:-1".
     * @param os Output stream.
     * @param idx The DiagonalIdx to print.
     * @return Reference to the output stream.
     */
    friend std::ostream &operator<<(std::ostream &os, const DiagonalIdx &idx) {
        return os << (idx.type == DiagonalType::MAIN ? "main" : "anti") << ":" << idx.index;
    }
};

} // namespace sudoku
