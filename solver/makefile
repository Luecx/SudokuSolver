# ------------------ Compiler Settings ------------------
CXX := g++
CXXFLAGS := -std=c++23 -O3 -g -Wall -Wextra -Wno-unused-parameter -Iinclude -flto
LDFLAGS := -flto

SRC_DIR := src
BUILD_DIR := build
TARGET := SudokuSolver.exe

# ------------------ Emscripten Settings ------------------
EMCC := emcc
EMFLAGS := -std=c++23 -O3 -s WASM=1 -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME=SolverEngine -s "EXPORTED_FUNCTIONS=[\"_solve\",\"_solveComplete\"]" -s "EXPORTED_RUNTIME_METHODS=[\"ccall\"]" --pre-js pre.js --no-entry

WASM_OUT := $(BUILD_DIR)\solver.js

# ------------------ File Discovery ------------------
SOURCES := $(shell dir /b /s "$(SRC_DIR)\*.cpp" 2>nul)
SOURCES := $(subst \,/,$(SOURCES))

OBJECTS := $(patsubst $(SRC_DIR)/%.cpp, $(BUILD_DIR)/%.o, $(SOURCES))

# ------------------ Targets ------------------

# Default target
all: $(TARGET)

# Native build
$(TARGET): $(OBJECTS)
	$(CXX) $(CXXFLAGS) $(LDFLAGS) -o $@ $^

# Compile object files
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp
	@if not exist "$(dir $@)" mkdir "$(dir $@)"
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Emscripten (WASM) build
wasm: $(WASM_OUT)

$(WASM_OUT): $(SOURCES)
	@if not exist "$(BUILD_DIR)" mkdir "$(BUILD_DIR)"
	$(EMCC) $(SOURCES) $(EMFLAGS) -o $@

# Clean build artifacts
clean:
	@if exist "$(BUILD_DIR)" rmdir /S /Q "$(BUILD_DIR)"
	@if exist "$(TARGET)" del "$(TARGET)"

# Debug target to check sources
debug-sources:
    @echo "Sources: $(SOURCES)"

.PHONY: all clean wasm debug-sources