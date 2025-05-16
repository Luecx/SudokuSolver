#include "board.h"

#include <vector>

namespace sudoku {

Board::Board(int size)
    : board_size_(size),
    block_size_(static_cast<int>(std::sqrt(size))),
    grid_(size),
    impact_map_(size)
{
    // Initialize all cells with their position and board size
    for (Row r = 0; r < size; ++r) {
        grid_[r].reserve(size);
        for (Col c = 0; c < size; ++c) {
            grid_[r].emplace_back(CellIdx{r, c}, size);
        }
    }

    initialize_accessors();

    if (block_size_ * block_size_ == size) {
        initialize_blocks();
    }
}

void Board::initialize_accessors() {
    rows_.resize(board_size_);
    cols_.resize(board_size_);

    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            rows_[r].push_back(&grid_[r][c]);
            cols_[c].push_back(&grid_[r][c]);
        }
    }
}

void Board::initialize_blocks() {
    blocks_.resize(board_size_);

    for (Row r = 0; r < board_size_; ++r) {
        for (Col c = 0; c < board_size_; ++c) {
            int block_row = r / block_size_;
            int block_col = c / block_size_;
            int block_index = block_row * block_size_ + block_col;
            blocks_[block_index].push_back(&grid_[r][c]);
        }
    }
}

Cell& Board::get_cell(const CellIdx& idx) {
    return grid_.at(idx.r).at(idx.c);
}

const std::vector<Cell>& Board::get_row(Row r) const {
    return grid_.at(r);
}

const std::vector<Cell>& Board::get_col(Col c) const {
    static std::vector<Cell> col_result;
    col_result.clear();
    col_result.reserve(board_size_);
    for (Row r = 0; r < board_size_; ++r)
        col_result.push_back(grid_[r][c]);
    return col_result;
}

const std::vector<Cell>& Board::get_block(Row r, Col c) const {
    assert(block_size_ * block_size_ == board_size_);
    int block_row = r / block_size_;
    int block_col = c / block_size_;
    int block_index = block_row * block_size_ + block_col;
    return *reinterpret_cast<const std::vector<Cell>*>(&blocks_.at(block_index));
}

void Board::add_handler(std::shared_ptr<RuleHandler> handler) {
    handlers_.push_back(std::move(handler));
}

} // namespace sudoku
