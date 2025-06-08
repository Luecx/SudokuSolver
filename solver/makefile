# ------------------ Compiler Settings ------------------
CXX := g++
CXXFLAGS := -std=c++23 -O3 -g -Wall -Wextra -Wno-unused-parameter -Iinclude -flto
LDFLAGS := -flto

SRC_DIR := src
BUILD_DIR := build
TARGET := SudokuSolver

# ------------------ Emscripten Settings ------------------
EMCC := emcc
EMFLAGS := \
	-std=c++23 \
	-O3 \
	-s WASM=1 \
	-s EXPORT_ES6=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=SolverEngine \
	-s EXPORTED_FUNCTIONS="['_solve','_solveComplete']" \
	-s EXPORTED_RUNTIME_METHODS="['ccall']" \
  	--pre-js pre.js \
	--no-entry

WASM_OUT := $(BUILD_DIR)/solver.js

# ------------------ File Discovery ------------------
SOURCES := $(shell find $(SRC_DIR) -name '*.cpp')
OBJECTS := $(patsubst $(SRC_DIR)/%.cpp, $(BUILD_DIR)/%.o, $(SOURCES))

# ------------------ Targets ------------------

# Default target
all: $(TARGET)

# Native build
$(TARGET): $(OBJECTS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $^

# Compile object files
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Emscripten (WASM) build
wasm: $(WASM_OUT)

$(WASM_OUT): $(SOURCES)
	@mkdir -p $(BUILD_DIR)
	$(EMCC) $(SOURCES) $(EMFLAGS) -o $@

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR) $(TARGET)

.PHONY: all clean wasm
