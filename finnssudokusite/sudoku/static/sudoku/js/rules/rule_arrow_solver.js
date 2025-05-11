import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

export function attachArrowSolverLogic(instance) {

    // we need to differentiate between a few cases, one is estimating the possible numbers in the base
    // and the other is the possible numbers inside the path
    function determine_base_options(board, base, path) {
        // assert board.size = 9
        if (board.size !== 9) {
            throw new Error("Arrow solver only works for 9x9 boards");
        }

        let changed = false;

        // we first need to estimate the possible range of numbers in the path
        let lb = board.lowerbound(path);
        let ub = board.upperbound(path);
        ub = Math.min(ub, 99);
        lb = Math.min(lb, 99);

        // next, we need to differentiate between the amount of base cells
        if (base.items.length === 1) {
            let cell = board.getCell(base.items[0]);
            if (cell.value !== NO_NUMBER) return false;
            cell.candidates = (NumberSet.greaterEqThan(lb, board.size));
        } else {
            let cell1 = board.getCell(base.items[0]);
            let cell2 = board.getCell(base.items[1]);

            let cands1 = new NumberSet(board.size);
            let cands2 = new NumberSet(board.size);

            for (let i = lb; i <= ub; i++) {
                if (i > 10)
                    cands1.allow(Math.floor(i / 10));
                if (i % 10 > 0)
                    cands2.allow(i % 10);
            }

            changed |= cell1.onlyAllowCandidates(cands1);
            changed |= cell2.onlyAllowCandidates(cands2);

        }
        return changed
    }

    function bounds_base(board, base) {
        let lb = 0
        let ub = 0

        // if there are two base cells, we need to determine the range of numbers
        if (base.items.length === 2) {
            let cell1 = board.getCell(base.items[0]);
            let cell2 = board.getCell(base.items[1]);
            lb = cell1.getCandidates().lowest()  * 10 + cell2.getCandidates().lowest();
            ub = cell1.getCandidates().highest() * 10 + cell2.getCandidates().highest();
        } else {
            let cell = board.getCell(base.items[0]);
            lb = cell.getCandidates().lowest()
            ub = cell.getCandidates().highest()
        }

        return [lb, ub]
    }

    function bounds_path(board, path) {
        return [board.lowerbound(path),
                board.upperbound(path)]
    }

    // this function is used to determine the possible numbers in the path
    function determine_path_options(board, base, path) {
        let changed = false;
        // assert board.size = 9
        if (board.size !== 9) {
            throw new Error("Arrow solver only works for 9x9 boards");
        }

        // determine the range of numbers.
        let [lb, ub] = bounds_base(board, base);

        // now we need to determine the possible numbers in the path
        let [lb_path, ub_path] = bounds_path(board, path);

        // go through each non empty cell in the path
        for (let idx of board.empty(path).items) {
            let cell = board.getCell(idx);

            // compute the lb and ub of the remaining cells
            let lb_rest = lb_path - cell.getCandidates().lowest();
            let ub_rest = ub_path - cell.getCandidates().highest();

            let _up = ub - lb_rest;
            let _lb = lb - ub_rest;

            _lb = Math.max(_lb, 1);
            _up = Math.min(_up, 9);

            let mask = NumberSet.greaterEqThan(_lb, 9).and(NumberSet.lessEqThan(_up, 9));

            changed |= cell.onlyAllowCandidates(mask);
        }
        return changed;
    }

    instance.numberChanged = function (board, changedCell) {

        let changed = false;
        for (const rule of instance.rules) {
            const base = rule.fields?.base
            const path = rule.fields?.path
            if (!base || !path || base.items.length === 0 || path.items.length === 0) continue;

            // check if the changed cell is in the base or path
            if (base.has(changedCell.pos) || path.has(changedCell.pos)) {
                changed |= determine_base_options(board, base, path);
                changed |= determine_path_options(board, base, path);
            }
        }
        return changed;
    }

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            const base = rule.fields?.base;
            const path = rule.fields?.path;
            if (!base || !path || base.items.length === 0 || path.items.length === 0) continue;

            changed |= determine_base_options(board, base, path);
            changed |= determine_path_options(board, base, path);
        }
        return changed;
    }

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const base = rule.fields?.base;
            const path = rule.fields?.path;
            if (!base || !path || base.items.length === 0 || path.items.length === 0) continue;
            let b_base = bounds_base(board, base);
            let b_path = bounds_path(board, path);

            if (b_base[1] < b_path[0] || b_base[0] > b_path[1]) {
                return false;
            }
        }
        return true;
    }
}