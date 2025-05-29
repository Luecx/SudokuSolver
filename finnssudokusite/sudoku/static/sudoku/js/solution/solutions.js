/**
 * @file solutions.js
 * @description
 * Represents a collection of completed Sudoku boards (Solution[]),
 * and derives per-cell candidate sets across all solutions.
 */

import { NO_NUMBER } from '../number/number.js';
import { NumberSet } from '../number/number_set.js';
import { CellIdx } from '../region/CellIdx.js';
import { Solution } from './solution';

/**
 * Represents a collection of multiple Sudoku solutions.
 * Derives candidate sets for each cell across all solutions.
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

        // Initialize candidate sets
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
     * Returns the NumberSet of possible values at a given cell.
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
