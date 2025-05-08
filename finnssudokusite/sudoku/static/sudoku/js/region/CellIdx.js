/**
 * CellIdx.js
 *
 * Represents a single cell index in a 2D grid with row (r) and column (c) coordinates.
 * Used in Sudoku-like boards and grid-based systems.
 */

export class CellIdx {
    /**
     * Constructs a CellIdx.
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
     * Converts the cell index to a string in the format "r,c".
     * @returns {string}
     */
    toString() {
        return `${this.r},${this.c}`;
    }

    /**
     * Checks equality with another CellIdx object.
     * @param {any} other - The object to compare with.
     * @returns {boolean}
     */
    equals(other) {
        return other instanceof CellIdx && this.r === other.r && this.c === other.c;
    }

    /**
     * Returns a deep copy of this CellIdx.
     * @returns {CellIdx}
     */
    copy() {
        return new CellIdx(this.r, this.c);
    }

    /**
     * Creates a CellIdx object from a string in the format "r,c".
     * @param {string} key - The string to parse.
     * @returns {CellIdx}
     */
    static fromString(key) {
        const [r, c] = key.split(',').map(Number);
        return new CellIdx(r, c);
    }

    /**
     * Returns the cell(s) attached to this index.
     * For CellIdx, it is itself.
     * @returns {CellIdx[]}
     */
    attachedCells() {
        return [this];
    }
}
