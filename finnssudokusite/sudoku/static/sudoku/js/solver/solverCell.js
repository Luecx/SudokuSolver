// === solver_cell.js ===

import { NO_NUMBER } from '../number/number.js';
import { CellIdx } from '../region/CellIdx.js';
import { NumberSet } from '../number/number_set.js';

export class SolverCell {
    /**
     * Constructs a SolverCell with a position and board size.
     * @param {CellIdx} pos - Cell index
     * @param {number} size - Max number (e.g. 9 for Sudoku)
     */
    constructor(pos, size = 9) {
        this.pos = pos;
        this.size = size;
        this.value = NO_NUMBER;
        this.candidates = NumberSet.all(size);
        this.ruleCount = 0;
    }

    /**
     * Returns the current candidates.
     * If a value is already set, returns a NumberSet containing only that value.
     * @returns {NumberSet}
     */
    getCandidates() {
        return this.value !== NO_NUMBER
            ? NumberSet.fromNumber(this.value, this.size)
            : this.candidates;
    }

    removeCandidates(remove_set) {
        // return true if candidates  changed
        const before = this.candidates.raw();
        this.candidates.andEq(remove_set.not());
        const after = this.candidates.raw();
        return before !== after;
    }

    onlyAllowCandidates(allowed_set) {
        // return true if candidates changed
        const before = this.candidates.raw();
        this.candidates.andEq(allowed_set);
        const after = this.candidates.raw();
        return before !== after;
    }

    removeCandidate(number) {
        return this.removeCandidates(NumberSet.fromNumber(number));
    }
}
