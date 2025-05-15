#pragma once

#include <string>
#include <vector>

#include "../defs.h"
#include "../json.h"
#include "CellIdx.h"

namespace sudoku {

enum class DiagonalType { MAIN, ANTI };

struct DiagonalIdx {
    DiagonalType type;
    int index;

    DiagonalIdx(DiagonalType type, int index) : type(type), index(index) {}

    bool operator==(const DiagonalIdx& other) const {
        return type == other.type && index == other.index;
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

    static DiagonalIdx from_json(JSON& node) {
        const auto type_str = node["type"].get<std::string>();
        DiagonalType type = (type_str == "main") ? DiagonalType::MAIN : DiagonalType::ANTI;
        return {type, static_cast<int>(node["index"].get<double>())};
    }


    friend std::ostream& operator<<(std::ostream& os, const DiagonalIdx& idx) {
        return os << (idx.type == DiagonalType::MAIN ? "main" : "anti") << ":" << idx.index;
    }
};

} // namespace sudoku
