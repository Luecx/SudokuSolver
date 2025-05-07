import { EMPTY } from "../solver/defs.js";
import { Candidates } from "../solver/candidates.js";
import { EdgeIdx } from "../region/EdgeIdx.js";

export function attachXVRuleSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === EMPTY) return false;
        let changed = false;

        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;

            const sum = rule.symbol === "V" ? 5 : 10;
            const func = sum === 5 ? enforceV : enforceX;

            for (const edge of rule.fields.region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= func(a, b);
                changed ||= func(b, a);
            }
        }

        if (instance.fields.allDotsGiven) {
            changed ||= denforceMissingSymbols(instance, board);
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;

            const sum = rule.symbol === "V" ? 5 : 10;
            const func = sum === 5 ? enforceV : enforceX;

            for (const edge of rule.fields.region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= func(a, b);
                changed ||= func(b, a);
            }
        }

        if (instance.fields.allDotsGiven) {
            changed ||= denforceMissingSymbols(instance, board);
        }

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;
            const sum = rule.symbol === "V" ? 5 : 10;

            for (const edge of rule.fields.region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                if (!checkSumPair(a, b, sum)) return false;
            }
        }
        return true;
    };
}

/* === Enforce (rule present) === */

function enforceSum(a, b, sum) {
    if (a.value !== EMPTY && b.value === EMPTY) {
        const target = sum - a.value;
        if (target >= 1 && target <= 9) {
            const allowed = Candidates.fromNumber(target);
            const before = b.candidates.clone();
            b.candidates.andEq(allowed);
            return !b.candidates.equals(before);
        }
        return false;
    }

    if (a.value === EMPTY && b.value === EMPTY) {
        let changed = false;

        const validA = new Candidates();
        for (const n of [...a.candidates]) {
            const other = sum - n;
            if (other >= 1 && other <= 9 && b.candidates.test(other)) {
                validA.allow(n);
            }
        }

        const beforeA = a.candidates.clone();
        a.candidates.andEq(validA);
        changed ||= !a.candidates.equals(beforeA);

        const validB = new Candidates();
        for (const n of [...b.candidates]) {
            const other = sum - n;
            if (other >= 1 && other <= 9 && a.candidates.test(other)) {
                validB.allow(n);
            }
        }

        const beforeB = b.candidates.clone();
        b.candidates.andEq(validB);
        changed ||= !b.candidates.equals(beforeB);

        return changed;
    }

    return false;
}

const enforceV = (a, b) => enforceSum(a, b, 5);
const enforceX = (a, b) => enforceSum(a, b, 10);

/* === Deny (rule not present, but allDotsGiven === true) === */

function denforceSum(a, b, sum) {
    if (a.value !== EMPTY && b.value === EMPTY) {
        const forbidden = Candidates.fromNumber(sum - a.value);
        return b.removeCandidates(forbidden);
    }

    if (a.value === EMPTY && b.value !== EMPTY) {
        const forbidden = Candidates.fromNumber(sum - b.value);
        return a.removeCandidates(forbidden);
    }

    // If both are EMPTY, do nothing
    return false;
}

const denforceV = (a, b) => denforceSum(a, b, 5);
const denforceX = (a, b) => denforceSum(a, b, 10);

function denforceMissingSymbols(instance, board) {
    let changed = false;

    const vRegion = instance.rules.find(r => r.symbol === "V")?.fields?.region;
    const xRegion = instance.rules.find(r => r.symbol === "X")?.fields?.region;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = board.getCell({ r, c });
            const neighbors = [
                [r + 1, c],
                [r, c + 1]
            ];

            for (const [nr, nc] of neighbors) {
                if (nr >= 9 || nc >= 9) continue;
                const neighbor = board.getCell({ r: nr, c: nc });

                const edge = new EdgeIdx(r, c, nr, nc);
                const hasDot =
                    (vRegion && vRegion.has(edge)) ||
                    (xRegion && xRegion.has(edge));

                if (hasDot) continue;

                changed |= denforceV(cell, neighbor);
                changed |= denforceV(neighbor, cell);
                changed |= denforceX(cell, neighbor);
                changed |= denforceX(neighbor, cell);
            }
        }
    }

    return changed;
}

/* === Plausibility === */

function checkSumPair(a, b, sum) {
    if (a.value === EMPTY || b.value === EMPTY) return true;
    return a.value + b.value === sum;
}
