/**
 * NumberSet.js
 *
 * Represents a set of digits (1 to max) using a bitmask.
 * Efficient for logic puzzles and general numeric filtering.
 *
 * Example usage:
 *   const s = new NumberSet(9);
 *   s.allow(5);
 *   console.log([...s]); // → [5]
 *   const odds = NumberSet.odd(9);
 *   const even = NumberSet.even(9);
 *   const all = odds.or(even);
 */

export class NumberSet {
    /**
     * Constructs a new NumberSet.
     * Digits are in the range [1, max], stored as a bitmask.
     *
     * @param {number} max - The highest digit allowed (inclusive).
     * @param {number} bits - Optional bitmask to initialize from.
     */
    constructor(max = 9, bits = 0x0000) {
        this.min = 1;
        this.max = max;
        this.mask_all = 0;
        for (let i = this.min; i <= this.max; ++i) {
            this.mask_all |= (1 << i);
        }
        this.mask = bits & this.mask_all;
    }

    // === Instance Methods ===

    /**
     * Creates a deep copy of this NumberSet.
     * @returns {NumberSet}
     */
    clone() {
        return new NumberSet(this.max, this.mask);
    }

    /**
     * Enables digit `n` in the set.
     * @param {number} n
     */
    allow(n) {
        this.#validate(n);
        this.mask |= (1 << n) & this.mask_all;
    }

    /**
     * Disables digit `n` in the set.
     * @param {number} n
     */
    disallow(n) {
        this.#validate(n);
        this.mask &= ~(1 << n) & this.mask_all;
    }

    /**
     * Checks if digit `n` is allowed.
     * @param {number} n
     * @returns {boolean}
     */
    test(n) {
        this.#validate(n);
        return (this.mask & (1 << n)) !== 0;
    }

    /**
     * Disables all digits.
     */
    clear() {
        this.mask = 0x0000;
    }

    /**
     * Enables all digits [1, max].
     */
    setAll() {
        this.mask = this.mask_all;
    }

    /**
     * Returns the raw bitmask.
     * @returns {number}
     */
    raw() {
        return this.mask;
    }

    /**
     * Counts the number of digits currently allowed.
     * @returns {number}
     */
    count() {
        let m = this.mask, count = 0;
        while (m) {
            m &= (m - 1);
            count++;
        }
        return count;
    }

    /**
     * Returns the lowest digit in the set, or 0 if empty.
     * @returns {number}
     */
    lowest() {
        if (this.mask === 0) return 0;
        for (let i = this.min; i <= this.max; ++i) {
            if (this.test(i)) return i;
        }
        return 0;
    }

    highest() {
        if (this.mask === 0) return 0;
        for (let i = this.max; i >= this.min; --i) {
            if (this.test(i)) return i;
        }
        return 0;
    }

    /**
     * Binary string representation from 1 to max.
     * @returns {string}
     */
    toString() {
        let str = '';
        for (let i = this.min; i <= this.max; ++i) {
            str += this.test(i) ? '1' : '0';
        }
        return str;
    }

    /**
     * Iterates over allowed digits.
     * @returns {Generator<number>}
     */
    *[Symbol.iterator]() {
        for (let i = this.min; i <= this.max; ++i) {
            if (this.test(i)) yield i;
        }
    }

    /**
     * Checks equality with another NumberSet.
     * @param {NumberSet} other
     * @returns {boolean}
     */
    equals(other) {
        this.#validateMatch(other);
        return this.mask === other.mask;
    }

    /**
     * Returns intersection with another set.
     * @param {NumberSet} other
     * @returns {NumberSet}
     */
    and(other) {
        this.#validateMatch(other);
        return new NumberSet(this.max, this.mask & other.mask);
    }

    /**
     * Returns union with another set.
     * @param {NumberSet} other
     * @returns {NumberSet}
     */
    or(other) {
        this.#validateMatch(other);
        return new NumberSet(this.max, this.mask | other.mask);
    }

    /**
     * Returns symmetric difference with another set.
     * @param {NumberSet} other
     * @returns {NumberSet}
     */
    xor(other) {
        this.#validateMatch(other);
        return new NumberSet(this.max, this.mask ^ other.mask);
    }

    /**
     * Inverts the bitmask over the valid range [1, max].
     * @returns {NumberSet}
     */
    not() {
        return new NumberSet(this.max, ~this.mask & NumberSet.all(this.max).mask);
    }

    /**
     * In-place intersection.
     * @param {NumberSet} other
     */
    andEq(other) {
        this.#validateMatch(other);
        this.mask &= other.mask;
    }

    /**
     * In-place union.
     * @param {NumberSet} other
     */
    orEq(other) {
        this.#validateMatch(other);
        this.mask |= other.mask;
    }

    /**
     * In-place symmetric difference.
     * @param {NumberSet} other
     */
    xorEq(other) {
        this.#validateMatch(other);
        this.mask ^= other.mask;
    }

    /**
     * Returns a new NumberSet with all allowed digits shifted left (incremented by 1).
     * Digits exceeding `max` are discarded.
     * @returns {NumberSet}
     */
    shiftLeft() {
        let shifted = (this.mask << 1) & this.mask_all;
        return new NumberSet(this.max, shifted);
    }

    /**
     * Returns a new NumberSet with all allowed digits shifted right (decremented by 1).
     * Digits below 1 are discarded.
     * @returns {NumberSet}
     */
    shiftRight() {
        // mask_all shifted right by 1, then mask
        let shifted = (this.mask >> 1) & this.mask_all;
        return new NumberSet(this.max, shifted);
    }


    #validate(n) {
        if (!Number.isInteger(n) || n < this.min || n > this.max) {
            throw new RangeError(`Digit must be between ${this.min} and ${this.max}`);
        }
    }

    #validateMatch(other) {
        if (!(other instanceof NumberSet)) {
            throw new TypeError("Argument must be a NumberSet");
        }
        if (other.max !== this.max) {
            throw new Error(`Mismatched max: ${this.max} vs ${other.max}`);
        }
    }

    // === Static Factory Methods ===

    /**
     * Returns a NumberSet with only digit `n` allowed.
     * @param {number} n
     * @param {number} max
     * @returns {NumberSet}
     */
    static fromNumber(n, max = 9) {
        return new NumberSet(max, 1 << n);
    }

    /**
     * All even digits [2, 4, ..., max].
     * @param {number} max
     * @returns {NumberSet}
     */
    static even(max = 9) {
        let bits = 0;
        for (let i = 2; i <= max; i += 2) bits |= (1 << i);
        return new NumberSet(max, bits);
    }

    /**
     * All odd digits [1, 3, ..., max].
     * @param {number} max
     * @returns {NumberSet}
     */
    static odd(max = 9) {
        let bits = 0;
        for (let i = 1; i <= max; i += 2) bits |= (1 << i);
        return new NumberSet(max, bits);
    }

    /**
     * All digits [1, max].
     * @param {number} max
     * @returns {NumberSet}
     */
    static all(max = 9) {
        let bits = 0;
        for (let i = 1; i <= max; ++i) bits |= (1 << i);
        return new NumberSet(max, bits);
    }

    /**
     * No digits allowed.
     * @param {number} max
     * @returns {NumberSet}
     */
    static none(max = 9) {
        return new NumberSet(max, 0x0000);
    }

    /**
     * Digits > n
     * @param {number} n
     * @param {number} max
     * @returns {NumberSet}
     *
     * @example
     * NumberSet.greaterThan(6, 9) → 7, 8, 9
     */
    static greaterThan(n, max = 9) {
        let bits = 0;
        for (let i = n + 1; i <= max; i++) bits |= (1 << i);
        return new NumberSet(max, bits);
    }

    /**
     * Digits ≥ n
     * @param {number} n
     * @param {number} max
     * @returns {NumberSet}
     *
     * @example
     * NumberSet.greaterEqThan(6, 9) → 6, 7, 8, 9
     */
    static greaterEqThan(n, max = 9) {
        let bits = 0;
        for (let i = n; i <= max; i++) bits |= (1 << i);
        return new NumberSet(max, bits);
    }

    /**
     * Digits < n
     * @param {number} n
     * @param {number} max
     * @returns {NumberSet}
     *
     * @example
     * NumberSet.lessThan(4, 9) → 1, 2, 3
     */
    static lessThan(n, max = 9) {
        let bits = 0;
        for (let i = 1; i < n; i++) bits |= (1 << i);
        return new NumberSet(max, bits);
    }

    /**
     * Digits ≤ n
     * @param {number} n
     * @param {number} max
     * @returns {NumberSet}
     *
     * @example
     * NumberSet.lessEqThan(4, 9) → 1, 2, 3, 4
     */
    static lessEqThan(n, max = 9) {
        let bits = 0;
        for (let i = 1; i <= n; i++) bits |= (1 << i);
        return new NumberSet(max, bits);
    }
}
