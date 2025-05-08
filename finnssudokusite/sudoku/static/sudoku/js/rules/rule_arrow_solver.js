// import { NO_NUMBER } from "../number/number.js";
// import { NumberSet } from "../number/number_set.js";
//
// export function attachArrowSolverLogic(instance) {
//     function getBaseValue(cells) {
//         if (cells.length === 1) {
//             return cells[0].value;
//         } else if (cells.length === 2) {
//             const [a, b] = sortBaseCells(cells);
//             if (a.value !== NO_NUMBER && b.value !== NO_NUMBER) {
//                 return a.value * 10 + b.value;
//             }
//         }
//         return null;
//     }
//
//     function sortBaseCells(cells) {
//         return cells.slice().sort((a, b) => {
//             if (a.pos.r !== b.pos.r) return a.pos.r - b.pos.r;
//             return a.pos.c - b.pos.c;
//         });
//     }
//
//     function sumFilled(cells) {
//         return cells
//             .filter(c => c.value !== NO_NUMBER)
//             .reduce((sum, c) => sum + c.value, 0);
//     }
//
//     function allFilled(cells) {
//         return cells.every(c => c.value !== NO_NUMBER);
//     }
//
//     function sumBoundsWithRepeats(count, size) {
//         return {
//             min: count * 1,
//             max: count * size
//         };
//     }
//
//     function applyBaseValueToPath(baseValue, pathCells, filledSum, size) {
//         const empty = pathCells.filter(c => c.value === NO_NUMBER);
//         const remaining = baseValue - filledSum;
//         const { min, max } = sumBoundsWithRepeats(empty.length, size);
//         let changed = false;
//
//         if (remaining < min || remaining > max) {
//             for (const c of empty) {
//                 const prev = c.candidates.raw();
//                 c.candidates.clear();
//                 if (c.candidates.raw() !== prev) changed = true;
//             }
//         } else {
//             for (const c of empty) {
//                 const prev = c.candidates.raw();
//                 for (let d = 1; d <= size; ++d) {
//                     if (c.candidates.test(d) && d > remaining) {
//                         c.candidates.disallow(d);
//                     }
//                 }
//                 if (c.candidates.raw() !== prev) changed = true;
//             }
//         }
//         return changed;
//     }
//
//     function applyFilledPathToBase(baseCells, total, size) {
//         let changed = false;
//
//         if (baseCells.length === 1) {
//             const cell = baseCells[0];
//             const prev = cell.candidates.raw();
//             for (let d = 1; d <= size; ++d) {
//                 if (cell.candidates.test(d) && d !== total) {
//                     cell.candidates.disallow(d);
//                 }
//             }
//             if (cell.candidates.raw() !== prev) changed = true;
//         }
//
//         if (baseCells.length === 2) {
//             const [a, b] = sortBaseCells(baseCells);
//             const options = [];
//
//             for (let x = 1; x <= size; ++x) {
//                 for (let y = 0; y <= size; ++y) {
//                     if (10 * x + y === total) options.push([x, y]);
//                 }
//             }
//
//             const allowedA = new Set(options.map(opt => opt[0]));
//             const allowedB = new Set(options.map(opt => opt[1]));
//
//             const prevA = a.candidates.raw();
//             const prevB = b.candidates.raw();
//
//             for (let d = 1; d <= size; ++d) {
//                 if (a.candidates.test(d) && !allowedA.has(d)) a.candidates.disallow(d);
//                 if (b.candidates.test(d) && !allowedB.has(d)) b.candidates.disallow(d);
//             }
//
//             if (a.candidates.raw() !== prevA) changed = true;
//             if (b.candidates.raw() !== prevB) changed = true;
//         }
//
//         return changed;
//     }
//
//     function applyPartialPathBoundsToBase(baseCells, filledSum, emptyCount, size) {
//         const { min: minPathSum, max: maxPathSum } = sumBoundsWithRepeats(emptyCount, size);
//         const totalMin = filledSum + minPathSum;
//         const totalMax = filledSum + maxPathSum;
//         let changed = false;
//
//         if (baseCells.length === 1) {
//             const cell = baseCells[0];
//             const prev = cell.candidates.raw();
//             for (let d = 1; d <= size; ++d) {
//                 if (cell.candidates.test(d) && (d < totalMin || d > totalMax)) {
//                     cell.candidates.disallow(d);
//                 }
//             }
//             if (cell.candidates.raw() !== prev) changed = true;
//         }
//
//         if (baseCells.length === 2) {
//             const [a, b] = sortBaseCells(baseCells);
//             const allowedA = new Set();
//             const allowedB = new Set();
//
//             for (let x = 1; x <= size; ++x) {
//                 for (let y = 0; y <= size; ++y) {
//                     if (10 * x + y >= totalMin && 10 * x + y <= totalMax) {
//                         allowedA.add(x);
//                         allowedB.add(y);
//                     }
//                 }
//             }
//
//             const prevA = a.candidates.raw();
//             const prevB = b.candidates.raw();
//
//             for (let d = 1; d <= size; ++d) {
//                 if (a.candidates.test(d) && !allowedA.has(d)) a.candidates.disallow(d);
//                 if (b.candidates.test(d) && !allowedB.has(d)) b.candidates.disallow(d);
//             }
//
//             if (a.candidates.raw() !== prevA) changed = true;
//             if (b.candidates.raw() !== prevB) changed = true;
//         }
//
//         return changed;
//     }
//
//     function checkArrow(rule, board) {
//         const baseRegion = rule.fields?.base;
//         const pathRegion = rule.fields?.path;
//         if (!baseRegion || !pathRegion || baseRegion.size() === 0 || pathRegion.size() === 0) return false;
//
//         const size = board.size;
//         const baseCells = baseRegion.items.map(pos => board.getCell(pos));
//         const pathCells = pathRegion.items.map(pos => board.getCell(pos));
//         const filledPathSum = sumFilled(pathCells);
//         const baseValue = getBaseValue(baseCells);
//         const emptyPath = pathCells.filter(c => c.value === NO_NUMBER);
//
//         let changed = false;
//
//         if (baseValue != null && baseValue > 0) {
//             changed ||= applyBaseValueToPath(baseValue, pathCells, filledPathSum, size);
//         }
//
//         if (allFilled(pathCells)) {
//             changed ||= applyFilledPathToBase(baseCells, filledPathSum, size);
//         } else {
//             changed ||= applyPartialPathBoundsToBase(baseCells, filledPathSum, emptyPath.length, size);
//         }
//
//         return changed;
//     }
//
//     instance.numberChanged = function (board, changedCell) {
//         let changed = false;
//         for (const rule of instance.rules) {
//             const base = rule.fields?.base;
//             const path = rule.fields?.path;
//             if (base?.has?.(changedCell.pos) || path?.has?.(changedCell.pos)) {
//                 if (checkArrow(rule, board)) changed = true;
//             }
//         }
//         return changed;
//     };
//
//     instance.candidatesChanged = function (board) {
//         let changed = false;
//         for (const rule of instance.rules) {
//             if (checkArrow(rule, board)) changed = true;
//         }
//         return changed;
//     };
//
//     instance.checkPlausibility = function (board) {
//         for (const rule of instance.rules) {
//             const baseRegion = rule.fields?.base;
//             const pathRegion = rule.fields?.path;
//             if (!baseRegion || !pathRegion || baseRegion.size() === 0 || pathRegion.size() === 0) continue;
//
//             const baseCells = baseRegion.items.map(pos => board.getCell(pos));
//             const pathCells = pathRegion.items.map(pos => board.getCell(pos));
//             const baseValue = getBaseValue(baseCells);
//
//             if (baseValue === null) continue;
//
//             const sum = sumFilled(pathCells);
//             if (sum !== baseValue) return false;
//         }
//
//         return true;
//     };
// }
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
        let up = board.upperbound(path);

        // next, we need to differentiate between the amount of base cells
        if (base.items.length === 1) {
            let cell = board.getCell(base.items[0]);
            cell.onlyAllowCandidates(NumberSet.greaterThan(lb, board.size));
        } else {
            let cell1 = board.getCell(base.items[0]);
            let cell2 = board.getCell(base.items[1]);

            let cands1 = new NumberSet(board.size);
            let cands2 = new NumberSet(board.size);

            for (let i = lb, j = up; i <= j; i++) {
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

        console.log(lb, ub, lb_path, ub_path);

        // go through each non empty cell in the path
        for (let idx of board.empty(path).items) {
            let cell = board.getCell(idx);

            // compute the lb and ub of the remaining cells
            let lb_rest = lb_path - cell.getCandidates().lowest();
            let ub_rest = ub_path - cell.getCandidates().highest();

            // the lb of the current cell must be greater than the difference of lb base to lb rest
            let _lb = lb - lb_rest;
            let _ub = ub - ub_rest;

            _lb = Math.max(_lb, 1);
            _ub = Math.min(_ub, 9);

            changed |= cell.onlyAllowCandidates(NumberSet.greaterEqThan(_lb, 9)
                                           .and(NumberSet.lessEqThan   (_ub, 9)));
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
                for (let i = 0; i < 5; i++) {
                    console.log(i);
                }
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