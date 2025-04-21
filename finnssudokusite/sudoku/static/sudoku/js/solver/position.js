// === position.js ===

export class Position {
    /**
     * @param {number} row - Row index (0–8)
     * @param {number} col - Column index (0–8)
     */
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }

    /**
     * Compare two positions
     * @param {Position} other
     * @returns {boolean}
     */
    equals(other) {
        return this.row === other.row && this.col === other.col;
    }

    /**
     * Convert to string representation
     * @returns {string}
     */
    toString() {
        return `(${this.row}, ${this.col})`;
    }
}
