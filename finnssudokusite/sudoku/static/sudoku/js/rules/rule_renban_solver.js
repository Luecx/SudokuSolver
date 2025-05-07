import { EMPTY } from "../solver/defs.js";
import { Candidates } from "../solver/candidates.js";

export function attachRenbanSolverLogic(instance) {
    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            const cells = path.map(p => board.getCell(p));
            const n = cells.length;

            const knownValues = cells
                .map(c => c.value)
                .filter(v => v !== EMPTY);

            // Get valid ranges
            const possibleRanges =
                knownValues.length > 0
                    ? getRangesIncludingValues(n, knownValues)
                    : getAllConsecutiveRanges(n);

            // Union of all digits from those ranges
            const allowed = new Candidates();
            for (const range of possibleRanges) {
                for (const v of range) {
                    allowed.allow(v);
                }
            }

            for (const cell of cells) {
                if (cell.value !== EMPTY) continue;

                const before = cell.candidates.clone();
                cell.candidates.andEq(allowed);
                if (!cell.candidates.equals(before)) changed = true;
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
            if (values.includes(EMPTY)) continue;

            const sorted = [...values].sort((a, b) => a - b);

            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] !== sorted[i - 1] + 1) return false;
            }
        }

        return true;
    };
}

/* === Range Generators === */

function getAllConsecutiveRanges(length) {
    const ranges = [];

    for (let start = Candidates.MIN; start <= Candidates.MAX - length + 1; start++) {
        const range = [];
        for (let v = start; v < start + length; v++) {
            range.push(v);
        }
        ranges.push(range);
    }

    return ranges;
}

function getRangesIncludingValues(length, requiredValues) {
    const ranges = [];

    const minKnown = Math.min(...requiredValues);
    const maxKnown = Math.max(...requiredValues);

    const minStart = Math.max(1, maxKnown - length + 1);
    const maxStart = Math.min(9 - length + 1, minKnown);

    for (let start = minStart; start <= maxStart; start++) {
        const range = [];
        for (let v = start; v < start + length; v++) {
            range.push(v);
        }

        // Must include ALL known values
        if (requiredValues.every(val => range.includes(val))) {
            ranges.push(range);
        }
    }

    return ranges;
}
