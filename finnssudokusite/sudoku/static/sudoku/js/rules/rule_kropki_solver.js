import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";
import { EdgeIdx } from "../region/EdgeIdx.js";

export function attachKropkiSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;
        let changed = false;

        for (const rule of instance.rules) {
            const region = rule?.fields?.region;
            if (!region) continue;
            const isWhite = rule.color === "white";

            for (const edge of region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= applyNumberConstraint(a, b, isWhite, board.size);
                changed ||= applyNumberConstraint(b, a, isWhite, board.size);
            }
        }

        if (instance.fields.allDotsGiven) {
            changed ||= enforceMissingDots(instance, board);
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            const region = rule?.fields?.region;
            if (!region) continue;
            const isWhite = rule.color === "white";

            for (const edge of region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= applyCandidateConstraint(a, b, isWhite, board.size);
            }
        }

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const region = rule?.fields?.region;
            if (!region) continue;
            const isWhite = rule.color === "white";

            for (const edge of region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                if (!checkPairPlausibility(a, b, isWhite)) return false;
            }
        }
        return true;
    };
}

/* === Helpers === */

function applyNumberConstraint(a, b, isWhite, size) {
    if (a.value === NO_NUMBER || b.value !== NO_NUMBER) return false;

    const allowed = new NumberSet(size);

    if (isWhite) {
        if (a.value > 1) allowed.allow(a.value - 1);
        if (a.value < size) allowed.allow(a.value + 1);
    } else {
        if (a.value % 2 === 0 && a.value / 2 >= 1) allowed.allow(a.value / 2);
        if (a.value * 2 <= size) allowed.allow(a.value * 2);
    }

    const before = b.candidates.raw();
    b.candidates.andEq(allowed);
    return b.candidates.raw() !== before;
}

function applyCandidateConstraint(a, b, isWhite, size) {
    if (a.value !== NO_NUMBER || b.value !== NO_NUMBER) return false;

    const allowed = new NumberSet(size);

    for (let n = 1; n <= size; ++n) {
        if (!a.candidates.test(n)) continue;
        let valid = false;

        if (isWhite) {
            valid = (n > 1 && b.candidates.test(n - 1)) || (n < size && b.candidates.test(n + 1));
        } else {
            valid =
                (n % 2 === 0 && n / 2 >= 1 && b.candidates.test(n / 2)) ||
                (n * 2 <= size && b.candidates.test(n * 2));
        }

        if (!valid) allowed.disallow(n);
    }

    const before = a.candidates.raw();
    a.candidates.andEq(allowed);
    return a.candidates.raw() !== before;
}

function checkPairPlausibility(a, b, isWhite) {
    if (a.value === NO_NUMBER || b.value === NO_NUMBER) return true;

    if (isWhite) {
        return Math.abs(a.value - b.value) === 1;
    } else {
        return a.value === 2 * b.value || b.value === 2 * a.value;
    }
}

function enforceMissingDots(instance, board) {
    let changed = false;
    const size = board.size;

    const whiteRegion = instance.rules.find(r => r.color === "white")?.fields?.region;
    const blackRegion = instance.rules.find(r => r.color === "black")?.fields?.region;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = board.getCell({ r, c });
            const neighbors = [
                [r + 1, c],
                [r, c + 1]
            ];

            for (const [nr, nc] of neighbors) {
                if (nr >= size || nc >= size) continue;

                const neighbor = board.getCell({ r: nr, c: nc });
                if (cell.value === NO_NUMBER && neighbor.value === NO_NUMBER) continue;

                const edge = new EdgeIdx(r, c, nr, nc);
                const hasDot =
                    (whiteRegion?.has(edge) || blackRegion?.has(edge));

                if (!hasDot) {
                    changed |= removeForbidden(cell, neighbor, size);
                    changed |= removeForbidden(neighbor, cell, size);
                }
            }
        }
    }

    return changed;
}

function removeForbidden(a, b, size) {
    if (b.value === NO_NUMBER) return false;

    const forbidden = new NumberSet(size);

    for (let i = 1; i <= size; i++) {
        const isConsecutive = Math.abs(i - b.value) === 1;
        const isDouble = i === 2 * b.value || b.value === 2 * i;
        if (isConsecutive || isDouble) forbidden.allow(i);
    }

    const before = a.candidates.raw();
    a.candidates.andEq(forbidden.not());
    return a.candidates.raw() !== before;
}
