# 🧠 SudokuSolver

A full-featured web-based Sudoku platform where you can play, create, and compete in solving puzzles. Powered by a high-performance C++ solver compiled to WebAssembly and integrated with a Django web app, this project offers a fun, fast, and competitive experience for Sudoku enthusiasts.

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
* Node.js
* [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SudokuSolver.git
cd SudokuSolver
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up the Database

```bash
cd finnssudokusite
python manage.py makemigrations sudoku
python manage.py migrate
```

### 4. (Optional) Import Sample Puzzles

```bash
source uvenv/bin/activate
python manage.py import_sudokus your_username ../sudoku_jsons/ --solver ../solver/SudokuSolver
```

### 5. Run the Development Server

```bash
python manage.py runserver
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
python manage.py delete_sudokus --match-regex "."
```

---

## 🧱 Project Structure

```
SudokuSolver/
├── finnssudokusite/      # Django web app
├── solver/               # C++ Sudoku solver and generator
├── sudoku_jsons/         # JSON-based puzzle data
├── requirements.txt      # Python dependencies
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
