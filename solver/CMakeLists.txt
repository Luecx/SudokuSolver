cmake_minimum_required(VERSION 3.24)
project(SudokuSolver)

set(CMAKE_CXX_STANDARD 23)
# create source files... all inside src/*.cpp recursively
file(GLOB_RECURSE SOURCES src/*.cpp)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -std=c++23 -O3 -g -Wall -Wextra -Wno-unused-parameter -march=native")

add_executable(SudokuSolver ${SOURCES})