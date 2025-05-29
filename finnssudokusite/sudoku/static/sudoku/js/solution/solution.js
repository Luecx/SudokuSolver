/**
 * @file solution.js
 * @description
 * Represents a completed Sudoku board as a 2D array.
 * Each cell contains a single number or NO_NUMBER if unset.
 * Provides serialization, comparison, and analysis methods.
 */

import { NO_NUMBER } from '../number/number.js';
import { CellIdx } from '../region/CellIdx.js';

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
     * @param {CellIdx} idx - Cell index.
     * @param {number} value - Value to assign.
     */
    set(idx, value) {
        this.values[idx.r][idx.c] = value;
    }

    /**
     * Gets the value of a cell.
     * @param {CellIdx} idx - Cell index.
     * @returns {number}
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
     * Counts the number of differences between this solution and another.
     * Only compares non-zero entries (ignores NO_NUMBER values).
     * @param {Solution} other
     * @returns {number}
     */
    difference(other) {
        if (this.size !== other.size) {
            throw new Error("Cannot compare solutions of different sizes.");
        }

        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const pos = new CellIdx(r, c);
                const thisValue = this.get(pos);
                const otherValue = other.get(pos);

                if (thisValue === NO_NUMBER || otherValue === NO_NUMBER) continue;
                if (thisValue !== otherValue) count++;
            }
        }
        return count;
    }

    /**
     * Counts how many times a specific number appears in the solution.
     * @param {number} value
     * @returns {number}
     */
    countNumber(value) {
        if (value < 1 || value > this.size) {
            throw new Error(`Invalid value: ${value}. Must be between 1 and ${this.size}.`);
        }

        let count = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.get(new CellIdx(r, c)) === value) count++;
            }
        }
        return count;
    }

    /**
     * Converts the solution to a flat comma-separated string (0 = empty).
     * @returns {string}
     */
    toFlatString() {
        return this.values
            .flat()
            .map(v => v === NO_NUMBER ? 0 : v)
            .join(",");
    }

    /**
     * Creates a new Solution instance from a flat comma-separated string.
     * Interprets 0 as NO_NUMBER.
     * @param {string} flatStr
     * @param {number} size
     * @returns {Solution}
     */
    static fromFlatString(flatStr, size = 9) {
        const parts = flatStr.split(",");
        const values = parts.map((s, i) => {
            const trimmed = s.trim();
            const n = Number(trimmed);
            if (isNaN(n)) console.warn(`Invalid number at index ${i}: '${trimmed}'`);
            return n === 0 ? NO_NUMBER : n;
        });

        if (values.length !== size * size) {
            throw new Error(`Invalid input length: expected ${size * size} values.`);
        }

        const sol = new Solution(size);
        for (let i = 0; i < values.length; i++) {
            const r = Math.floor(i / size);
            const c = i % size;
            sol.set(new CellIdx(r, c), values[i]);
        }

        return sol;
    }
}
