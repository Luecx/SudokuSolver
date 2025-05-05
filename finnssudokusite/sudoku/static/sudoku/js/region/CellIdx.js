export class CellIdx {
    constructor(r, c) {
        this.r = r;
        this.c = c;
    }

    toString() {
        return `${this.r},${this.c}`;
    }

    equals(other) {
        return other instanceof CellIdx && this.r === other.r && this.c === other.c;
    }

    copy() {
        return new CellIdx(this.r, this.c);
    }

    static fromString(key) {
        const [r, c] = key.split(',').map(Number);
        return new CellIdx(r, c);
    }
}
