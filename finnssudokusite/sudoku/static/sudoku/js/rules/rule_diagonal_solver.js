import { EMPTY } from "../solver/defs.js";
import { Candidates } from "../solver/candidates.js";

export function attachDiagonalSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === EMPTY) return false;

        let changed = false;
        const rm = Candidates.fromNumber(changedCell.value);
        const { r, c } = changedCell.pos;

        if (instance.fields.diagonal && r === c) {
            for (let i = 0; i < 9; i++) {
                const cell = board.getCell({ r: i, c: i });
                if (cell.value === EMPTY && cell.removeCandidates(rm)) changed = true;
            }
        }

        if (instance.fields.antiDiagonal && r + c === 8) {
            for (let i = 0; i < 9; i++) {
                const cell = board.getCell({ r: i, c: 8 - i });
                if (cell.value === EMPTY && cell.removeCandidates(rm)) changed = true;
            }
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        return false; // Optional advanced logic like naked singles not needed here
    };

    instance.checkPlausibility = function (board) {
        if (instance.fields.diagonal && !checkUniqueDiagonal(board, true)) return false;
        if (instance.fields.antiDiagonal && !checkUniqueDiagonal(board, false)) return false;
        return true;
    };
}

function checkUniqueDiagonal(board, isMain) {
    const seen = new Candidates();
    seen.mask = 0;
    const combined = new Candidates();

    for (let i = 0; i < 9; i++) {
        const cell = isMain
            ? board.getCell({ r: i, c: i })
            : board.getCell({ r: i, c: 8 - i });

        if (cell.value !== EMPTY) {
            if (seen.test(cell.value)) return false;
            seen.allow(cell.value);
            combined.orEq(Candidates.fromNumber(cell.value));
        } else {
            combined.orEq(cell.candidates);
        }
    }

    return combined.raw() === Candidates.MASK_ALL;
}
