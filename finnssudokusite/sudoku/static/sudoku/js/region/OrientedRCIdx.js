/**
 * OrientedRCIdx.js
 *
 * Extends RCIdx by adding an orientation (normal or reversed).
 * Used to represent directional hints like pointing arrows from rows or columns.
 */

import { CellIdx } from './CellIdx.js';

export class OrientedRCIdx {
    /**
     * Constructs an OrientedRCIdx.
     * @param {number|null} row - Row index, or null for wildcard.
     * @param {number|null} col - Column index, or null for wildcard.
     * @param {boolean} reversed - If true, the direction is reversed.
     */
    constructor(row, col, reversed = false) {
        /** @type {number|null} */
        this.row = row;

        /** @type {number|null} */
        this.col = col;

        /** @type {boolean} */
        this.reversed = reversed;
    }

    /**
     * Converts to a string format: `r,c,d` where `d` is 1 (reversed) or 0 (normal).
     * @returns {string}
     */
    toString() {
        const r = this.row === null ? 'x' : this.row;
        const c = this.col === null ? 'x' : this.col;
        return `${r},${c},${this.reversed ? 1 : 0}`;
    }

    /**
     * Creates from a string in the format `r,c,d`.
     * @param {string} key
     * @returns {OrientedRCIdx}
     */
    static fromString(key) {
        const [rStr, cStr, dStr] = key.split(',');
        const row = rStr === 'x' ? null : Number(rStr);
        const col = cStr === 'x' ? null : Number(cStr);
        const reversed = dStr === '1';
        return new OrientedRCIdx(row, col, reversed);
    }

    /**
     * Checks equality with another OrientedRCIdx.
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        if (!(other instanceof OrientedRCIdx)) return false;

        const isWildcard = (v) => v == null || Number.isNaN(v);

        const rowEqual = (this.row === other.row) || (isWildcard(this.row) && isWildcard(other.row));
        const colEqual = (this.col === other.col) || (isWildcard(this.col) && isWildcard(other.col));

        return rowEqual && colEqual && this.reversed === other.reversed;
    }


    /**
     * Returns true if this represents a full row.
     * @returns {boolean}
     */
    isRow() {
        return this.#valid(this.row) && !this.#valid(this.col);
    }

    /**
     * Returns true if this represents a full column.
     * @returns {boolean}
     */
    isCol() {
        return this.#valid(this.col) && !this.#valid(this.row);
    }

    /**
     * Returns true if this is a single cell.
     * @returns {boolean}
     */
    isCell() {
        return this.#valid(this.row) && this.#valid(this.col);
    }

    /**
     * Returns a list of CellIdxs this OrientedRCIdx refers to.
     * @param {number} board_size
     * @returns {CellIdx[]}
     */
    attachedCells(board_size) {
        const cells = [];
        if (this.isCell()) {
            cells.push(new CellIdx(this.row, this.col));
        } else if (this.isRow()) {
            const r = this.row;
            const cols = [...Array(board_size).keys()];
            if (this.reversed) cols.reverse();
            for (const c of cols) cells.push(new CellIdx(r, c));
        } else if (this.isCol()) {
            const c = this.col;
            const rows = [...Array(board_size).keys()];
            if (this.reversed) rows.reverse();
            for (const r of rows) cells.push(new CellIdx(r, c));
        } else {
            const rows = [...Array(board_size).keys()];
            const cols = [...Array(board_size).keys()];
            if (this.reversed) {
                rows.reverse();
                cols.reverse();
            }
            for (const r of rows) {
                for (const c of cols) {
                    cells.push(new CellIdx(r, c));
                }
            }
        }
        return cells;
    }

    /**
     * Returns a copy of the current instance.
     * @returns {OrientedRCIdx}
     */
    copy() {
        return new OrientedRCIdx(this.row, this.col, this.reversed);
    }

    #valid(idx) {
        return idx !== null && Number.isInteger(idx) && idx >= 0;
    }
}
