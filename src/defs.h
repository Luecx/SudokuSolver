#pragma once


#include <cstdint>

// Basic typedefs using smaller types.
using Row        = int;        // Values 0–8
using Col        = int;        // Values 0–8
using Number     = int8_t;     // Displayed numbers: 1–9
using Candidate  = int8_t;     // Candidate value: 1–9

constexpr Row    BOARD_SIZE = 9;
constexpr Number EMPTY      = 0; // 0 means unsolved; solved cells hold 1–9.