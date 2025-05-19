#include <iomanip>
#include <iostream>
#include <sstream>
#include "board.h"


namespace sudoku {

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

std::ostream &operator<<(std::ostream &os, Board &board) {
    os << board.to_string();
    return os;
}

} // namespace sudoku
