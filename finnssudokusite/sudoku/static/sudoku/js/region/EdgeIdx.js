/**
 * EdgeIdx.js
 *
 * Represents an edge between two adjacent points in a grid, defined by its two endpoints.
 * The edge is normalized to ensure consistent ordering.
 */

import { CellIdx } from './CellIdx.js';

export class EdgeIdx {
    /**
     * Constructs an EdgeIdx between two points (r1,c1) and (r2,c2).
     * @param {number} r1 - First row index.
     * @param {number} c1 - First column index.
     * @param {number} r2 - Second row index.
     * @param {number} c2 - Second column index.
     */
    constructor(r1, c1, r2, c2) {
        // Normalize to ensure consistent ordering
        if (r1 < r2 || (r1 === r2 && c1 <= c2)) {
            /** @type {number} */
            this.r1 = r1;
            /** @type {number} */
            this.c1 = c1;
            /** @type {number} */
            this.r2 = r2;
            /** @type {number} */
            this.c2 = c2;
        } else {
            this.r1 = r2;
            this.c1 = c2;
            this.r2 = r1;
            this.c2 = c1;
        }
    }

    /**
     * Converts the edge to a string in the format "r1,c1-r2,c2".
     * @returns {string}
     */
    toString() {
        return `${this.r1},${this.c1}-${this.r2},${this.c2}`;
    }

    /**
     * Checks if another object is equal to this EdgeIdx.
     * @param {any} other - The object to compare with.
     * @returns {boolean}
     */
    equals(other) {
        return (
            other instanceof EdgeIdx &&
            this.r1 === other.r1 && this.c1 === other.c1 &&
            this.r2 === other.r2 && this.c2 === other.c2
        );
    }

    /**
     * Creates a copy of this EdgeIdx.
     * @returns {EdgeIdx}
     */
    copy() {
        return new EdgeIdx(this.r1, this.c1, this.r2, this.c2);
    }

    /**
     * Parses a string in the format "r1,c1-r2,c2" into an EdgeIdx.
     * @param {string} key - The string to parse.
     * @returns {EdgeIdx}
     */
    static fromString(key) {
        const [a, b] = key.split('-');
        const [r1, c1] = a.split(',').map(Number);
        const [r2, c2] = b.split(',').map(Number);
        return new EdgeIdx(r1, c1, r2, c2);
    }

    /**
     * Returns the two endpoints of this edge as CellIdx objects.
     * @returns {CellIdx[]}
     */
    attachedCells() {
        return [
            new CellIdx(this.r1, this.c1),
            new CellIdx(this.r2, this.c2),
        ];
    }
}
