import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

export function attachWhisperSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;
        let changed = false;

        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            for (let i = 0; i < path.length - 1; i++) {
                const a = board.getCell(path[i]);
                const b = board.getCell(path[i + 1]);

                changed ||= applyNumberConstraint(a, b);
                changed ||= applyNumberConstraint(b, a);
            }
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            for (let i = 0; i < path.length - 1; i++) {
                const a = board.getCell(path[i]);
                const b = board.getCell(path[i + 1]);

                changed ||= applyCandidateConstraint(a, b);
                changed ||= applyCandidateConstraint(b, a);
            }
        }

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            for (let i = 0; i < path.length - 1; i++) {
                const a = board.getCell(path[i]);
                const b = board.getCell(path[i + 1]);

                if (!checkPairPlausibility(a, b)) return false;
            }
        }
        return true;
    };
}

/* === Logic === */

function applyNumberConstraint(a, b) {
    if (a.value === NO_NUMBER || b.value !== NO_NUMBER) return false;

    const allowed = new NumberSet();
    for (let i = 1; i <= 9; i++) {
        if (Math.abs(i - a.value) >= 5) {
            allowed.allow(i);
        }
    }

    const before = b.candidates.clone();
    b.candidates.andEq(allowed);
    return !b.candidates.equals(before);
}

function applyCandidateConstraint(a, b) {
    let changed = false;

    // Whisper rule disallows 5 entirely
    if (a.candidates.test(5)) {
        a.candidates.disallow(5);
        changed = true;
    }

    if (b.candidates.test(5)) {
        b.candidates.disallow(5);
        changed = true;
    }

    if (a.value !== NO_NUMBER || b.value !== NO_NUMBER) return changed;

    const validA = new NumberSet();
    for (const n of a.candidates) {
        for (const m of b.candidates) {
            if (Math.abs(n - m) >= 5) {
                validA.allow(n);
                break;
            }
        }
    }

    const beforeA = a.candidates.clone();
    a.candidates.andEq(validA);
    changed ||= !a.candidates.equals(beforeA);

    const validB = new NumberSet();
    for (const n of b.candidates) {
        for (const m of a.candidates) {
            if (Math.abs(n - m) >= 5) {
                validB.allow(n);
                break;
            }
        }
    }

    const beforeB = b.candidates.clone();
    b.candidates.andEq(validB);
    changed ||= !b.candidates.equals(beforeB);

    return changed;
}

function checkPairPlausibility(a, b) {
    if (a.value === 5 || b.value === 5) return false;
    if (a.value === NO_NUMBER || b.value === NO_NUMBER) return true;
    return Math.abs(a.value - b.value) >= 5;
}
