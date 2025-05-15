#include <iostream>
#include <fstream>
#include <string>
#include <chrono>

//#include "board.h"
//#include "rules/include.h"
//#include "position.h"
#include "number_set.h"
#include "region/region.h"

using namespace sudoku;

int main() {
    Region<CellIdx> region{};
    region.add({3,4});
    std::cout << region << std::endl;

}
