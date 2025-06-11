# 🧠 SudokuSolver

A full-featured web-based Sudoku platform where you can solve puzzles competitively or casually, and create your own using a powerful solver. Play against others, climb the leaderboards, and challenge yourself with thousands of puzzles — all live at [SudokuSphere.com](https://sudokusphere.com/).

---

## 🚀 Features

* 🧩 **Play Sudokus** — Solve classic and advanced Sudoku variants
* ✍️ **Create Your Own** — Use the solver to generate and test your own puzzles
* ⚡ **Fast Solver** — C++ solver compiled to WebAssembly for instant validation
* 🏆 **Leaderboards** — Compete globally and track your ranking
* 🔁 **Progress Saving** — Resume puzzles anytime
* 🎨 **Customizable UI** — Multiple themes for a tailored experience

---

## 📦 Installation

### Prerequisites

* Python 3.x
* [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)

### 1. Clone the Repository

```bash
git clone https://github.com/Luecx/SudokuSolver.git
cd SudokuSolver
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up the Database

```bash
cd finnssudokusite
python3 manage.py makemigrations sudoku
python3 manage.py migrate
```

### 4. (Optional) Import Sample Puzzles

```bash
source uvenv/bin/activate
python3 manage.py import_sudokus your_username ../sudoku_jsons/ --solver ../solver/SudokuSolver
```

### 5. Run the Development Server

```bash
python3 manage.py runserver
```

Visit `http://localhost:8000` to get started!

---

## 🛠 Development

### Build WebAssembly Solver

```bash
# Step into the Emscripten SDK directory and activate the environment
cd ~/emsdk
source ./emsdk_env.sh

# Move to the solver directory and build the WASM module
cd /path/to/SudokuSolver/solver
make wasm
```

> **Note:** After updating the WASM file, be sure to clear your browser cache (especially in Firefox).

### Benchmarking the Solver

Run performance tests on Sudoku collections:

```bash
./build/sudokusolver bench sudoku_jsons/clones
```

### Manage Puzzle Database

Delete all existing puzzles:

```bash
python3 manage.py delete_sudokus --match-regex "."
```

Import puzzles (in the expected JSON format):
```bash
source venv/bin/activate
python3 manage.py import_sudokus user_name ../sudoku_jsons/ --solver ../solver/SudokuSolver
```

---

## 🤝 Contributing

We welcome all contributions! Whether it’s new puzzle types, UI improvements, or performance tweaks — submit a PR and let’s make SudokuSolver even better.

---

## 📄 License

This project is open source. See the [LICENSE](./LICENSE) file for details.

---

### 🔗 Join the Challenge

Start solving, building, and competing today — and see how you rank on the global leaderboard!

---
