import { NO_NUMBER } from "../number/number.js";
import * as SolverUtil from "../solver/solverUtil.js";

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

export function checkCage(instance, rule, board) {
    const region = rule.fields?.region;
    const targetSum = rule.fields?.sum;
    const allowRepeats = instance.fields?.NumberCanRepeat ?? false;
    if (!region || typeof region.size !== "function" || region.size() === 0) return false;

    const cells = region.items.map(pos => board.getCell(pos));

    const filled = cells.filter(c => c.value !== NO_NUMBER);
    const sumFilled = filled.reduce((s, c) => s + c.value, 0);
    const usedValues = new Set(filled.map(c => c.value));

    const remainingCells = cells.filter(c => c.value === NO_NUMBER);
    const remainingSum = targetSum - sumFilled;
    const remainingN = remainingCells.length;

    let minCandidate = board.size;
    let maxCandidate = 1;

    for (const cell of remainingCells) {
        for (let d = 1; d <= board.size; ++d) {
            if (cell.candidates.test(d)) {
                minCandidate = Math.min(minCandidate, d);
                maxCandidate = Math.max(maxCandidate, d);
            }
        }
    }

    const soft = getSoftBounds(remainingN, remainingSum, allowRepeats, minCandidate, maxCandidate, board.size);

    let changed = false;

    for (const cell of remainingCells) {
        const prev = cell.candidates.raw();
        for (let d = 1; d <= board.size; ++d) {
            if (!cell.candidates.test(d)) continue;

            if (!allowRepeats && usedValues.has(d)) {
                cell.candidates.disallow(d);
                continue;
            }

            if (d < soft.min || d > soft.max) {
                cell.candidates.disallow(d);
            }
        }
        if (cell.candidates.raw() !== prev) changed = true;
    }

    return changed;
}

function getSoftBounds(N, sum, allowRepeats, minC, maxC, size) {
    const min = lowerBound(N, sum, allowRepeats, maxC, size);
    const max = upperBound(N, sum, allowRepeats, minC, size);
    return { min, max };
}

function maxSum(small, N, allowRepeats, maxC) {
    if (allowRepeats) {
        return small + (N - 1) * maxC;
    } else {
        let total = small;
        let val = maxC;
        for (let i = 0; i < N - 1; ++i) total += val--;
        return total;
    }
}

function lowerBound(N, sum, allowRepeats, maxC, size) {
    for (let low = 1; low <= maxC - (allowRepeats ? 0 : N - 1); ++low) {
        if (maxSum(low, N, allowRepeats, maxC) >= sum) return low;
    }
    return size + 1;
}

function minSum(large, N, allowRepeats, minC) {
    if (allowRepeats) {
        return large + (N - 1) * minC;
    } else {
        let total = large;
        let val = minC;
        for (let i = 0; i < N - 1; ++i) total += val++;
        return total;
    }
}

function upperBound(N, sum, allowRepeats, minC, size) {
    for (let high = size; high >= minC + (allowRepeats ? 0 : N - 1); --high) {
        if (minSum(high, N, allowRepeats, minC) <= sum) return high;
    }
    return 0;
}

export function checkCagePlausibility(instance, rule, board) {
    const region = rule.fields?.region;
    const targetSum = rule.fields?.sum;
    const allowRepeats = instance.fields?.NumberCanRepeat ?? false;
    if (!region || typeof region.size !== "function" || region.size() === 0) return true;

    const filled = SolverUtil.cells(region, board).filter(c => c.value !== NO_NUMBER);
    const values = filled.map(c => c.value);

    const sum = values.reduce((s, v) => s + v, 0);
    if (filled.length === region.size() && sum !== targetSum) return false;
    if (!allowRepeats && new Set(values).size < values.length) return false;

    return true;
}
