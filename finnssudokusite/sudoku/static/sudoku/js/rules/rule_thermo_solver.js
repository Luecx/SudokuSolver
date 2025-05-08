import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

export function attachThermometerSolverLogic(instance) {
    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            let prevValue = 0;

            for (let i = 0; i < path.length; i++) {
                const cell = board.getCell(path[i]);

                if (i === 0) {
                    // nothing to do for bulb
                    prevValue = cell.value !== NO_NUMBER ? cell.value : 0;
                    continue;
                }

                const prevCell = board.getCell(path[i - 1]);
                if (prevCell.value !== NO_NUMBER) {
                    prevValue = prevCell.value;
                } else {
                    prevValue = prevCell.candidates.lowest(); // fallback to lowest candidate
                }

                const mask = NumberSet.greaterThan(prevValue);
                const before = cell.candidates.clone();
                cell.candidates.andEq(mask);
                if (!cell.candidates.equals(before)) changed = true;
            }
        }

        return changed;
    };

    instance.numberChanged = instance.candidatesChanged;

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const path = rule?.fields?.path?.items;
            if (!path || path.length < 2) continue;

            for (let i = 1; i < path.length; i++) {
                const a = board.getCell(path[i - 1]);
                const b = board.getCell(path[i]);

                if (a.value !== NO_NUMBER && b.value !== NO_NUMBER) {
                    if (a.value >= b.value) return false;
                }
            }
        }

        return true;
    };
}