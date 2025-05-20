#pragma once

#include <vector>
#include <ostream>
#include <functional>  // for std::hash
#include "defs.h"

namespace sudoku {

/**
 * @class Solution
 * @brief Minimal structure to store a completed Sudoku grid.
 *
 * This class holds a solved Sudoku board with only the value information.
 * It is independent from the rule system, candidates, or solving logic.
 * Solutions are suitable for storage, comparison, or result reporting.
 */
class Solution {
public:
    /**
     * @brief Construct a solution with a given board size.
     * @param size Board dimension (e.g., 9 for 9x9).
     */
    explicit Solution(int size) : size_(size), values_(size * size, 0) {}

    /**
     * @brief Set a value in the solution grid.
     * @param r Row index
     * @param c Column index
     * @param value Value to set
     */
    void set(Row r, Col c, Number value) {
        values_[r * size_ + c] = value;
    }

    /**
     * @brief Get a value from the solution grid.
     * @param r Row index
     * @param c Column index
     * @return Stored value
     */
    Number get(Row r, Col c) const {
        return values_[r * size_ + c];
    }

    /**
     * @brief Get board dimension.
     * @return Size (e.g., 9 for 9x9)
     */
    int size() const { return size_; }

    /**
     * @brief Direct access to the flat vector of values.
     * @return Const reference to internal vector
     */
    const std::vector<Number>& raw() const { return values_; }

private:
    int size_;                      ///< Board size
    std::vector<Number> values_;    ///< Flattened board values in row-major order
};

/**
 * @brief Equality operator for comparing two Solution objects.
 * @param a First solution
 * @param b Second solution
 * @return True if size and values are identical
 */
inline bool operator==(const Solution &a, const Solution &b) {
    return a.size() == b.size() && a.raw() == b.raw();
}

/**
 * @brief Stream output operator for Solution.
 *        Prints all values comma-separated in row-major order.
 * @param os Output stream
 * @param sol Solution to print
 * @return Output stream reference
 */
inline std::ostream &operator<<(std::ostream &os, const Solution &sol) {
    const int total = sol.size() * sol.size();
    const auto &values = sol.raw();
    for (int i = 0; i < total; ++i) {
        os << static_cast<int>(values[i]);
        if (i < total - 1)
            os << ",";
    }
    return os;
}

} // namespace sudoku

// Hash specialization for use in unordered_set or unordered_map
namespace std {

/**
 * @brief Hash function for sudoku::Solution for use in unordered containers.
 */
template <>
struct hash<sudoku::Solution> {
    std::size_t operator()(const sudoku::Solution &sol) const {
        std::size_t seed = 0;
        for (sudoku::Number val : sol.raw()) {
            // Hash combine (boost-style)
            seed ^= std::hash<sudoku::Number>{}(val) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
        }
        return seed;
    }
};

} // namespace std
