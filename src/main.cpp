#include <iostream>
#include <fstream>
#include <string>
#include <chrono>

//#include "board.h"
//#include "rules/include.h"
//#include "position.h"
#include "board/board.h"
#include "json/json.h"
#include "number_set.h"
#include "region/region.h"

using namespace sudoku;

int main() {
    std::string txt = R"(

{
    "fixedCells": [
        {
            "r": 0,
            "c": 4,
            "value": 4
        },
        {
            "r": 0,
            "c": 5,
            "value": 6
        },
        {
            "r": 0,
            "c": 6,
            "value": 5
        },
        {
            "r": 0,
            "c": 7,
            "value": 1
        },
        {
            "r": 1,
            "c": 6,
            "value": 9
        },
        {
            "r": 2,
            "c": 1,
            "value": 7
        },
        {
            "r": 2,
            "c": 2,
            "value": 6
        },
        {
            "r": 2,
            "c": 5,
            "value": 3
        },
        {
            "r": 2,
            "c": 7,
            "value": 2
        },
        {
            "r": 3,
            "c": 2,
            "value": 3
        },
        {
            "r": 3,
            "c": 4,
            "value": 8
        },
        {
            "r": 3,
            "c": 5,
            "value": 4
        },
        {
            "r": 3,
            "c": 6,
            "value": 7
        },
        {
            "r": 4,
            "c": 3,
            "value": 3
        },
        {
            "r": 4,
            "c": 4,
            "value": 6
        },
        {
            "r": 4,
            "c": 5,
            "value": 9
        },
        {
            "r": 4,
            "c": 6,
            "value": 1
        },
        {
            "r": 4,
            "c": 7,
            "value": 8
        },
        {
            "r": 5,
            "c": 1,
            "value": 9
        },
        {
            "r": 5,
            "c": 3,
            "value": 5
        },
        {
            "r": 5,
            "c": 7,
            "value": 6
        },
        {
            "r": 6,
            "c": 0,
            "value": 7
        },
        {
            "r": 6,
            "c": 4,
            "value": 9
        },
        {
            "r": 6,
            "c": 8,
            "value": 5
        },
        {
            "r": 7,
            "c": 0,
            "value": 2
        },
        {
            "r": 7,
            "c": 1,
            "value": 4
        },
        {
            "r": 7,
            "c": 3,
            "value": 8
        },
        {
            "r": 7,
            "c": 4,
            "value": 1
        },
        {
            "r": 8,
            "c": 1,
            "value": 5
        },
        {
            "r": 8,
            "c": 4,
            "value": 3
        }
    ],
    "rules": [
        {
            "type": "Standard",
            "fields": {}
        }
    ]
}

)";

    try {
        auto root = JSON::parse(txt);

        Board board{9};
        std::cout << board << std::endl;
        board.from_json(root);
        std::cout << board << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Parse error: " << e.what() << "\n";
    }
    return 0;
}
