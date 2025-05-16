cmake_minimum_required(VERSION 3.24)
project(SudokuSolver)

set(CMAKE_CXX_STANDARD 23)
# create source files... all inside src/*.cpp recursively
file(GLOB_RECURSE SOURCES src/*.cpp  )

add_executable(SudokuSolver ${SOURCES})