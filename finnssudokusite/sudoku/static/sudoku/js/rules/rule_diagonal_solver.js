import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export function attachDiagonalSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;

        const size = board.size;
        const rm = NumberSet.fromNumber(changedCell.value, size);
        const { r, c } = changedCell.pos;

        let changed = false;

        if (instance.fields.diagonal && r === c) {
            for (let i = 0; i < size; i++) {
                const cell = board.getCell({ r: i, c: i });
                if (cell.value === NO_NUMBER) {
                    const before = cell.candidates.raw();
                    cell.candidates.andEq(rm.not());
                    if (cell.candidates.raw() !== before) changed = true;
                }
            }
        }

        if (instance.fields.antiDiagonal && r + c === size - 1) {
            for (let i = 0; i < size; i++) {
                const cell = board.getCell({ r: i, c: size - 1 - i });
                if (cell.value === NO_NUMBER) {
                    const before = cell.candidates.raw();
                    cell.candidates.andEq(rm.not());
                    if (cell.candidates.raw() !== before) changed = true;
                }
            }
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        return false; // Optional advanced logic
    };

    instance.checkPlausibility = function (board) {
        const size = board.size;
        if (instance.fields.diagonal && !checkUniqueDiagonal(board, true, size)) return false;
        if (instance.fields.antiDiagonal && !checkUniqueDiagonal(board, false, size)) return false;
        return true;
    };
}

function checkUniqueDiagonal(board, isMain, size) {
    const seen = new Set();

    for (let i = 0; i < size; i++) {
        const cell = isMain
            ? board.getCell({ r: i, c: i })
            : board.getCell({ r: i, c: size - 1 - i });

        if (cell.value !== NO_NUMBER) {
            if (seen.has(cell.value)) return false;
            seen.add(cell.value);
        }
    }

    return true;
}
