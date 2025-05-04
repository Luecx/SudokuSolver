import { EMPTY } from "../../solver/defs.js";
import { Candidates } from "../../solver/candidates.js";

export function attachCageSolverLogic(instance) {
    function checkCage(rule, board) {
        const region = rule.fields?.region;
        const targetSum = rule.fields?.index;
        const allowRepeats = instance.fields?.NumberCanRepeat ?? false;

        if (!region || typeof region.size !== "function" || region.size() === 0) return false;

        const cells = region.items.map(pos => board.getCell(pos));
        const filled = cells.filter(c => c.value !== EMPTY);
        const empty = cells.filter(c => c.value === EMPTY);

        const usedValues = new Set(filled.map(c => c.value));
        const currentSum = filled.reduce((sum, c) => sum + c.value, 0);
        const remainingSum = targetSum - currentSum;
        const numEmpty = empty.length;

        let changed = false;

        // Determine theoretical bounds
        const minPossible = allowRepeats
            ? numEmpty * 1
            : sumSmallestUnused(numEmpty, usedValues);
        const maxPossible = allowRepeats
            ? numEmpty * 9
            : sumLargestUnused(numEmpty, usedValues);

        if (remainingSum < minPossible || remainingSum > maxPossible) {
            // Cannot reach the target → remove all candidates
            for (const cell of empty) {
                const prev = cell.candidates.raw();
                cell.candidates.clear();
                if (cell.candidates.raw() !== prev) changed = true;
            }
            return changed;
        }

        // Remove impossible candidates based on sum or repetition
        for (const cell of empty) {
            const prev = cell.candidates.raw();
            for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                if (!cell.candidates.test(d)) continue;
                if (!allowRepeats && usedValues.has(d)) {
                    cell.candidates.disallow(d);
                } else if (d > remainingSum) {
                    cell.candidates.disallow(d);
                }
            }
            if (cell.candidates.raw() !== prev) changed = true;
        }

        return changed;
    }

    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!region?.has?.(changedCell.pos)) continue;
            if (checkCage(rule, board)) changed = true;
        }
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            if (checkCage(rule, board)) changed = true;
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            const targetSum = rule.fields?.index;
            const allowRepeats = instance.fields?.NumberCanRepeat ?? false;

            if (!region || typeof region.size !== "function" || region.size() === 0) continue;

            const cells = region.items.map(pos => board.getCell(pos));
            const filled = cells.filter(c => c.value !== EMPTY);
            const values = filled.map(c => c.value);

            // Must sum up correctly
            const sum = values.reduce((s, v) => s + v, 0);
            if (filled.length === region.size() && sum !== targetSum) return false;

            // Duplicates only allowed if enabled
            if (!allowRepeats && new Set(values).size < values.length) return false;
        }

        return true;
    };
}

/* === Helpers === */

function sumSmallestUnused(n, used) {
    let sum = 0, val = 1;
    while (n > 0 && val <= 9) {
        if (!used.has(val)) {
            sum += val;
            n--;
        }
        val++;
    }
    return sum;
}

function sumLargestUnused(n, used) {
    let sum = 0, val = 9;
    while (n > 0 && val >= 1) {
        if (!used.has(val)) {
            sum += val;
            n--;
        }
        val--;
    }
    return sum;
}
