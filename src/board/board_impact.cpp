#include "board.h"

namespace sudoku {

/**
 * @brief Recomputes the full impact map by resetting and allowing each handler to increment affected cells.
 */
void Board::update_impact_map() {
    impact_map_.reset();

    for (const auto& handler : handlers_) {
        if (handler) {
            handler->update_impact(impact_map_);
        }
    }
}

/**
 * @brief Returns the impact value at the specified cell.
 * @param idx Cell index to query
 * @return Impact score (integer)
 */
int Board::get_impact(const CellIdx& idx) const {
    return impact_map_.get(idx);
}

/**
 * @brief Returns a const reference to the internal impact map.
 * @return Const reference to the ImpactMap object
 */
const ImpactMap& Board::impact_map() const {
    return impact_map_;
}

} // namespace sudoku
