import { EMPTY } from "../solver/defs.js";
import { Candidates } from "../solver/candidates.js";

// Precompute valid combinations just like before
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

function getLineCells(board, rcidx) {
    if (rcidx.row != null && rcidx.row >= 0) {
        return Array.from({ length: 9 }, (_, c) => board.getCell({ r: rcidx.row, c }));
    } else if (rcidx.col != null && rcidx.col >= 0) {
        return Array.from({ length: 9 }, (_, r) => board.getCell({ r, c: rcidx.col }));
    } else {
        return [];
    }
}

function checkSandwich(board, rcidx, sum) {
    const line = getLineCells(board, rcidx);
    if (line.length !== 9) return false;

    let idx1 = -1, idx9 = -1;
    for (let i = 0; i < 9; ++i) {
        if (line[i].value === 1) idx1 = i;
        if (line[i].value === 9) idx9 = i;
    }

    const minD = minDigits[sum];
    const maxD = maxDigits[sum];

    let changed = false;

    if (idx1 === -1 && idx9 === -1) {
        for (let i = 0; i < 9; ++i) {
            const c = line[i];
            if (c.value !== EMPTY || !c.candidates.test(1)) continue;
            let ok = false;
            for (let j = 0; j < 9; ++j) {
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

        for (let i = 0; i < 9; ++i) {
            const c = line[i];
            if (c.value !== EMPTY || !c.candidates.test(9)) continue;
            let ok = false;
            for (let j = 0; j < 9; ++j) {
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

        for (let i = 0; i < 9; ++i) {
            const c = line[i];
            if (c.value !== EMPTY || !c.candidates.test(unknown)) continue;
            const cnt = Math.abs(i - idxKnown) - 1;
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
            let union = new Candidates();
            for (const vec of validCombinations[sum][cnt]) {
                union = union.or(vec);
            }

            for (let i = left + 1; i < right; ++i) {
                const c = line[i];
                if (c.value !== EMPTY) continue;
                for (let d = 1; d <= 9; ++d) {
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

export function attachSandwichSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            const sum = rule.fields?.sum;
            if (!region || region.items.length === 0 || sum == null) continue;

            for (const rcidx of region.items) {
                if ((rcidx.row === changedCell.pos.r || rcidx.col === changedCell.pos.c)) {
                    changed |= checkSandwich(board, rcidx, sum);
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
            if (!region || region.items.length === 0 || sum == null) continue;

            for (const rcidx of region.items) {
                changed |= checkSandwich(board, rcidx, sum);
            }
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            const sum = rule.fields?.sum;
            if (!region || region.items.length === 0 || sum == null) continue;

            for (const rcidx of region.items) {
                const line = getLineCells(board, rcidx);
                let idx1 = -1, idx9 = -1;
                for (let i = 0; i < 9; ++i) {
                    if (line[i].value === 1) idx1 = i;
                    if (line[i].value === 9) idx9 = i;
                }
                if (idx1 < 0 || idx9 < 0) continue;

                const left = Math.min(idx1, idx9);
                const right = Math.max(idx1, idx9);

                let actual = 0;
                for (let i = left + 1; i < right; ++i) {
                    if (line[i].value === EMPTY) return true;
                    actual += line[i].value;
                }

                if (actual !== sum) return false;
            }
        }
        return true;
    };
}
