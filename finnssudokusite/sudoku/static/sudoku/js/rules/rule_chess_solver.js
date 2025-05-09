import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

export function attachChessSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;

        const size = board.size;
        const { r, c } = changedCell.pos;
        const rm = NumberSet.fromNumber(changedCell.value, size);

        let changed = false;

        for (const [dr, dc] of getMovePattern(instance)) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                const cell = board.getCell({ r: nr, c: nc });
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
        return false;
    };

    instance.checkPlausibility = function (board) {
        const size = board.size;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const value = board.getCell({ r, c }).value;
                if (value === NO_NUMBER) continue;

                for (const [dr, dc] of getMovePattern(instance)) {
                    const nr = r + dr;
                    const nc = c + dc;

                    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                        const otherValue = board.getCell({ r: nr, c: nc }).value;
                        if (otherValue === value) return false;
                    }
                }
            }
        }

        return true;
    };
}

// helper function

function getMovePattern(instance) {
    const knightMoves = instance.fields.antiKnight ? [
        [-2, -1], [-2, +1], [-1, -2], [-1, +2],
        [+1, -2], [+1, +2], [+2, -1], [+2, +1]
    ] : [];

    const kingMoves = instance.fields.antiKing ? [
        [-1, -1], [-1, 0], [-1, +1],
        [ 0, -1],          [ 0, +1],
        [+1, -1], [+1, 0], [+1, +1]
    ] : [];

    return [...knightMoves, ...kingMoves];
}
