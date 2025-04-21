// === board.js ===

import { EMPTY, BOARD_SIZE } from './defs.js';
import { Cell } from './cell.js';
import { CAND_NONE } from './candidates.js';
import { SolverStats } from './stats.js';

export class Board {
    constructor() {
        // Create 2D grid of Cells
        this.grid = Array.from({ length: BOARD_SIZE }, (_, r) =>
            Array.from({ length: BOARD_SIZE }, (_, c) => new Cell(r, c))
        );

        // Create row, col, block pointers
        this.rows = this.grid.map(row => [...row]);
        this.cols = Array.from({ length: BOARD_SIZE }, (_, c) =>
            this.grid.map(row => row[c])
        );

        this.blocks = Array.from({ length: BOARD_SIZE }, () => []);
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const bi = Math.floor(i / 3) * 3 + Math.floor(j / 3);
                this.blocks[bi].push(this.grid[i][j]);
            }
        }

        this.rules = [];
        this.history = [];
    }

    getCell(pos) {
        return this.grid[pos.row][pos.col];
    }

    getRow(row) {
        return this.rows[row];
    }

    getCol(col) {
        return this.cols[col];
    }

    getBlock(row, col) {
        const bi = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        return this.blocks[bi];
    }

    addRule(ruleInstance) {
        this.rules.push(ruleInstance);
        this.processRuleCandidates();
    }

    isValidMove(pos, number) {
        return this.getCell(pos).candidates.test(number);
    }

    impossible() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.grid[r][c];
                if (cell.value === EMPTY && cell.candidates.count() === 0)
                    return true;
            }
        }
        return this.rules.some(rule => !rule.checkPlausibility(this));
    }

    stackPush() {
        const snapshot = this.grid.map(row => row.map(cell => ({
            value: cell.value,
            candidates: cell.candidates.clone()
        })));
        this.history.push(snapshot);
    }

    stackPop() {
        if (!this.history.length) return false;
        const snapshot = this.history.pop();
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                this.grid[r][c].value = snapshot[r][c].value;
                this.grid[r][c].candidates = snapshot[r][c].candidates;
            }
        }
        return true;
    }

    setCell(pos, number) {
        if (!this.isValidMove(pos, number)) return false;
        this.stackPush();
        const cell = this.getCell(pos);
        cell.value = number;
        cell.candidates.clear();
        this.processRuleNumberChanged(cell);
        this.processRuleCandidates();
        if (this.impossible()) {
            this.stackPop();
            return false;
        }
        return true;
    }

    display() {
        const lines = this.grid.map(row => row.map(cell => cell.value || ".").join(" "));
        console.log(lines.join("\n"));
    }

    processRuleCandidates() {
        let changed = true;
        while (changed) {
            changed = false;
            for (const rule of this.rules) {
                changed ||= rule.candidatesChanged(this);
            }
        }
    }

    processRuleNumberChanged(cell) {
        for (const rule of this.rules) {
            rule.numberChanged(this, cell);
        }
    }

    isSolved() {
        return this.grid.every(row => row.every(cell => cell.value !== EMPTY));
    }

    getNextCell() {
        let best = null;
        let minC = BOARD_SIZE + 1;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.grid[r][c];
                if (cell.value === EMPTY) {
                    const count = cell.candidates.count();
                    if (count < minC) {
                        minC = count;
                        best = { row: r, col: c };
                    }
                    if (count <= 2) return { row: r, col: c };
                }
            }
        }
        return best;
    }

    solveTrivial() {
        let applied = true;
        while (applied) {
            applied = false;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const cell = this.grid[r][c];
                    if (cell.value === EMPTY && cell.candidates.count() === 1) {
                        for (const n of cell.candidates) {
                            if (!this.setCell({ row: r, col: c }, n)) return false;
                            applied = true;
                            break;
                        }
                    }
                }
            }
        }
        return true;
    }

    solve(maxSolutions = 1) {
        const solutions = [];
        let nodeCount = 0;
        const start = performance.now();

        const backtrack = () => {
            nodeCount++;

            // 1) Do all trivial fillings; if a contradiction arises, this path is dead:
            // if (!this.solveTrivial()) return true;

            // 2) If we have a complete board, record it:
            if (this.isSolved()) {
                solutions.push(this.clone());
                // If we still want more, continue searching other branches:
                if (solutions.length < maxSolutions) {
                    return true;
                }
                // Otherwise, stop everything:
                return false;
            }

            // 3) Pick the next cell and try each candidate:
            const pos = this.getNextCell();
            const toTry = Array.from(this.getCell(pos).candidates);
            for (const n of toTry) {
                if (this.setCell(pos, n)) {
                    const keepGoing = backtrack();
                    this.stackPop();          // undo the guess
                    if (!keepGoing) {
                        // quota reached → unwind all the way out
                        return false;
                    }
                }
            }

            // No more guesses here → backtrack further
            return true;
        };

        backtrack();

        const end = performance.now();
        new SolverStats(solutions.length, nodeCount, end - start).print();
        return solutions;
    }


    clone() {
        const copy = new Board();
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = this.grid[r][c];
                copy.grid[r][c].value = cell.value;
                copy.grid[r][c].candidates = cell.candidates.clone();
            }
        }
        copy.rules = this.rules; // share rule refs
        return copy;
    }

    toString(details = false) {
        const supportsAnsi = false;

        if (!details) {
            return this.grid.map(row =>
                row.map(cell =>
                    cell.value === EMPTY
                        ? "."
                        : (supportsAnsi ? `\x1b[32m${cell.value}\x1b[0m` : `${cell.value}`)
                ).join(" ")
            ).join("\n");
        }


        // Detailed block-style layout
        const CELL_WIDTH  = 7;
        const CELL_HEIGHT = 3;
        const withinBlockHorSep  = "   ";
        const betweenBlockHorSep = "      ";
        const withinBlockVerSep  = 1;
        const betweenBlockVerSep = 2;
        const verticalSepFill    = " ";
        const totalWidth =
            BOARD_SIZE * CELL_WIDTH
            + 2 * betweenBlockHorSep.length
            + 6 * withinBlockHorSep.length;

        // Create visual buffers for all cells
        const cellBuffers = this.grid.map(row =>
            row.map(cell => {
                const buf = Array.from({ length: CELL_HEIGHT }, () => " ".repeat(CELL_WIDTH).split(""));
                if (cell.value !== EMPTY) {
                    buf[1][3] = supportsAnsi ? `\x1b[32m${cell.value}\x1b[0m` : `${cell.value}`;
                } else {
                    for (let d = 1; d <= 9; d++) {
                        if (cell.candidates.test(d)) {
                            const r = Math.floor((d - 1) / 3);
                            const c = 1 + 2 * ((d - 1) % 3);
                            buf[r][c] = d.toString();
                        }
                    }
                }
                return buf.map(row => row.join(""));
            })
        );

        // Stitch rows together with block separators
        const lines = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let l = 0; l < CELL_HEIGHT; l++) {
                let line = "";
                for (let c = 0; c < BOARD_SIZE; c++) {
                    line += cellBuffers[r][c][l];
                    if (c < BOARD_SIZE - 1)
                        line += (c + 1) % 3 === 0 ? betweenBlockHorSep : withinBlockHorSep;
                }
                lines.push(line);
            }
            if (r < BOARD_SIZE - 1) {
                const sepLines = (r + 1) % 3 === 0 ? betweenBlockVerSep : withinBlockVerSep;
                for (let i = 0; i < sepLines; i++) {
                    lines.push(verticalSepFill.repeat(totalWidth));
                }
            }
        }

        const border = "#".repeat(totalWidth + 2);
        return [
            border,
            ...lines.map(line => `#${line}#`),
            border
        ].join("\n");
    }

}