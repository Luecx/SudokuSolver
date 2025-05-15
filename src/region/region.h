#pragma once
#include <vector>
#include <string>
#include <sstream>
#include <stdexcept>
#include <algorithm>
#include "../defs.h"
#include "region_type.h"
#include "region_type_map.h"

namespace sudoku {

template <typename IdxT>
class Region {
public:
    using value_type = IdxT;

    Region() = default;

    RegionType type() const { return region_type_map<IdxT>::value; }
    size_t size() const { return indices_.size(); }
    void clear() { indices_.clear(); }

    void add(const IdxT& idx) {
        if (!has(idx))
            indices_.push_back(idx);
    }

    bool has(const IdxT& idx) const {
        return std::find(indices_.begin(), indices_.end(), idx) != indices_.end();
    }

    Region copy() const {
        Region r;
        r.indices_ = indices_;
        return r;
    }

    Region union_with(const Region& other) const {
        Region result = copy();
        for (const auto& idx : other.indices_) {
            result.add(idx);
        }
        return result;
    }

    Region intersection_with(const Region& other) const {
        Region result;
        for (const auto& idx : indices_) {
            if (other.has(idx))
                result.indices_.push_back(idx);
        }
        return result;
    }

    Region difference_with(const Region& other) const {
        Region result;
        for (const auto& idx : indices_) {
            if (!other.has(idx))
                result.indices_.push_back(idx);
        }
        return result;
    }

    std::vector<CellIdx> attached_cells(int board_size = 9) const {
        std::vector<CellIdx> out;
        for (const auto& idx : indices_) {
            auto cells = call_attached_cells(idx, board_size);
            out.insert(out.end(), cells.begin(), cells.end());
        }
        return out;
    }

    std::string to_string() const {
        std::stringstream ss;
        for (size_t i = 0; i < indices_.size(); ++i) {
            ss << indices_[i].to_string();
            if (i + 1 < indices_.size()) ss << ";";
        }
        return ss.str();
    }

    const std::vector<IdxT>& items() const { return indices_; }

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, const Region<U>& region) {
        os << sudoku::to_string(region.type()) << " { ";
        const auto& items = region.items();
        for (size_t i = 0; i < items.size(); ++i) {
            os << items[i];
            if (i + 1 < items.size())
                os << "; ";
        }
        os << " }";
        return os;
    }

private:
    std::vector<IdxT> indices_;

    // Dispatch for different attached_cells() signatures
    static std::vector<CellIdx> call_attached_cells(const CellIdx& idx, int)           { return idx.attached_cells(); }
    static std::vector<CellIdx> call_attached_cells(const EdgeIdx& idx, int)           { return idx.attached_cells(); }
    static std::vector<CellIdx> call_attached_cells(const CornerIdx& idx, int)         { return idx.attached_cells(); }
    static std::vector<CellIdx> call_attached_cells(const RCIdx& idx, int n)           { return idx.attached_cells(n); }
    static std::vector<CellIdx> call_attached_cells(const DiagonalIdx& idx, int n)     { return idx.attached_cells(n); }
};

} // namespace sudoku
