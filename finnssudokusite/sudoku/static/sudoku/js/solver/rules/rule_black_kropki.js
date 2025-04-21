import { Rule } from './rule.js';
import { EMPTY } from '../defs.js';
import { Candidates } from '../candidates.js';
import { Position } from '../position.js';

export class BlackKropki extends Rule {
    /**
     * @param {Position} pos1
     * @param {Position} pos2
     */
    constructor(pos1, pos2) {
        super();
        this.pos1 = pos1;
        this.pos2 = pos2;
    }

    numberChanged(board, changedCell) {
        const a = board.getCell(this.pos1);
        const b = board.getCell(this.pos2);
        let changed = false;

        if (a.value !== EMPTY && b.value === EMPTY) {
            const allowed = new Candidates();
            if (a.value % 2 === 0 && a.value / 2 >= 1)
                allowed.orEq(Candidates.fromNumber(a.value / 2));
            if (a.value * 2 <= 9)
                allowed.orEq(Candidates.fromNumber(a.value * 2));
            const before = b.candidates.clone();
            b.candidates.andEq(allowed);
            if (!b.candidates.equals(before)) changed = true;
        }

        if (b.value !== EMPTY && a.value === EMPTY) {
            const allowed = new Candidates();
            if (b.value % 2 === 0 && b.value / 2 >= 1)
                allowed.orEq(Candidates.fromNumber(b.value / 2));
            if (b.value * 2 <= 9)
                allowed.orEq(Candidates.fromNumber(b.value * 2));
            const before = a.candidates.clone();
            a.candidates.andEq(allowed);
            if (!a.candidates.equals(before)) changed = true;
        }

        return changed;
    }

    candidatesChanged(board) {
        const a = board.getCell(this.pos1);
        const b = board.getCell(this.pos2);
        let changed = false;

        if (a.value !== EMPTY || b.value !== EMPTY)
            return false;

        // Remove values that can never be part of a black dot pair
        for (const n of [5, 7, 9]) {
            if (a.candidates.test(n)) {
                a.candidates.andEq(new Candidates(~(1 << n) & Candidates.MASK_ALL));
                changed = true;
            }
            if (b.candidates.test(n)) {
                b.candidates.andEq(new Candidates(~(1 << n) & Candidates.MASK_ALL));
                changed = true;
            }
        }

        for (const c of [...a.candidates]) {
            const hasLower = c > 1 && c % 2 === 0 && b.candidates.test(c / 2);
            const hasHigher = c <= 4 && b.candidates.test(c * 2);
            if (!hasLower && !hasHigher) {
                a.candidates.andEq(new Candidates(~(1 << c) & Candidates.MASK_ALL));
                changed = true;
            }
        }

        for (const c of [...b.candidates]) {
            const hasLower = c > 1 && c % 2 === 0 && a.candidates.test(c / 2);
            const hasHigher = c <= 4 && a.candidates.test(c * 2);
            if (!hasLower && !hasHigher) {
                b.candidates.andEq(new Candidates(~(1 << c) & Candidates.MASK_ALL));
                changed = true;
            }
        }

        // Explicitly filter impossible pairs
        if (!a.candidates.test(4) && b.candidates.test(8)) {
            b.candidates.andEq(new Candidates(~(1 << 8) & Candidates.MASK_ALL));
            changed = true;
        }

        if (!a.candidates.test(3) && b.candidates.test(6)) {
            b.candidates.andEq(new Candidates(~(1 << 6) & Candidates.MASK_ALL));
            changed = true;
        }

        if (!b.candidates.test(4) && a.candidates.test(8)) {
            a.candidates.andEq(new Candidates(~(1 << 8) & Candidates.MASK_ALL));
            changed = true;
        }

        if (!b.candidates.test(3) && a.candidates.test(6)) {
            a.candidates.andEq(new Candidates(~(1 << 6) & Candidates.MASK_ALL));
            changed = true;
        }

        return changed;
    }

    checkPlausibility(board) {
        const a = board.getCell(this.pos1);
        const b = board.getCell(this.pos2);
        if (a.value !== EMPTY && b.value !== EMPTY) {
            return a.value === 2 * b.value || b.value === 2 * a.value;
        }
        return true;
    }
}
