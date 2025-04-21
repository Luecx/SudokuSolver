// === candidates.js ===

export class Candidates {
    static MIN = 1;
    static MAX = 9;
    static MASK_ALL = 0x03FE;  // bits 1–9
    static MASK_NONE = 0x0000;

    /**
     * @param {number} bits - raw bitmask
     */
    constructor(bits = Candidates.MASK_NONE) {
        this.mask = bits & Candidates.MASK_ALL;
    }

    static fromNumber(n) {
        return new Candidates(1 << n);
    }

    clone() {
        return new Candidates(this.mask);
    }

    allow(n) {
        if (n < Candidates.MIN || n > Candidates.MAX) throw new RangeError('Invalid candidate');
        this.mask |= (1 << n);
    }

    disallow(n) {
        if (n < Candidates.MIN || n > Candidates.MAX) throw new RangeError('Invalid candidate');
        this.mask &= ~(1 << n);
    }

    test(n) {
        if (n < Candidates.MIN || n > Candidates.MAX) throw new RangeError('Invalid candidate');
        return (this.mask & (1 << n)) !== 0;
    }

    clear() {
        this.mask = Candidates.MASK_NONE;
    }

    setAll() {
        this.mask = Candidates.MASK_ALL;
    }

    raw() {
        return this.mask;
    }

    count() {
        let m = this.mask;
        let count = 0;
        while (m) {
            m &= (m - 1);
            count++;
        }
        return count;
    }

    lowest() {
        if (this.mask === 0) return 0;
        for (let i = Candidates.MIN; i <= Candidates.MAX; ++i) {
            if (this.test(i)) return i;
        }
        return 0;
    }

    *[Symbol.iterator]() {
        for (let i = Candidates.MIN; i <= Candidates.MAX; ++i) {
            if (this.test(i)) yield i;
        }
    }

    equals(other) {
        return this.mask === other.mask;
    }

    and(other) {
        return new Candidates(this.mask & other.mask);
    }

    or(other) {
        return new Candidates(this.mask | other.mask);
    }

    xor(other) {
        return new Candidates(this.mask ^ other.mask);
    }

    not() {
        return new Candidates(~this.mask & Candidates.MASK_ALL);
    }

    andEq(other) {
        this.mask &= other.mask;
    }

    orEq(other) {
        this.mask |= other.mask;
    }

    xorEq(other) {
        this.mask ^= other.mask;
    }

    toString() {
        // Show bits from digit 1 (MSB) to digit 9 (LSB)
        let bitStr = '';
        for (let i = Candidates.MIN; i <= Candidates.MAX; ++i) {
            bitStr += this.test(i) ? '1' : '0';
        }
        return bitStr;
    }

}

// === Predefined candidate sets ===
export const CAND_EVEN = new Candidates(0b0101010100); // bits for 2, 4, 6, 8
export const CAND_ODD  = new Candidates(0b1010101010); // bits for 1, 3, 5, 7, 9
export const CAND_ALL  = new Candidates(Candidates.MASK_ALL);
export const CAND_NONE = new Candidates(Candidates.MASK_NONE);
