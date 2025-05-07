import { EMPTY } from "../solver/defs.js";

export function attachPalindromeSolverLogic(instance) {
    instance.numberChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            const n = path.length;
            for (let i = 0; i < Math.floor(n / 2); i++) {
                const a = board.getCell(path[i]);
                const b = board.getCell(path[n - 1 - i]);

                changed ||= enforceSymmetry(a, b);
                changed ||= enforceSymmetry(b, a);
            }
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            const n = path.length;
            for (let i = 0; i < Math.floor(n / 2); i++) {
                const a = board.getCell(path[i]);
                const b = board.getCell(path[n - 1 - i]);

                // Restrict to mutual candidates
                const intersection = a.candidates.and(b.candidates);
                const beforeA = a.candidates.clone();
                const beforeB = b.candidates.clone();

                a.candidates.andEq(intersection);
                b.candidates.andEq(intersection);

                changed ||= !a.candidates.equals(beforeA);
                changed ||= !b.candidates.equals(beforeB);
            }
        }

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            const n = path.length;
            for (let i = 0; i < Math.floor(n / 2); i++) {
                const a = board.getCell(path[i]);
                const b = board.getCell(path[n - 1 - i]);

                if (a.value !== EMPTY && b.value !== EMPTY && a.value !== b.value) {
                    return false;
                }
            }
        }

        return true;
    };
}

/* === Helpers === */

function enforceSymmetry(a, b) {
    if (a.value === EMPTY || b.value !== EMPTY) return false;

    if (!b.candidates.test(a.value)) return false;

    const old = b.candidates.clone();
    b.candidates.andEq(a.candidates); // reduce b to only match a.value
    return !b.candidates.equals(old);
}
