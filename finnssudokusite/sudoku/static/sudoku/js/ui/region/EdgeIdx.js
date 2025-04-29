export class EdgeIdx {
    constructor(r1, c1, r2, c2) {
        // Normalize to ensure consistent ordering
        if (r1 < r2 || (r1 === r2 && c1 <= c2)) {
            this.r1 = r1; this.c1 = c1;
            this.r2 = r2; this.c2 = c2;
        } else {
            this.r1 = r2; this.c1 = c2;
            this.r2 = r1; this.c2 = c1;
        }
    }

    toString() {
        return `${this.r1},${this.c1}-${this.r2},${this.c2}`;
    }

    equals(other) {
        return (
            other instanceof EdgeIdx &&
            this.r1 === other.r1 && this.c1 === other.c1 &&
            this.r2 === other.r2 && this.c2 === other.c2
        );
    }

    copy() {
        return new EdgeIdx(this.r1, this.c1, this.r2, this.c2);
    }

    static fromString(key) {
        const [a, b] = key.split('-');
        const [r1, c1] = a.split(',').map(Number);
        const [r2, c2] = b.split(',').map(Number);
        return new EdgeIdx(r1, c1, r2, c2);
    }
}
