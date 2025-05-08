import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

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

                changed ||= enforceSymmetry(a, b, board.size);
                changed ||= enforceSymmetry(b, a, board.size);
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

                const intersection = a.candidates.and(b.candidates);
                const beforeA = a.candidates.raw();
                const beforeB = b.candidates.raw();

                a.candidates.andEq(intersection);
                b.candidates.andEq(intersection);

                changed ||= a.candidates.raw() !== beforeA;
                changed ||= b.candidates.raw() !== beforeB;
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

                if (a.value !== NO_NUMBER && b.value !== NO_NUMBER && a.value !== b.value) {
                    return false;
                }
            }
        }

        return true;
    };
}

/* === Helper === */

function enforceSymmetry(a, b, size) {
    if (a.value === NO_NUMBER || b.value !== NO_NUMBER) return false;

    const allowed = new NumberSet(size);
    allowed.allow(a.value);

    const before = b.candidates.raw();
    b.candidates.andEq(allowed);
    return b.candidates.raw() !== before;
}
