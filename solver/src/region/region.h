/**
 * @file Region.h
 * @brief Definition of the Region class template for holding index-based constraint regions.
 *
 * This file is part of the SudokuSolver project, developed for the Sudoku Website.
 * The Region class wraps collections of index objects (e.g. CellIdx, EdgeIdx) and
 * provides utilities for set operations, JSON parsing, and cell expansion.
 *
 * @date 2025-05-16
 * @author Finn Eggers
 */

#pragma once

#include <algorithm>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include "../defs.h"
#include "../json/json.h"
#include "CellIdx.h"
#include "CornerIdx.h"
#include "DiagonalIdx.h"
#include "EdgeIdx.h"
#include "RCIdx.h"
#include "ORCIdx.h"

namespace sudoku {

/**
 * @class Region
 * @brief Represents a typed collection of index objects (CellIdx, EdgeIdx, etc.).
 *
 * Provides set-like behavior, JSON parsing, and conversion to covered cells.
 *
 * @tparam IdxT Type of index (e.g., CellIdx, EdgeIdx, etc.).
 */
template<typename IdxT>
class Region {
public:
    using value_type = IdxT;

    /**
     * @brief Default constructor.
     */
    Region() = default;

    /**
     * @brief Returns the number of indices in the region.
     * @return Number of elements.
     */
    size_t size() const { return items_.size(); }

    /**
     * @brief Clears the region.
     */
    void clear() { items_.clear(); }

    /**
     * @brief Adds an index to the region if not already present.
     * @param idx The index to add.
     */
    void add(const IdxT &idx) {
        if (!has(idx))
            items_.push_back(idx);
    }

    /**
     * @brief Checks if a given index exists in the region.
     * @param idx The index to search for.
     * @return True if present.
     */
    bool has(const IdxT &idx) const { return find_index(idx) != -1; }

    /**
     * @brief Finds the index of a given element in the region.
     * @param idx The index to search for.
     * @return Index of the element, or -1 if not found.
     */
    int find_index(const IdxT &idx) const {
        auto it = std::find(items_.begin(), items_.end(), idx);
        if (it != items_.end())
            return static_cast<int>(std::distance(items_.begin(), it));
        else
            return -1;
    }

    /**
     * @brief Returns a new region that is the union of this and another.
     * @param other The other region.
     * @return Resulting union region.
     */
    Region operator|(const Region &other) const {
        Region result = *this;
        for (const auto &idx: other.items_) {
            result.add(idx);
        }
        return result;
    }

    /**
     * @brief Returns a new region that is the intersection of this and another.
     * @param other The other region.
     * @return Resulting intersection region.
     */
    Region operator&(const Region &other) const {
        Region result;
        for (const auto &idx: items_) {
            if (other.has(idx))
                result.items_.push_back(idx);
        }
        return result;
    }

    /**
     * @brief Returns a new region with elements from this but not in the other.
     * @param other The other region.
     * @return Resulting difference region.
     */
    Region operator-(const Region &other) const {
        Region result;
        for (const auto &idx: items_) {
            if (!other.has(idx))
                result.items_.push_back(idx);
        }
        return result;
    }

    /**
     * @brief Returns all cells covered by the region.
     * @param board_size Size of the Sudoku board (default: 9).
     * @return Vector of covered CellIdx entries.
     */
    Region<CellIdx> attached_cells(int board_size = 9) const {
        std::vector<CellIdx> out;
        for (const auto &idx: items_) {
            auto cells = call_attached_cells(idx, board_size);
            out.insert(out.end(), cells.begin(), cells.end());
        }
        Region<CellIdx> res;

        for (CellIdx cidx: out)
            res.add(cidx);
        return res;
    }

    /**
     * @brief Serializes the region to a string (semicolon-separated).
     * @return String representation.
     */
    std::string to_string() const {
        std::stringstream ss;
        for (size_t i = 0; i < items_.size(); ++i) {
            ss << items_[i].to_string();
            if (i + 1 < items_.size())
                ss << ";";
        }
        return ss.str();
    }

    /**
     * @brief Returns an iterator to the first element in the region.
     * @return Iterator to the beginning.
     */
    typename std::vector<IdxT>::const_iterator begin() const { return items_.begin(); }

    /**
     * @brief Returns an iterator to the element following the last element in the region.
     * @return Iterator to the end.
     */
    typename std::vector<IdxT>::const_iterator end() const { return items_.end(); }

    /**
     * @brief Returns a mutable iterator to the first element in the region.
     * @return Mutable iterator to the beginning.
     */
    typename std::vector<IdxT>::iterator begin() { return items_.begin(); }

    /**
     * @brief Returns a mutable iterator to the element following the last element in the region.
     * @return Mutable iterator to the end.
     */
    typename std::vector<IdxT>::iterator end() { return items_.end(); }

    /**
     * @brief Returns reference to the contained items.
     * @return Const reference to vector of index elements.
     */
    const std::vector<IdxT> &items() const { return items_; }

    std::vector<IdxT> &items() { return items_; }

    /**
     * @brief Parses a Region from JSON, validating type information.
     *
     * Expected format:
     * {
     *   "__type__": "Region",
     *   "type": "<IdxT::region_type_name>",
     *   "items": [ { "__type__": ..., ... }, ... ]
     * }
     *
     * @param node JSON node.
     * @return Parsed Region.
     * @throws std::runtime_error on validation failure.
     */
    static Region from_json(const JSON &node) {
        // check if its null
        if (node.is_null()) {
            return Region{};
        }

        if (!node.is_object())
            throw std::runtime_error("Region must be a JSON object");

        const std::string region_type_tag = node["__type__"].get<std::string>();
        if (region_type_tag != "Region")
            throw std::runtime_error("Invalid region tag: expected '__type__' == 'Region'");

        Region out;
        const auto &items = node["items"].get<JSON::array>();
        for (const auto &item: items) {
            if (!item.is_object())
                throw std::runtime_error("Region item must be object");

            const std::string inner_type = item["__type__"].get<std::string>();
            out.add(IdxT::from_json(const_cast<JSON &>(item))); // const_cast OK for interface
        }
        return out;
    }

    static Region all(const int board_size) {
        Region<IdxT> all_;

        for (Row r = 0; r < board_size; ++r)
            for (Col c = 0; c < board_size; ++c) {
                if constexpr (std::is_same_v<IdxT, EdgeIdx>) {
                    if (r + 1 < board_size)
                        all_.add(IdxT(r, c, r + 1, c));
                    if (c + 1 < board_size)
                        all_.add(IdxT(r, c, r, c + 1));
                } else if constexpr (std::is_same_v<IdxT, CornerIdx>) {
                    all_.add(IdxT(r, c));
                    all_.add(IdxT(r + 1, c));
                    all_.add(IdxT(r, c + 1));
                    all_.add(IdxT(r + 1, c + 1));
                } else if constexpr (std::is_same_v<IdxT, CellIdx>) {
                    all_.add(IdxT(r, c));
                } else {
                    throw std::runtime_error("Unsupported index type for Region");
                }
            }


        return all_;
    }


private:
    std::vector<IdxT> items_;

    // Dispatch for different attached_cells() signatures
    static std::vector<CellIdx> call_attached_cells(const CellIdx &idx, int) { return idx.attached_cells(); }
    static std::vector<CellIdx> call_attached_cells(const EdgeIdx &idx, int) { return idx.attached_cells(); }
    static std::vector<CellIdx> call_attached_cells(const CornerIdx &idx, int) { return idx.attached_cells(); }
    static std::vector<CellIdx> call_attached_cells(const RCIdx &idx, int n) { return idx.attached_cells(n); }
    static std::vector<CellIdx> call_attached_cells(const DiagonalIdx &idx, int n) { return idx.attached_cells(n); }
    static std::vector<CellIdx> call_attached_cells(const ORCIdx &idx, int n) { return idx.attached_cells(n); }
};

/**
 * @brief Stream output in the form "type { a; b; c }"
 */
template<typename U>
inline std::ostream &operator<<(std::ostream &os, const Region<U> &region) {
    os << " { ";
    const auto &items = region.items();
    for (size_t i = 0; i < items.size(); ++i) {
        os << items[i];
        if (i + 1 < items.size())
            os << "; ";
    }
    os << " }";
    return os;
}

} // namespace sudoku
