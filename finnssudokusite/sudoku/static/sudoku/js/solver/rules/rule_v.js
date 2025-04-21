// === rule_v.js ===

import { Rule } from './rule.js';
import { EMPTY } from '../defs.js';
import { Candidates } from '../candidates.js';
import { Position } from '../position.js';

const V_TARGET = 5;

export class VRule extends Rule {
    /**
     * @param {Position} pos1
     * @param {Position} pos2
     */
    constructor(pos1, pos2) {
        super();
        this.pos1 = pos1;
        this.pos2 = pos2;
    }

    numberChanged(board, _changedCell) {
        return this.candidatesChanged(board);
    }

    candidatesChanged(board) {
        let changed = false;
        const c1 = board.getCell(this.pos1);
        const c2 = board.getCell(this.pos2);
        const a = c1.candidates;
        const b = c2.candidates;

        if (c1.value !== EMPTY && c2.value === EMPTY) {
            const need = V_TARGET - c1.value;
            for (let d = Candidates.MIN; d <= Candidates.MAX; d++) {
                if (b.test(d) && d !== need) {
                    b.disallow(d);
                    changed = true;
                }
            }
        } else if (c2.value !== EMPTY && c1.value === EMPTY) {
            const need = V_TARGET - c2.value;
            for (let d = Candidates.MIN; d <= Candidates.MAX; d++) {
                if (a.test(d) && d !== need) {
                    a.disallow(d);
                    changed = true;
                }
            }
        } else if (c1.value === EMPTY && c2.value === EMPTY) {
            for (let d = Candidates.MIN; d <= Candidates.MAX; d++) {
                if (a.test(d)) {
                    const comp = V_TARGET - d;
                    if (
                        comp < Candidates.MIN ||
                        comp > Candidates.MAX ||
                        !b.test(comp)
                    ) {
                        a.disallow(d);
                        changed = true;
                    }
                }

                if (b.test(d)) {
                    const comp = V_TARGET - d;
                    if (
                        comp < Candidates.MIN ||
                        comp > Candidates.MAX ||
                        !a.test(comp)
                    ) {
                        b.disallow(d);
                        changed = true;
                    }
                }
            }
        }

        return changed;
    }

    checkPlausibility(board) {
        const c1 = board.getCell(this.pos1);
        const c2 = board.getCell(this.pos2);
        if (c1.value !== EMPTY && c2.value !== EMPTY) {
            return c1.value + c2.value === V_TARGET;
        }
        return true;
    }
}
