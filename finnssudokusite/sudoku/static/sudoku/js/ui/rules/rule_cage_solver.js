import { EMPTY } from "../../solver/defs.js";
import { Candidates } from "../../solver/candidates.js";

export function attachCageSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!region?.has?.(changedCell.pos)) continue;
            if (checkCage(instance, rule, board)) changed = true;
        }
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            if (checkCage(instance, rule, board)) changed = true;
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            if (!checkCagePlausibility(instance, rule, board)) return false;
        }
        return true;
    };
}

// ----------- Helpers Below ------------

function checkCage(instance, rule, board) {
    const region = rule.fields?.region;
    const targetSum = rule.fields?.index;
    const allowRepeats = instance.fields?.NumberCanRepeat ?? false;
    if (!region || typeof region.size !== "function" || region.size() === 0) return false;

    const cells = region.items.map(pos => board.getCell(pos));
    const filled = cells.filter(c => c.value !== EMPTY);
    const usedValues = new Set(filled.map(c => c.value));

    const soft = !allowRepeats ? getSoftBounds(region.size(), targetSum) : null;
    let cellRanges = cells.map(c => getCellRange(c));

    let changed = false;

    for (let i = 0; i < cells.length; ++i) {
        const cell = cells[i];
        if (cell.value !== EMPTY) continue;

        const others = cellRanges.slice(0, i).concat(cellRanges.slice(i + 1));
        const otherMin = others.reduce((s, r) => s + r.min, 0);
        const otherMax = others.reduce((s, r) => s + r.max, 0);

        const prev = cell.candidates.raw();

        for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
            if (!cell.candidates.test(d)) continue;
            if (!allowRepeats && usedValues.has(d)) {
                cell.candidates.disallow(d);
                continue;
            }

            const total = d + otherMin;
            const totalMax = d + otherMax;

            // Apply soft global bounds
            if (soft && (d < soft.min || d > soft.max)) {
                cell.candidates.disallow(d);
                continue;
            }

            if (total > targetSum || totalMax < targetSum) {
                cell.candidates.disallow(d);
            }
        }

        if (cell.candidates.raw() !== prev) changed = true;
        cellRanges[i] = getCellRange(cell); // update range for next iteration
    }

    return changed;
}

function getCellRange(cell) {
    if (cell.value !== EMPTY) {
        return { min: cell.value, max: cell.value };
    }
    let min = 10, max = 0;
    for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
        if (!cell.candidates.test(d)) continue;
        min = Math.min(min, d);
        max = Math.max(max, d);
    }
    return { min, max };
}

function getSoftBounds(n, targetSum) {
    const min = sumOfLargest(n, targetSum); // smallest value that can appear
    const max = sumOfSmallest(n, targetSum); // largest value that can appear
    return { min, max };
}

// Given N values, what's the smallest minimum digit that must appear?
function sumOfLargest(n, sum) {
    // Try placing largest N values: 9,8,... down to (10-N)
    const minSum = (n * (n + 1)) / 2;
    const maxSum = (n * (19 - n)) / 2;

    if (sum < minSum || sum > maxSum) return 10; // impossible

    for (let low = Candidates.MIN; low <= Candidates.MAX; ++low) {
        let total = 0;
        for (let i = 0; i < n; ++i) total += (low + i);
        if (total >= sum) return low;
    }
    return 10;
}

// What's the largest possible digit that can appear?
function sumOfSmallest(n, sum) {
    for (let high = Candidates.MAX; high >= Candidates.MIN; --high) {
        let total = 0;
        for (let i = 0; i < n; ++i) total += (high - i);
        if (total <= sum) return high;
    }
    return 0;
}

function checkCagePlausibility(instance, rule, board) {
    const region = rule.fields?.region;
    const targetSum = rule.fields?.index;
    const allowRepeats = instance.fields?.NumberCanRepeat ?? false;
    if (!region || typeof region.size !== "function" || region.size() === 0) return true;

    const cells = region.items.map(pos => board.getCell(pos));
    const filled = cells.filter(c => c.value !== EMPTY);
    const values = filled.map(c => c.value);

    const sum = values.reduce((s, v) => s + v, 0);
    if (filled.length === region.size() && sum !== targetSum) return false;
    if (!allowRepeats && new Set(values).size < values.length) return false;

    return true;
}
