export class RCIdx {
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }

    toString() {
        return `${isNaN(this.row) ? 'x' : this.row},${isNaN(this.col) ? 'x' : this.col}`;
    }

    equals(other) {
        return other instanceof RCIdx &&
            ((isNaN(this.row) && isNaN(other.row)) || this.row === other.row) &&
            ((isNaN(this.col) && isNaN(other.col)) || this.col === other.col);
    }

    copy() {
        return new RCIdx(this.row, this.col);
    }

    static fromString(key) {
        const [rStr, cStr] = key.split(',');
        const r = rStr === 'x' ? NaN : Number(rStr);
        const c = cStr === 'x' ? NaN : Number(cStr);
        return new RCIdx(r, c);
    }
}
