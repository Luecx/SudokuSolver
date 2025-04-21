// === rule_sandwich.js ===

import { Rule } from './rule.js';
import { EMPTY, BOARD_SIZE } from '../defs.js';
import { Candidates } from '../candidates.js';
import { Position } from '../position.js';

// ──────────────────────────────────────────────────────────────────────────────
// Static precomputed valid combinations excluding 1 & 9
// ──────────────────────────────────────────────────────────────────────────────

const validCombinations = [];
const minDigits = [];
const maxDigits = [];

(function generateSandwichTables() {
    const digitMin = 1;
    const digitMax = 9;
    const numDigits = digitMax - digitMin + 1;
    const maxSum = (digitMax * (digitMax + 1)) / 2;

    for (let s = 0; s <= maxSum; s++) {
        validCombinations[s] = Array.from({ length: numDigits + 1 }, () => []);
        minDigits[s] = numDigits + 1;
        maxDigits[s] = 0;
    }

    const maxMask = 1 << numDigits;
    for (let mask = 1; mask < maxMask; mask++) {
        const bits = mask << 1;
        const cands = new Candidates(bits);

        let sum = 0;
        let count = 0;
        let has1 = false, has9 = false;

        for (let d = digitMin; d <= digitMax; d++) {
            if (!cands.test(d)) continue;
            sum += d;
            count++;
            has1 ||= (d === 1);
            has9 ||= (d === 9);
        }

        if (has1 || has9 || sum > maxSum || count === 0) continue;

        validCombinations[sum][count].push(cands);
        minDigits[sum] = Math.min(minDigits[sum], count);
        maxDigits[sum] = Math.max(maxDigits[sum], count);
    }

    for (let s = 0; s <= maxSum; s++) {
        if (minDigits[s] > numDigits) {
            minDigits[s] = 0;
            maxDigits[s] = 0;
        }
    }
})();

// ──────────────────────────────────────────────────────────────────────────────

export class Sandwich extends Rule {
    constructor(num, row, col) {
        super();
        this.num = num;
        this.row = row;
        this.col = col;
    }

    numberChanged(board, changedCell) {
        return this.candidatesChanged(board);
    }

    candidatesChanged(board) {
        let changed = false;
        const line = this.row === -1 ? board.getCol(this.col) : board.getRow(this.row);

        let idx1 = -1, idx9 = -1;
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (line[i].value === 1) idx1 = i;
            if (line[i].value === 9) idx9 = i;
        }

        const maxSum = (9 * 10) / 2;
        if (this.num < 0 || this.num > maxSum) return false;

        const minD = minDigits[this.num];
        const maxD = maxDigits[this.num];

        if (idx1 === -1 && idx9 === -1) {
            for (let i = 0; i < BOARD_SIZE; i++) {
                const c = line[i];
                if (c.value !== EMPTY || !c.candidates.test(1)) continue;
                let ok = false;
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (j === i) continue;
                    const peer = line[j];
                    const is9 = peer.value === 9 || (peer.value === EMPTY && peer.candidates.test(9));
                    if (!is9) continue;
                    const cnt = Math.abs(j - i) - 1;
                    if (cnt >= minD && cnt <= maxD) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) {
                    c.candidates.disallow(1);
                    changed = true;
                }
            }

            for (let i = 0; i < BOARD_SIZE; i++) {
                const c = line[i];
                if (c.value !== EMPTY || !c.candidates.test(9)) continue;
                let ok = false;
                for (let j = 0; j < BOARD_SIZE; j++) {
                    if (j === i) continue;
                    const peer = line[j];
                    const is1 = peer.value === 1 || (peer.value === EMPTY && peer.candidates.test(1));
                    if (!is1) continue;
                    const cnt = Math.abs(j - i) - 1;
                    if (cnt >= minD && cnt <= maxD) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) {
                    c.candidates.disallow(9);
                    changed = true;
                }
            }
        } else if (idx1 === -1 || idx9 === -1) {
            const known = idx1 !== -1 ? 1 : 9;
            const unknown = known === 1 ? 9 : 1;
            const idxKnown = known === 1 ? idx1 : idx9;

            for (let i = 0; i < BOARD_SIZE; i++) {
                const c = line[i];
                if (c.value !== EMPTY || !c.candidates.test(unknown)) continue;
                const cnt = Math.abs(idxKnown - i) - 1;
                if (cnt < minD || cnt > maxD) {
                    c.candidates.disallow(unknown);
                    changed = true;
                }
            }
        } else {
            const left = Math.min(idx1, idx9);
            const right = Math.max(idx1, idx9);
            const cnt = right - left - 1;

            if (cnt >= minD && cnt <= maxD) {
                let unionCands = new Candidates();
                for (const vec of validCombinations[this.num][cnt]) {
                    unionCands = unionCands.or(vec);
                }

                for (let i = left + 1; i < right; i++) {
                    const c = line[i];
                    if (c.value !== EMPTY) continue;
                    for (let d = 1; d <= 9; d++) {
                        if (c.candidates.test(d) && !unionCands.test(d)) {
                            c.candidates.disallow(d);
                            changed = true;
                        }
                    }
                }
            }
        }

        return changed;
    }

    checkPlausibility(board) {
        const line = this.row === -1 ? board.getCol(this.col) : board.getRow(this.row);

        let idx1 = -1, idx9 = -1;
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (line[i].value === 1) idx1 = i;
            if (line[i].value === 9) idx9 = i;
        }
        if (idx1 < 0 || idx9 < 0) return true;

        const left = Math.min(idx1, idx9);
        const right = Math.max(idx1, idx9);
        let minSum = 0, maxSum = 0;

        for (let i = left + 1; i < right; i++) {
            const cell = line[i];
            if (cell.value !== EMPTY) {
                minSum += cell.value;
                maxSum += cell.value;
            } else {
                const lo = cell.candidates.lowest();
                let hi = 0;
                for (const d of cell.candidates) hi = d;
                minSum += lo;
                maxSum += hi;
            }
        }

        return minSum <= this.num && this.num <= maxSum;
    }
}
