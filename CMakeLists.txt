cmake_minimum_required(VERSION 3.24)
project(SudokuSolver)

set(CMAKE_CXX_STANDARD 20)
# create source files... all inside src/*.cpp recursively
file(GLOB_RECURSE SOURCES src/main.cpp )

add_executable(SudokuSolver ${SOURCES})