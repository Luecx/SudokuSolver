/**
 * DiagonalIdx.js
 *
 * Represents a diagonal or antidiagonal index in a square grid.
 * Main diagonals follow r - c = constant.
 * Antidiagonals follow r + c = constant.
 * Used to refer to diagonal-based constraints in Sudoku or similar puzzles.
 */

import { CellIdx } from './CellIdx.js';

export class DiagonalIdx {
    /**
     * Constructs a DiagonalIdx.
     * @param {'main'|'anti'} type - The type of diagonal: 'main' or 'anti'.
     * @param {number} index - Diagonal index: r - c for main, r + c for anti.
     */
    constructor(type, index) {
        if (type !== 'main' && type !== 'anti') {
            throw new Error(`Invalid diagonal type: ${type}`);
        }

        /** @type {'main'|'anti'} */
        this.type = type;

        /** @type {number} */
        this.index = index;
    }

    /**
     * Converts the DiagonalIdx to a string key.
     * @returns {string}
     */
    toString() {
        return `${this.type}:${this.index}`;
    }

    /**
     * Returns true if this DiagonalIdx matches another.
     * @param {any} other
     * @returns {boolean}
     */
    equals(other) {
        return (
            other instanceof DiagonalIdx &&
            this.type === other.type &&
            this.index === other.index
        );
    }

    /**
     * Returns a copy of this DiagonalIdx.
     * @returns {DiagonalIdx}
     */
    copy() {
        return new DiagonalIdx(this.type, this.index);
    }

    /**
     * Creates a DiagonalIdx from a string, e.g. "main:0" or "anti:8".
     * @param {string} key
     * @returns {DiagonalIdx}
     */
    static fromString(key) {
        const [type, idx] = key.split(':');
        return new DiagonalIdx(type, Number(idx));
    }

    /**
     * Returns a list of CellIdx objects on this diagonal, given board size.
     * @param {number} board_size
     * @returns {CellIdx[]}
     */
    attachedCells(board_size) {
        const cells = [];

        if (this.type === 'main') {
            // r - c = index → r = c + index
            for (let c = 0; c < board_size; ++c) {
                const r = c + this.index;
                if (r >= 0 && r < board_size) {
                    cells.push(new CellIdx(r, c));
                }
            }
        } else if (this.type === 'anti') {
            // r + c = index → r = index - c
            for (let c = 0; c < board_size; ++c) {
                const r = this.index + c;
                if (r >= 0 && r < board_size) {
                    cells.push(new CellIdx(r, 8 - c));
                }
            }
        }

        return cells;
    }
}
