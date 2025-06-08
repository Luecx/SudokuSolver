/**
 * RCIdx.js
 *
 * Represents a flexible index that may define a row, a column, or both.
 * A null value for row or column means "any", allowing for wildcard matching.
 * Used in grid-based logic to refer to entire rows, columns, or specific cells.
 */

import { CellIdx } from './CellIdx.js';

export class RCIdx {
    /**
     * Constructs an RCIdx.
     * @param {number|null} row - Row index, or null for wildcard ("any").
     * @param {number|null} col - Column index, or null for wildcard ("any").
     */
    constructor(row, col) {
        /** @type {number|null} */
        this.row = row;

        /** @type {number|null} */
        this.col = col;
    }

    /**
     * Converts the RCIdx to a string. Wildcards are shown as 'x'.
     * @returns {string}
     */
    toString() {
        return `${this.row === null ? 'x' : this.row},${this.col === null ? 'x' : this.col}`;
    }

    /**
     * Checks equality with another RCIdx.
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        if (!(other instanceof RCIdx)) return false;

        const isWildcard = (v) => v == null || Number.isNaN(v);

        const rowEqual = (this.row === other.row) || (isWildcard(this.row) && isWildcard(other.row));
        const colEqual = (this.col === other.col) || (isWildcard(this.col) && isWildcard(other.col));

        return rowEqual && colEqual;
    }


    /**
     * Returns a copy of this RCIdx.
     * @returns {RCIdx}
     */
    copy() {
        return new RCIdx(this.row, this.col);
    }

    /**
     * Creates an RCIdx from a string, where 'x' means wildcard.
     * @param {string} key
     * @returns {RCIdx}
     */
    static fromString(key) {
        const [rStr, cStr] = key.split(',');
        const r = rStr === 'x' ? null : Number(rStr);
        const c = cStr === 'x' ? null : Number(cStr);
        return new RCIdx(r, c);
    }

    /**
     * Returns true if this represents an entire row (column is wildcard).
     * @returns {boolean}
     */
    isRow() {
        return this.#valid(this.row) && !this.#valid(this.col);
    }

    /**
     * Returns true if this represents an entire column (row is wildcard).
     * @returns {boolean}
     */
    isCol() {
        return this.#valid(this.col) && !this.#valid(this.row);
    }

    /**
     * Returns the list of attached CellIdx objects this RCIdx refers to.
     * Requires the board size to generate all matching cells.
     * @param {number} board_size
     * @returns {CellIdx[]}
     */
    attachedCells(board_size) {
        const cells = [];
        if (this.#valid(this.row) && this.#valid(this.col)) {
            cells.push(new CellIdx(this.row, this.col));
        } else if (this.isRow()) {
            for (let j = 0; j < board_size; ++j) {
                cells.push(new CellIdx(this.row, j));
            }
        } else if (this.isCol()) {
            for (let i = 0; i < board_size; ++i) {
                cells.push(new CellIdx(i, this.col));
            }
        } else {
            // Both row and col are null → full grid
            for (let i = 0; i < board_size; ++i) {
                for (let j = 0; j < board_size; ++j) {
                    cells.push(new CellIdx(i, j));
                }
            }
        }
        return cells;
    }

    #valid(idx) {
        return idx !== null && idx >= 0 && idx < board_size && Number.isInteger(idx) && !isNaN(idx);
    }
}
