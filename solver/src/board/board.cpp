#include "board.h"

#include <vector>

namespace sudoku {

Board::Board(int size) :
    board_size_(size), block_size_(static_cast<int>(std::sqrt(size))), grid_(size), impact_map_(size) {
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

    snapshot_pool_.resize(size * size);
    for (auto &snap: snapshot_pool_)
        snap.resize(board_size_ * board_size_);
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

Cell &Board::get_cell(const CellIdx &idx) { return grid_.at(idx.r).at(idx.c); }

std::vector<Cell *> &Board::get_row(Row r) { return rows_.at(r); }

std::vector<Cell *> &Board::get_col(Col c) { return cols_.at(c); }

std::vector<Cell *> &Board::get_block(Row r, Col c) {
    assert(block_size_ * block_size_ == board_size_);
    int block_row = r / block_size_;
    int block_col = c / block_size_;
    int block_index = block_row * block_size_ + block_col;
    return blocks_.at(block_index);
}

void Board::add_handler(std::shared_ptr<RuleHandler> handler) {
    handlers_.push_back(std::move(handler));
    this->process_rule_candidates();
}

std::string Board::to_string() {
    std::stringstream result;

    const int CELL_WIDTH = 7;
    const int CELL_HEIGHT = 3;
    const std::string within_block_hsep = "   ";
    const std::string between_block_hsep = "      ";
    const int within_block_vsep = 1;
    const int between_block_vsep = 2;
    const std::string vertical_fill = " ";
    const int N = size();
    const int total_width = N * CELL_WIDTH + 2 * between_block_hsep.length() + 6 * within_block_hsep.length();

    const std::string border = "#" + std::string(total_width, '#') + "#";

    // Build visual buffer
    std::vector<std::vector<std::vector<std::string>>> buffers(N, std::vector<std::vector<std::string>>(N));

    for (Row r = 0; r < N; ++r) {
        for (Col c = 0; c < N; ++c) {
            const Cell &cell = get_cell({r, c});
            std::vector<std::string> buf(CELL_HEIGHT, std::string(CELL_WIDTH, ' '));

            if (cell.value != EMPTY) {
                buf[1][3] = '0' + cell.value;
            } else {
                for (int d = 1; d <= 9; ++d) {
                    if (cell.candidates.test(d)) {
                        int rr = (d - 1) / 3;
                        int cc = 1 + 2 * ((d - 1) % 3);
                        buf[rr][cc] = '0' + d;
                    }
                }
            }
            buffers[r][c] = std::move(buf);
        }
    }

    // Write rows
    result << border << '\n';
    for (Row r = 0; r < N; ++r) {
        for (int l = 0; l < CELL_HEIGHT; ++l) {
            result << "#";
            for (Col c = 0; c < N; ++c) {
                result << buffers[r][c][l];
                if (c < N - 1)
                    result << (((c + 1) % 3 == 0) ? between_block_hsep : within_block_hsep);
            }
            result << "#\n";
        }
        if (r < N - 1) {
            int sep_lines = ((r + 1) % 3 == 0) ? between_block_vsep : within_block_vsep;
            for (int i = 0; i < sep_lines; ++i) {
                result << "#" << std::string(total_width, ' ') << "#\n";
            }
        }
    }
    result << border << '\n';

    return result.str();
}

} // namespace sudoku
