import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

// All 8 valid 3×3 magic square layouts
const MAGIC_SQUARE_SOLUTIONS = [
    [8, 1, 6, 3, 5, 7, 4, 9, 2],
    [6, 7, 2, 1, 5, 9, 8, 3, 4],
    [2, 9, 4, 7, 5, 3, 6, 1, 8],
    [4, 3, 8, 9, 5, 1, 2, 7, 6],
    [6, 1, 8, 7, 5, 3, 2, 9, 4],
    [4, 9, 2, 3, 5, 7, 8, 1, 6],
    [2, 7, 6, 9, 5, 1, 4, 3, 8],
    [8, 3, 4, 1, 5, 9, 6, 7, 2],
];

// === Utility ===

function is3x3Square(region) {
    if (!region || region.items.length !== 9) return false;
    const rows = new Set();
    const cols = new Set();
    for (const { r, c } of region.items) {
        rows.add(r);
        cols.add(c);
    }
    return rows.size === 3 && cols.size === 3;
}

function sortRegion3x3RowMajor(region) {
    return [...region.items].sort((a, b) => (a.r !== b.r ? a.r - b.r : a.c - b.c));
}

function isValidLayout(board, items, layout) {
    for (let i = 0; i < 9; i++) {
        const { r, c } = items[i];
        const cell = board.getCell({ r, c });
        if (cell.value !== NO_NUMBER && cell.value !== layout[i]) return false;
    }
    return true;
}

function getPossibleLayouts(board, region) {
    const items = sortRegion3x3RowMajor(region);
    return MAGIC_SQUARE_SOLUTIONS.filter(layout => isValidLayout(board, items, layout));
}

function applyCandidates(board, region, layouts) {
    const items = sortRegion3x3RowMajor(region);
    let changed = false;

    for (let i = 0; i < 9; i++) {
        const { r, c } = items[i];
        const cell = board.getCell({ r, c });
        if (cell.value !== NO_NUMBER) continue;

        let allowed = new NumberSet(9);
        for (const layout of layouts) allowed.allow(layout[i]);

        const current = cell.getCandidates(); // respects value
        for (let d = 1; d <= 9; d++) {
            if (current.test(d) && !allowed.test(d)) {
                cell.candidates.disallow(d);
                changed = true;
            }
        }
    }

    return changed;
}

// === Main entry ===

export function attachMagicSquareSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!is3x3Square(region)) continue;

            const layouts = getPossibleLayouts(board, region);
            if (layouts.length > 0) {
                changed ||= applyCandidates(board, region, layouts);
            }
        }
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!is3x3Square(region)) continue;

            const layouts = getPossibleLayouts(board, region);
            if (layouts.length > 0) {
                changed ||= applyCandidates(board, region, layouts);
            }
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!is3x3Square(region)) continue;

            const layouts = getPossibleLayouts(board, region);
            if (layouts.length === 0) return false;
        }
        return true;
    };
}
