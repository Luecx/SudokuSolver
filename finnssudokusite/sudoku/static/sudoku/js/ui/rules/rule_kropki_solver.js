import { EMPTY } from "../../solver/defs.js";
import { Candidates } from "../../solver/candidates.js";
import { EdgeIdx } from "../region/EdgeIdx.js";

export function attachKropkiSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === EMPTY) return false;
        let changed = false;

        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;
            const isWhite = rule.color === "white";

            for (const edge of rule.fields.region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= applyNumberConstraint(a, b, isWhite);
                changed ||= applyNumberConstraint(b, a, isWhite);
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
            if (!rule?.fields?.region) continue;
            const isWhite = rule.color === "white";

            for (const edge of rule.fields.region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= applyCandidateConstraint(a, b, isWhite);
            }
        }

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;
            const isWhite = rule.color === "white";

            for (const edge of rule.fields.region.items) {
                const a = board.getCell({ r: edge.r1, c: edge.c1 });
                const b = board.getCell({ r: edge.r2, c: edge.c2 });

                if (!checkPairPlausibility(a, b, isWhite)) return false;
            }
        }
        return true;
    };
}

/* === Helpers === */

function applyNumberConstraint(a, b, isWhite) {
    if (a.value === EMPTY || b.value !== EMPTY) return false;

    const allowed = new Candidates();

    if (isWhite) {
        if (a.value > 1) allowed.orEq(Candidates.fromNumber(a.value - 1));
        if (a.value < 9) allowed.orEq(Candidates.fromNumber(a.value + 1));
    } else {
        if (a.value % 2 === 0 && a.value / 2 >= 1)
            allowed.orEq(Candidates.fromNumber(a.value / 2));
        if (a.value * 2 <= 9)
            allowed.orEq(Candidates.fromNumber(a.value * 2));
    }

    const before = b.candidates.clone();
    b.candidates.andEq(allowed);
    return !b.candidates.equals(before);
}

function applyCandidateConstraint(a, b, isWhite) {
    if (a.value !== EMPTY || b.value !== EMPTY) return false;

    let changed = false;

    for (const n of [...a.candidates]) {
        let valid = false;

        if (isWhite) {
            valid = (n > 1 && b.candidates.test(n - 1)) || (n < 9 && b.candidates.test(n + 1));
        } else {
            valid =
                (n % 2 === 0 && n / 2 >= 1 && b.candidates.test(n / 2)) ||
                (n * 2 <= 9 && b.candidates.test(n * 2));
        }

        if (!valid) {
            a.candidates.andEq(new Candidates(~(1 << n) & Candidates.MASK_ALL));
            changed = true;
        }
    }

    return changed;
}

function checkPairPlausibility(a, b, isWhite) {
    if (a.value === EMPTY || b.value === EMPTY) return true;

    if (isWhite) {
        return Math.abs(a.value - b.value) === 1;
    } else {
        return a.value === 2 * b.value || b.value === 2 * a.value;
    }
}

function enforceMissingDots(instance, board) {
    let changed = false;

    const whiteRegion = instance.rules.find(r => r.color === "white")?.fields?.region;
    const blackRegion = instance.rules.find(r => r.color === "black")?.fields?.region;

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
                if (cell.value === EMPTY && neighbor.value === EMPTY) continue;

                const edge = new EdgeIdx(r, c, nr, nc);
                const hasDot = (
                    (whiteRegion != null && whiteRegion.has(edge)) ||
                    (blackRegion != null && blackRegion.has(edge))
                );
                if (hasDot) continue;

                changed |= removeForbidden(cell, neighbor);
                changed |= removeForbidden(neighbor, cell);
            }
        }
    }

    return changed;
}

function removeForbidden(a, b) {
    if (b.value === EMPTY) return false;

    const forbidden = new Candidates();

    for (let i = 1; i <= 9; i++) {
        const isConsecutive = Math.abs(i - b.value) === 1;
        const isDouble = i === 2 * b.value || b.value === 2 * i;

        if (isConsecutive || isDouble) forbidden.allow(i);
    }

    return a.removeCandidates(forbidden);
}
