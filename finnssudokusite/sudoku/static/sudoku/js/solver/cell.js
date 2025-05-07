// === cell.js ===

import { EMPTY } from './defs.js';
import { CellIdx } from '../region/CellIdx.js';
import { Candidates, CAND_ALL } from './candidates.js';

export class Cell {
    /**
     * @param {number} row
     * @param {number} col
     */
    constructor(row = 0, col = 0) {
        this.pos = new CellIdx(row, col);
        this.value = EMPTY;
        this.candidates = CAND_ALL.clone();
        this.ruleCount = 0;
    }

    removeCandidate(number) {
        if (this.value !== EMPTY) return false;
        if (!this.candidates.test(number)) return false;
        this.candidates.disallow(number);
        return true;
    }

    removeCandidates(mask) {
        if (this.value !== EMPTY) return false;
        const before = this.candidates.mask;
        const inverse = mask.not();
        this.candidates.andEq(inverse);
        return this.candidates.mask !== before;
    }
}
