#include <iostream>
#include <fstream>
#include <string>
#include <chrono>

//#include "board.h"
//#include "rules/include.h"
//#include "position.h"
#include "number_set.h"
#include "region/region.h"
#include "json.h"

using namespace sudoku;

int main() {
    std::string txt = R"(
    {
  "fixedCells": [],
  "rules": [
    {
      "type": "Kropki",
      "fields": {
        "allDotsGiven": false
      },
      "rules": [
        {
          "label": "White Kropki Dots",
          "color": "white",
          "fields": {
            "region": {
              "__type__": "Region",
              "type": "edges",
              "items": [
                {
                  "__type__": "EdgeIdx",
                  "r1": 1,
                  "c1": 3,
                  "r2": 2,
                  "c2": 3
                },
                {
                  "__type__": "EdgeIdx",
                  "r1": 3,
                  "c1": 5,
                  "r2": 4,
                  "c2": 5
                },
                {
                  "__type__": "EdgeIdx",
                  "r1": 4,
                  "c1": 2,
                  "r2": 5,
                  "c2": 2
                },
                {
                  "__type__": "EdgeIdx",
                  "r1": 3,
                  "c1": 1,
                  "r2": 3,
                  "c2": 2
                }
              ]
            }
          }
        },
        {
          "label": "Black Kropki Dots",
          "color": "black",
          "fields": {
            "region": {
              "__type__": "Region",
              "type": "edges",
              "items": [
                {
                  "__type__": "EdgeIdx",
                  "r1": 2,
                  "c1": 6,
                  "r2": 2,
                  "c2": 7
                },
                {
                  "__type__": "EdgeIdx",
                  "r1": 4,
                  "c1": 7,
                  "r2": 5,
                  "c2": 7
                }
              ]
            }
          }
        }
      ]
    },
    {
      "type": "Diagonal",
      "fields": {
        "diagonal": true,
        "antiDiagonal": true
      },
      "rules": []
    },
    {
      "type": "Palindrome",
      "fields": {},
      "rules": [
        {
          "id": "1747328320976-1axa",
          "fields": {
            "path": {
              "__type__": "Region",
              "type": "cells",
              "items": [
                {
                  "__type__": "CellIdx",
                  "r": 1,
                  "c": 2
                },
                {
                  "__type__": "CellIdx",
                  "r": 2,
                  "c": 2
                },
                {
                  "__type__": "CellIdx",
                  "r": 2,
                  "c": 3
                },
                {
                  "__type__": "CellIdx",
                  "r": 2,
                  "c": 4
                },
                {
                  "__type__": "CellIdx",
                  "r": 3,
                  "c": 4
                },
                {
                  "__type__": "CellIdx",
                  "r": 4,
                  "c": 4
                },
                {
                  "__type__": "CellIdx",
                  "r": 4,
                  "c": 5
                }
              ]
            }
          }
        }
      ]
    },
    {
      "type": "Cage",
      "fields": {
        "NumberCanRepeat": false
      },
      "rules": [
        {
          "id": "1747328281400-9ubq",
          "fields": {
            "region": {
              "__type__": "Region",
              "type": "cells",
              "items": [
                {
                  "__type__": "CellIdx",
                  "r": 1,
                  "c": 4
                },
                {
                  "__type__": "CellIdx",
                  "r": 1,
                  "c": 5
                },
                {
                  "__type__": "CellIdx",
                  "r": 2,
                  "c": 5
                }
              ]
            },
            "sum": 10
          }
        }
      ]
    },
    {
      "type": "Chevron",
      "fields": {},
      "rules": [
        {
          "label": "Up Chevron",
          "symbol": "up",
          "fields": {
            "region": {
              "__type__": "Region",
              "type": "edges",
              "items": [
                {
                  "__type__": "EdgeIdx",
                  "r1": 3,
                  "c1": 6,
                  "r2": 4,
                  "c2": 6
                }
              ]
            }
          }
        },
        {
          "label": "Down Chevron",
          "symbol": "down",
          "fields": {
            "region": null
          }
        },
        {
          "label": "Right Chevron",
          "symbol": "right",
          "fields": {
            "region": null
          }
        },
        {
          "label": "Left Chevron",
          "symbol": "left",
          "fields": {
            "region": null
          }
        }
      ]
    },
    {
      "type": "Anti-Chess",
      "fields": {},
      "rules": [
        {
          "label": "Anti-Knight",
          "fields": {
            "enabled": true,
            "region": {
              "__type__": "Region",
              "type": "cells",
              "items": [
                {
                  "__type__": "CellIdx",
                  "r": 3,
                  "c": 3
                },
                {
                  "__type__": "CellIdx",
                  "r": 4,
                  "c": 3
                },
                {
                  "__type__": "CellIdx",
                  "r": 5,
                  "c": 3
                },
                {
                  "__type__": "CellIdx",
                  "r": 5,
                  "c": 4
                },
                {
                  "__type__": "CellIdx",
                  "r": 5,
                  "c": 5
                },
                {
                  "__type__": "CellIdx",
                  "r": 6,
                  "c": 5
                },
                {
                  "__type__": "CellIdx",
                  "r": 7,
                  "c": 5
                },
                {
                  "__type__": "CellIdx",
                  "r": 7,
                  "c": 6
                }
              ]
            },
            "NumberCanRepeat": true,
            "sums": "1,2"
          }
        },
        {
          "label": "Anti-King",
          "fields": {
            "enabled": true,
            "region": null,
            "NumberCanRepeat": true,
            "sums": ""
          }
        }
      ]
    },
    {
      "type": "Clone",
      "fields": {},
      "rules": []
    }
  ]
}
)";

    try {
        auto root = JSON::parse(txt);
        // print full tree:
        // std::cout << root << std::endl;

        auto node = root["rules"][0]["rules"][0]["fields"]["region"];
        std::cout << node <<std::endl;
        auto reg = Region<EdgeIdx>::from_json(node);
        std::cout << reg << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Parse error: " << e.what() << "\n";
    }
    return 0;
}
