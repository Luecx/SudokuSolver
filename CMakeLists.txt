cmake_minimum_required(VERSION 3.30)
project(SudokuSolver)

set(CMAKE_CXX_STANDARD 20)

add_executable(SudokuSolver main.cpp board.cpp candidates.cpp rules.cpp rule_black_kropki.cpp rule_white_kropki.cpp rule_odd_even.cpp rule_standard.cpp)
