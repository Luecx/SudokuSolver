#include "board.h"
#include <iostream>
#include <iomanip>
#include <sstream>

namespace sudoku {

std::ostream& operator<<(std::ostream& os, Board& board) {
    const int CELL_WIDTH = 7;
    const int CELL_HEIGHT = 3;
    const std::string within_block_hsep = "   ";
    const std::string between_block_hsep = "      ";
    const int within_block_vsep = 1;
    const int between_block_vsep = 2;
    const std::string vertical_fill = " ";
    const int N = board.size();
    const int total_width = N * CELL_WIDTH +
                            2 * between_block_hsep.length() +
                            6 * within_block_hsep.length();

    const std::string border = "#" + std::string(total_width, '#') + "#";

    // Build visual buffer
    std::vector<std::vector<std::vector<std::string>>> buffers(N, std::vector<std::vector<std::string>>(N));

    for (Row r = 0; r < N; ++r) {
        for (Col c = 0; c < N; ++c) {
            const Cell& cell = board.get_cell({r, c});
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
    os << border << '\n';
    for (Row r = 0; r < N; ++r) {
        for (int l = 0; l < CELL_HEIGHT; ++l) {
            os << "#";
            for (Col c = 0; c < N; ++c) {
                os << buffers[r][c][l];
                if (c < N - 1)
                    os << (((c + 1) % 3 == 0) ? between_block_hsep : within_block_hsep);
            }
            os << "#\n";
        }
        if (r < N - 1) {
            int sep_lines = ((r + 1) % 3 == 0) ? between_block_vsep : within_block_vsep;
            for (int i = 0; i < sep_lines; ++i) {
                os << "#" << std::string(total_width, ' ') << "#\n";
            }
        }
    }
    os << border << '\n';

    return os;
}

} // namespace sudoku
