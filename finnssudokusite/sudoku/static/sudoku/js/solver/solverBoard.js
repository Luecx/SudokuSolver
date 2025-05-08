// === solver_board.js ===

import { NO_NUMBER } from '../number/number.js';
import { CellIdx } from "../region/CellIdx.js";
import { SolverCell } from './solverCell.js';
import { SolverStats } from './solverStats.js';
import * as RegionUtils from './solverUtil.js';

export class SolverBoard {
    /**
     * Creates a new SolverBoard for the given board size.
     * @param {number} size - Board size (e.g. 9). Must be a perfect square.
     */
    constructor(size = 9) {
        this.size = size;
        this.blockSize = Math.sqrt(size);

        if (!Number.isInteger(this.blockSize)) {
            throw new Error(`Board size ${size} must be a perfect square.`);
        }

        // Create grid of SolverCells
        this.grid = Array.from({ length: size }, (_, r) =>
            Array.from({ length: size }, (_, c) =>
                new SolverCell(new CellIdx(r, c), size)
            )
        );

        // Create row and column access
        this.rows = this.grid.map(row => [...row]);
        this.cols = Array.from({ length: size }, (_, c) =>
            this.grid.map(row => row[c])
        );

        // Create blocks
        this.blocks = Array.from({ length: size }, () => []);
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const blockIdx = Math.floor(r / this.blockSize) * this.blockSize + Math.floor(c / this.blockSize);
                this.blocks[blockIdx].push(this.grid[r][c]);
            }
        }

        this.rules = [];
        this.history = [];
    }

    getCell(idx) {
        return this.grid[idx.r][idx.c];
    }

    getRow(row) {
        return this.rows[row];
    }

    getCol(col) {
        return this.cols[col];
    }

    getBlock(row, col) {
        const bi = Math.floor(row / this.blockSize) * this.blockSize + Math.floor(col / this.blockSize);
        return this.blocks[bi];
    }

    addHandler(ruleInstance) {
        this.rules.push(ruleInstance);
        this.updateRuleCounts();
        this.processRuleCandidates();
    }

    updateRuleCounts() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                this.grid[r][c].ruleCount = 0;
            }
        }

        for (const handler of this.rules) {
            const region = handler.attachedCells(this);
            for (const cellIdx of region.items) {
                this.getCell(cellIdx).ruleCount += 1;
            }
        }
    }

    isValidMove(idx, number) {
        return this.getCell(idx).getCandidates().test(number);
    }

    impossible() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = this.grid[r][c];
                if (cell.value === NO_NUMBER && cell.candidates.count() === 0)
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
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
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

    setCellForce(pos, number) {
        const cell = this.getCell(pos);
        cell.value = number;
        cell.candidates.clear();
        this.processRuleNumberChanged(cell);
        this.processRuleCandidates();
    }

    display() {
        const lines = this.grid.map(row =>
            row.map(cell => cell.value || ".").join(" ")
        );
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
        return this.grid.every(row =>
            row.every(cell => cell.value !== NO_NUMBER)
        );
    }

    getNextCell() {
        let best = null;
        let bestQuality = Infinity;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = this.grid[r][c];
                if (cell.value === NO_NUMBER) {
                    const count = cell.candidates.count();
                    const quality = count - cell.ruleCount / 10;

                    if (count <= 2) return cell.pos;

                    if (quality < bestQuality) {
                        best = cell;
                        bestQuality = quality;
                    }
                }
            }
        }

        return best?.pos || null;
    }

    solveComplete() {
        console.log(this.toString(true));
        return this.solve(1, 1024);

        const solutions = new Map();

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = this.grid[r][c];
                if (cell.value !== NO_NUMBER) continue;

                const candidates = Array.from(cell.candidates);
                for (const n of candidates) {
                    const clone = this.clone();
                    const success = clone.setCell(new CellIdx(r, c), n);
                    if (!success) continue;

                    const partialSolutions = clone.solve(1);
                    for (const sol of partialSolutions) {
                        const key = sol.toString();
                        if (!solutions.has(key)) {
                            solutions.set(key, sol);
                        }
                    }
                }
            }
        }

        return Array.from(solutions.values());
    }

    solve(maxSolutions = 1, maxNodes = 1024) {
        const solutions = [];
        let nodeCount = 0;
        let interrupted = false;
        const start = performance.now();

        const backtrack = () => {
            if (++nodeCount > maxNodes) {
                interrupted = true;
                return false;
            }

            if (this.isSolved()) {
                solutions.push(this.clone());
                if (solutions.length >= maxSolutions) return false;
                return true;
            }

            const pos = this.getNextCell();
            if (!pos) return true;

            const toTry = Array.from(this.getCell(pos).candidates);
            for (const n of toTry) {
                if (this.setCell(pos, n)) {
                    const keepGoing = backtrack();
                    this.stackPop();
                    if (!keepGoing) return false;
                }
            }

            return true;
        };

        backtrack();

        const end = performance.now();
        new SolverStats(solutions.length, nodeCount, end - start, interrupted).print();
        return solutions;
    }


    clone() {
        const copy = new SolverBoard(this.size);
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = this.grid[r][c];
                copy.grid[r][c].value = cell.value;
                copy.grid[r][c].candidates = cell.candidates.clone();
            }
        }
        copy.rules = this.rules;
        return copy;
    }


    toString(details = false) {
        const supportsAnsi = false;

        if (!details) {
            return this.grid.map(row =>
                row.map(cell =>
                    cell.value === NO_NUMBER
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
            this.size * CELL_WIDTH
            + 2 * betweenBlockHorSep.length
            + 6 * withinBlockHorSep.length;

        // Create visual buffers for all cells
        const cellBuffers = this.grid.map(row =>
            row.map(cell => {
                const buf = Array.from({ length: CELL_HEIGHT }, () => " ".repeat(CELL_WIDTH).split(""));
                if (cell.value !== NO_NUMBER) {
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
        for (let r = 0; r < this.size; r++) {
            for (let l = 0; l < CELL_HEIGHT; l++) {
                let line = "";
                for (let c = 0; c < this.size; c++) {
                    line += cellBuffers[r][c][l];
                    if (c < this.size - 1)
                        line += (c + 1) % 3 === 0 ? betweenBlockHorSep : withinBlockHorSep;
                }
                lines.push(line);
            }
            if (r < this.size - 1) {
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

    showRuleCount() {
        const counts = this.grid.map(row => row.map(cell => cell.ruleCount));
        const maxCount = Math.max(...counts.flat());
        const maxWidth = String(maxCount).length;

        console.log(this.grid.map(row =>
            row.map(cell =>
                String(cell.ruleCount).padStart(maxWidth, " ")
            ).join(" ")
        ).join("\n"));
    }
}

// === Attach RegionUtils functions as SolverBoard methods ===

for (const [name, fn] of Object.entries(RegionUtils)) {
    SolverBoard.prototype[name] = function (region, ...rest) {
        return fn(region, this, ...rest);
    };
}
