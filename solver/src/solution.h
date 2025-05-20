#pragma once

#include <vector>
#include <ostream>
#include "defs.h"

namespace sudoku {

/**
 * @class Solution
 * @brief Minimal structure to store a completed Sudoku grid.
 *
 * This class holds a solved Sudoku board with only the value information.
 * It is independent from the rule system, candidates, or solving logic.
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
    int size_;
    std::vector<Number> values_;
};

/**
 * @brief Stream output operator for Solution.
 *        Prints all values comma-separated in row-major order.
 */
inline std::ostream &operator<<(std::ostream &os, const Solution &sol) {
    const int total = sol.size() * sol.size();
    const auto &values = sol.raw();
    for (int i = 0; i < total; ++i) {
        os << (int)values[i];
        if (i < total - 1)
            os << ",";
    }
    return os;
}

} // namespace sudoku
