#pragma once
#include <string>
#include <vector>
#include "../defs.h"
#include "CellIdx.h"

namespace sudoku {

enum class DiagonalType { MAIN, ANTI };

struct DiagonalIdx {
    DiagonalType type;
    int index;

    DiagonalIdx(DiagonalType type, int index) : type(type), index(index) {}

    std::string to_string() const {
        std::string t = type == DiagonalType::MAIN ? "main" : "anti";
        return t + ":" + std::to_string(index);
    }

    bool operator==(const DiagonalIdx& other) const {
        return type == other.type && index == other.index;
    }

    DiagonalIdx copy() const {
        return *this;
    }

    static DiagonalIdx from_string(const std::string& key) {
        auto sep = key.find(':');
        std::string type_str = key.substr(0, sep);
        int idx = std::stoi(key.substr(sep + 1));
        return DiagonalIdx(type_str == "main" ? DiagonalType::MAIN : DiagonalType::ANTI, idx);
    }

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
};

inline std::ostream& operator<<(std::ostream& os, const DiagonalIdx& idx) {
    return os << idx.to_string();
}

} // namespace sudoku
