import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

export function attachRenbanSolverLogic(instance) {
    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            const cells = path.map(p => board.getCell(p));
            const length = cells.length;

            const knownValues = cells
                .map(c => c.value)
                .filter(v => v !== NO_NUMBER);

            const possibleRanges = knownValues.length > 0
                ? getRangesIncludingValues(length, knownValues)
                : getAllConsecutiveRanges(length);

            const allowed = new NumberSet();
            for (const range of possibleRanges) {
                for (const v of range) allowed.allow(v);
            }

            for (const cell of cells) {
                if (cell.value !== NO_NUMBER) continue;

                changed |= cell.removeCandidates(allowed.not());
            }
        }

        return changed;
    };

    instance.numberChanged = instance.candidatesChanged;

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            const values = path.map(p => board.getCell(p).value);
            if (values.includes(NO_NUMBER)) continue;

            const sorted = values.slice().sort((a, b) => a - b);
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] !== sorted[i - 1] + 1) return false;
            }
        }

        return true;
    };
}

/* === Range Generators === */

// All possible consecutive digit ranges of given length
function getAllConsecutiveRanges(length) {
    const ranges = [];
    for (let start = 1; start <= 9 - length + 1; start++) {
        ranges.push(Array.from({ length }, (_, i) => start + i));
    }
    return ranges;
}

// Only consecutive ranges that include all known values
function getRangesIncludingValues(length, requiredValues) {
    const minKnown = Math.min(...requiredValues);
    const maxKnown = Math.max(...requiredValues);

    const minStart = Math.max(1, maxKnown - length + 1);
    const maxStart = Math.min(9 - length + 1, minKnown);

    const ranges = [];
    for (let start = minStart; start <= maxStart; start++) {
        const range = Array.from({ length }, (_, i) => start + i);
        if (requiredValues.every(v => range.includes(v))) {
            ranges.push(range);
        }
    }

    return ranges;
}
