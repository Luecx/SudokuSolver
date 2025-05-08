/**
 * CornerIdx.js
 *
 * Represents a corner point in a 2D grid, defined by its row (r) and column (c).
 * Used for identifying square corners in Sudoku or grid-based layouts.
 */

import { CellIdx } from './CellIdx.js';

export class CornerIdx {
    /**
     * Constructs a CornerIdx.
     * @param {number} r - The row index.
     * @param {number} c - The column index.
     */
    constructor(r, c) {
        /** @type {number} The row index */
        this.r = r;

        /** @type {number} The column index */
        this.c = c;
    }

    /**
     * Converts the corner index to a string in the format "r,c".
     * @returns {string}
     */
    toString() {
        return `${this.r},${this.c}`;
    }

    /**
     * Checks equality with another CornerIdx object.
     * @param {any} other - The object to compare with.
     * @returns {boolean}
     */
    equals(other) {
        return other instanceof CornerIdx && this.r === other.r && this.c === other.c;
    }

    /**
     * Returns a deep copy of this CornerIdx.
     * @returns {CornerIdx}
     */
    copy() {
        return new CornerIdx(this.r, this.c);
    }

    /**
     * Creates a CornerIdx object from a string in the format "r,c".
     * @param {string} key - The string to parse.
     * @returns {CornerIdx}
     */
    static fromString(key) {
        const [r, c] = key.split(',').map(Number);
        return new CornerIdx(r, c);
    }

    /**
     * Returns the four CellIdx objects adjacent to this corner.
     * These are the cells at (r, c), (r+1, c), (r, c+1), and (r+1, c+1).
     * @returns {CellIdx[]}
     */
    attachedCells() {
        return [
            new CellIdx(this.r, this.c),
            new CellIdx(this.r + 1, this.c),
            new CellIdx(this.r, this.c + 1),
            new CellIdx(this.r + 1, this.c + 1),
        ];
    }
}

