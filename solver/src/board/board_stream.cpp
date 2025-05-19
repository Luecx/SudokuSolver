#include <iomanip>
#include <iostream>
#include <sstream>
#include "board.h"


namespace sudoku {

std::ostream &operator<<(std::ostream &os, Board &board) {
    os << board.to_string();
    return os;
}

} // namespace sudoku
