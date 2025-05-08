import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

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
        const cands = new NumberSet(9, bits);

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

function getLineCells(board, rcidx) {
    if (rcidx.row != null && rcidx.row >= 0) {
        return Array.from({ length: 9 }, (_, c) => board.getCell({ r: rcidx.row, c }));
    } else if (rcidx.col != null && rcidx.col >= 0) {
        return Array.from({ length: 9 }, (_, r) => board.getCell({ r, c: rcidx.col }));
    }
    return [];
}

function checkSandwich(board, rcidx, sum) {
    const line = getLineCells(board, rcidx);
    if (line.length !== 9) return false;

    const minD = minDigits[sum];
    const maxD = maxDigits[sum];
    let idx1 = -1, idx9 = -1;
    let changed = false;

    for (let i = 0; i < 9; i++) {
        if (line[i].value === 1) idx1 = i;
        if (line[i].value === 9) idx9 = i;
    }

    if (idx1 === -1 && idx9 === -1) {
        // Both are unknown
        for (let i = 0; i < 9; i++) {
            const c = line[i];
            if (c.value !== NO_NUMBER) continue;

            if (c.candidates.test(1) && !hasPossiblePair(i, line, 9, minD, maxD)) {
                c.candidates.disallow(1);
                changed = true;
            }
            if (c.candidates.test(9) && !hasPossiblePair(i, line, 1, minD, maxD)) {
                c.candidates.disallow(9);
                changed = true;
            }
        }
    } else if (idx1 === -1 || idx9 === -1) {
        // One known
        const known = idx1 !== -1 ? 1 : 9;
        const unknown = known === 1 ? 9 : 1;
        const idxKnown = known === 1 ? idx1 : idx9;

        for (let i = 0; i < 9; i++) {
            const c = line[i];
            if (c.value !== NO_NUMBER || !c.candidates.test(unknown)) continue;

            const dist = Math.abs(i - idxKnown) - 1;
            if (dist < minD || dist > maxD) {
                c.candidates.disallow(unknown);
                changed = true;
            }
        }
    } else {
        // Both known
        const left = Math.min(idx1, idx9);
        const right = Math.max(idx1, idx9);
        const between = right - left - 1;

        if (between >= minD && between <= maxD) {
            let union = new NumberSet();
            for (const comb of validCombinations[sum][between]) {
                union = union.or(comb);
            }

            for (let i = left + 1; i < right; i++) {
                const c = line[i];
                if (c.value !== NO_NUMBER) continue;

                for (let d = 1; d <= 9; d++) {
                    if (c.candidates.test(d) && !union.test(d)) {
                        c.candidates.disallow(d);
                        changed = true;
                    }
                }
            }
        }
    }

    return changed;
}

function hasPossiblePair(i, line, otherDigit, minD, maxD) {
    for (let j = 0; j < 9; j++) {
        if (j === i) continue;
        const peer = line[j];
        if (peer.value === otherDigit || (peer.value === NO_NUMBER && peer.candidates.test(otherDigit))) {
            const cnt = Math.abs(j - i) - 1;
            if (cnt >= minD && cnt <= maxD) return true;
        }
    }
    return false;
}

export function attachSandwichSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            const sum = rule.fields?.sum;
            if (!region || !sum) continue;

            for (const rcidx of region.items) {
                if (rcidx.row === changedCell.pos.r || rcidx.col === changedCell.pos.c) {
                    changed ||= checkSandwich(board, rcidx, sum);
                }
            }
        }
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            const sum = rule.fields?.sum;
            if (!region || !sum) continue;

            for (const rcidx of region.items) {
                changed ||= checkSandwich(board, rcidx, sum);
            }
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            const sum = rule.fields?.sum;
            if (!region || !sum) continue;

            for (const rcidx of region.items) {
                const line = getLineCells(board, rcidx);

                let idx1 = -1, idx9 = -1;
                for (let i = 0; i < 9; i++) {
                    if (line[i].value === 1) idx1 = i;
                    if (line[i].value === 9) idx9 = i;
                }

                if (idx1 < 0 || idx9 < 0) continue;

                const left = Math.min(idx1, idx9);
                const right = Math.max(idx1, idx9);
                let actual = 0;

                for (let i = left + 1; i < right; i++) {
                    const v = line[i].value;
                    if (v === NO_NUMBER) return true;
                    actual += v;
                }

                if (actual !== sum) return false;
            }
        }

        return true;
    };
}
