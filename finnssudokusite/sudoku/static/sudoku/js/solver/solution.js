// === solution.js ===

import { NO_NUMBER } from '../number/number.js';
import { NumberSet } from '../number/number_set.js';
import {CellIdx} from "../region/CellIdx.js";

/**
 * Represents a completed Sudoku board.
 * Each cell contains a single fixed number.
 */
export class Solution {
    /**
     * @param {number} size - Size of the board (e.g., 9 for 9x9).
     */
    constructor(size = 9) {
        this.size = size;
        this.values = Array.from({ length: size }, () => Array(size).fill(NO_NUMBER));
    }

    /**
     * Sets the value of a cell.
     * @param {CellIdx} idx - CellIdx index.
     * @param {number} value - Value to assign.
     */
    set(idx, value) {
        this.values[idx.r][idx.c] = value
    }

    /**
     * Gets the value of a cell.
     * @param {CellIdx} idx - CellIdx index.
     * @returns {number} - The value at the given position.
     */
    get(idx) {
        return this.values[idx.r][idx.c];
    }

    /**
     * Returns a deep copy of the solution.
     * @returns {Solution}
     */
    clone() {
        const copy = new Solution(this.size);
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                copy.values[r][c] = this.values[r][c];
            }
        }
        return copy;
    }

    /**
     * Creates a new Solution instance from a flat comma-separated string.
     * @param {string} flatStr - A string of comma-separated numbers (length = size^2).
     * @param {number} size - Board size (e.g., 9 for 9x9).
     * @returns {Solution}
     */
    static fromFlatString(flatStr, size = 9) {
        const parts = flatStr.split(",");
        const values = parts.map((s, i) => {
            const trimmed = s.trim();
            const n = Number(trimmed);
            if (isNaN(n)) console.warn(`Invalid number at index ${i}: '${trimmed}'`);
            return n;
        });
        if (values.length !== size * size) {
            throw new Error(`Invalid input length: expected ${size * size} values.`);
        }
        const sol = new Solution(size);
        for (let i = 0; i < values.length; i++) {
            const r = Math.floor(i / size);
            const c = i % size;
            sol.set(new CellIdx(r,c), values[i]);
        }
        return sol;
    }
}

/**
 * Represents a collection of multiple Sudoku solutions,
 * and determines the candidate numbers for each cell based
 * on all provided solutions.
 */
export class Solutions {
    /**
     * @param {Solution[]} list - Array of Solution instances.
     */
    constructor(list) {
        if (!list.length) {
            throw new Error("Solutions must be constructed with at least one Solution.");
        }

        this.list = list;
        this.size = list[0].size;

        // Initialize board of NumberSet to collect possible values at each cell
        this.candidates = Array.from({ length: this.size }, () =>
            Array.from({ length: this.size }, () => new NumberSet(this.size))
        );

        for (const sol of list) {
            if (sol.size !== this.size) {
                throw new Error("All solutions must have the same board size.");
            }
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const value = sol.get(new CellIdx(r, c));
                    if (value !== NO_NUMBER) {
                        this.candidates[r][c].add(value);
                    }
                }
            }
        }
    }

    /**
     * Returns the NumberSet of possible values at the given cell.
     * @param {CellIdx} idx
     * @returns {NumberSet}
     */
    getCandidates(idx) {
        return this.candidates[idx.r][idx.c];
    }

    /**
     * Returns the number of stored solutions.
     * @returns {number}
     */
    count() {
        return this.list.length;
    }
}
