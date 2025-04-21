// === rule_white_kropki.js ===

import { Rule } from './rule.js';
import { EMPTY } from '../defs.js';
import { Candidates } from '../candidates.js';
import { Position } from '../position.js';

export class WhiteKropki extends Rule {
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
            if (a.value > 1)
                allowed.orEq(Candidates.fromNumber(a.value - 1));
            if (a.value < 9)
                allowed.orEq(Candidates.fromNumber(a.value + 1));
            const before = b.candidates.clone();
            b.candidates.andEq(allowed);
            if (!b.candidates.equals(before)) changed = true;
        }

        if (b.value !== EMPTY && a.value === EMPTY) {
            const allowed = new Candidates();
            if (b.value > 1)
                allowed.orEq(Candidates.fromNumber(b.value - 1));
            if (b.value < 9)
                allowed.orEq(Candidates.fromNumber(b.value + 1));
            const before = a.candidates.clone();
            a.candidates.andEq(allowed);
            if (!a.candidates.equals(before)) changed = true;
        }

        return changed;
    }

    candidatesChanged(board) {
        const a = board.getCell(this.pos1);
        const b = board.getCell(this.pos2);

        if (a.value !== EMPTY || b.value !== EMPTY)
            return false;

        let changed = false;

        for (const n of [...a.candidates]) {
            const hasLower = n > 1 && b.candidates.test(n - 1);
            const hasHigher = n < 9 && b.candidates.test(n + 1);
            if (!hasLower && !hasHigher) {
                a.candidates.andEq(new Candidates(~(1 << n) & Candidates.MASK_ALL));
                changed = true;
            }
        }

        for (const n of [...b.candidates]) {
            const hasLower = n > 1 && a.candidates.test(n - 1);
            const hasHigher = n < 9 && a.candidates.test(n + 1);
            if (!hasLower && !hasHigher) {
                b.candidates.andEq(new Candidates(~(1 << n) & Candidates.MASK_ALL));
                changed = true;
            }
        }

        return changed;
    }

    checkPlausibility(board) {
        const a = board.getCell(this.pos1);
        const b = board.getCell(this.pos2);
        if (a.value !== EMPTY && b.value !== EMPTY)
            return Math.abs(a.value - b.value) === 1;
        return true;
    }
}
