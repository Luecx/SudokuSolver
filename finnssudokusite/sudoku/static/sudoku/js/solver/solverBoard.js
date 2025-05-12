// === solver_board.js ===

import { NO_NUMBER } from '../number/number.js';
import { CellIdx } from "../region/CellIdx.js";
import { SolverCell } from './solverCell.js';
import { SolverStats } from './solverStats.js';
import * as RegionUtils from './solverUtil.js';
import {NumberSet} from "../number/number_set.js";

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
            console.log(region);
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

    getNextCell(impactSums = new Map()) {
        // 1. Gather all empty cells
        const empties = this.grid.flat().filter(cell => cell.value === NO_NUMBER);

        let minCount = Infinity;
        let bestCells = [];

        for (const cell of empties) {
            const count = cell.candidates.count();
            if (count < minCount) {
                minCount = count;
                bestCells = [cell];
            } else if (count === minCount) {
                bestCells.push(cell);
            }
        }

        // Among those, select by max impact
        let bestImpact = -Infinity;
        let impactTied = [];

        for (const cell of bestCells) {
            const key = cell.pos.toString();
            const impact = impactSums.get(key) ?? 0;

            if (impact > bestImpact) {
                bestImpact = impact;
                impactTied = [cell];
            } else if (impact === bestImpact) {
                impactTied.push(cell);
            }
        }

        if (impactTied.length === 0) return null;
        const chosen = impactTied[Math.floor(Math.random() * impactTied.length)];
        return chosen.pos;

    }

    /**
     * Attempts to find all distinct valid solutions for the current board
     * while simultaneously refining the candidates in each cell based on
     * provably invalid options.
     *
     * This function performs a guided exhaustive search using the following strategy:
     *
     * - For each unset cell and each of its current candidates (in randomized order):
     *   - It attempts to place the candidate on a cloned board (`board`).
     *   - If the placement is invalid, the candidate is immediately removed from the
     *     candidate list of both the solving board and the candidate-tracking board.
     *   - If the placement is valid, it invokes `solve(1, 128)` to search for a complete
     *     solution starting from that configuration.
     *   - If a solution is found:
     *     - The values from the solution are used to eliminate them as candidates in
     *       the candidate-tracking board (`board_nums_to_check`), under the assumption
     *       that they have now been sufficiently explored.
     *     - A debug message prints how many candidate values are skipped as a result.
     *     - The solution is stored in a map (by stringified key) to avoid duplicates.
     *   - If no solution is found and the solve was **not interrupted**, then the candidate
     *     is provably invalid and removed permanently from both boards.
     *
     * Throughout this process:
     * - A dedicated candidate-tracking board (`board_nums_to_check`) is used to manage
     *   which values still need to be tested.
     * - Candidate sets on the solving board (`board`) are left mostly untouched except
     *   when a candidate is immediately invalid.
     * - The original board (`this`) remains unchanged.
     *
     * @returns {SolverBoard[]} An array of unique solutions found across all valid candidate attempts.
     *
     * Side effect: The candidate sets on `board_nums_to_check` will have been refined.
     *              This does not modify the original board's candidates.
     */
    /**
     * As before, but now async and “chunked” so the browser can repaint
     */
    async solveComplete(callback) {
        const all_solutions = new Map();
        const board = this.clone();
        const board_nums_to_check = this.clone();

        const result = this.buildImpactMapWithSums();
        let impactSums = result.impactSums;
        let impactMap = result.impactMap;

        // shuffle positions once
        const shuffledPositions = [...Array(this.size * this.size).keys()]
            .map(i => ({ r: Math.floor(i / this.size), c: i % this.size }))
            .sort(() => Math.random() - 0.5);

        let progress = 0;

        for (const { r, c } of shuffledPositions) {
            const cell  = board.grid[r][c];
            const cands = board_nums_to_check.grid[r][c].candidates;
            if (cell.value !== NO_NUMBER) {
                progress += 1;
                callback(progress);
                await new Promise(r => setTimeout(r, 0));
                continue;
            }

            for (const n of cands.clone()) {
                if (!board.setCell(new CellIdx(r, c), n)) {
                    cands.disallow(n);
                    cell.candidates.disallow(n);
                    continue;
                }

                const { solutions, stats } = board.solve(1, 512, impactSums, impactMap);

                if (solutions.length > 0) {
                    for (const sol of solutions) {
                        let skipped = 0;
                        for (let r_ = 0; r_ < this.size; r_++) {
                            for (let c_ = 0; c_ < this.size; c_++) {
                                const val = sol.grid[r_][c_].value;
                                const chk = board_nums_to_check.grid[r_][c_];
                                if (chk.candidates.test(val)) {
                                    chk.candidates.disallow(val);
                                    skipped++;
                                }
                            }
                        }
                        console.log(`→ Solution found. Skipping ${skipped} candidate(s).`);
                        const key = sol.toString();
                        if (!all_solutions.has(key)) all_solutions.set(key, sol);
                    }
                } else if (!stats.interrupted) {
                    console.log(`→ Candidate ${n} at (${r},${c}) eliminated.`);
                    cell.candidates.disallow(n);
                    cands.disallow(n);
                }

                board.stackPop();
            }

            // report progress and yield to the browser
            progress += 1;
            callback(progress);
            // **this** is the crucial bit that lets repaint happen
            await new Promise(r => setTimeout(r, 0));
        }

        return Array.from(all_solutions.values());
    }


    buildImpactMapWithSums() {
        const impactMap = new Map();
        const impactSums = new Map();

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = this.grid[r][c];
                if (cell.value !== NO_NUMBER) continue;

                const idx = new CellIdx(r, c);
                const key = idx.toString();
                const innerMap = new Map();
                let totalImpact = 0;

                for (const num of cell.candidates) {
                    const boardCopy = this.clone();
                    const success = boardCopy.setCell(idx, num);

                    if (!success) {
                        innerMap.set(num, Infinity);
                        continue;
                    }

                    const before = this.grid.flat().map(c => c.candidates.clone());
                    const after = boardCopy.grid.flat().map(c => c.candidates);
                    let changed = 0;

                    for (let i = 0; i < before.length; i++) {
                        if (!before[i].equals(after[i])) changed++;
                    }

                    innerMap.set(num, changed);
                    totalImpact += changed;
                }

                impactMap.set(key, innerMap);
                impactSums.set(key, totalImpact);
            }
        }

        return { impactMap, impactSums };
    }




    // Fisher–Yates shuffle helper
    shuffleArray(arr){
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // Returns the candidates for a given position in random order
    getRandomCandidates(pos, impactMap = null) {
        const cell = this.getCell(pos);
        const candidates = Array.from(cell.candidates);

        if (!impactMap) {
            return this.shuffleArray(candidates);
        }

        const key = pos.toString();
        const impacts = impactMap.get(key);

        if (!impacts) {
            return this.shuffleArray(candidates);
        }

        return candidates.sort((a, b) => {
            const impactA = impacts.get(a) ?? 0;
            const impactB = impacts.get(b) ?? 0;
            return impactB - impactA;
        });
    }


    solve(maxSolutions = 1, maxNodes = 1024, impactSums = undefined, impactMap = undefined) {
        if (!impactSums || !impactMap) {
            const result = this.buildImpactMapWithSums();
            impactSums = result.impactSums;
            impactMap = result.impactMap;
        }

        const solutions = [];
        let nodeCount = 0;
        let interrupted = false;
        const start = performance.now();

        this.showRuleCount();

        const backtrack = () => {
            if (++nodeCount > maxNodes) {
                interrupted = true;
                return false;
            }

            if (this.isSolved()) {
                solutions.push(this.clone());
                return solutions.length < maxSolutions;
            }

            const pos = this.getNextCell(impactSums);
            if (!pos) return true;

            if (nodeCount < 10)
                console.log(`Trying ${pos.r},${pos.c} (${this.getCell(pos).candidates.count()} candidates)`);

            for (const n of this.getRandomCandidates(pos, impactMap)) {
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
        const stats = new SolverStats(solutions.length, nodeCount, end - start, interrupted);
        stats.print();
        return { solutions, stats };
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
