import { EMPTY } from "../solver/defs.js";
import { Candidates } from "../solver/candidates.js";

export function attachArrowSolverLogic(instance) {
    function getBaseValue(cells) {
        if (cells.length === 1) {
            return cells[0].value;
        } else if (cells.length === 2) {
            const [a, b] = sortBaseCells(cells);
            if (a.value !== EMPTY && b.value !== EMPTY) {
                return a.value * 10 + b.value;
            }
        }
        return null;
    }

    function sortBaseCells(cells) {
        return cells.slice().sort((a, b) => {
            if (a.pos.r !== b.pos.r) return a.pos.r - b.pos.r;
            return a.pos.c - b.pos.c;
        });
    }

    function sumFilled(cells) {
        return cells
            .filter(c => c.value !== EMPTY)
            .reduce((sum, c) => sum + c.value, 0);
    }

    function allFilled(cells) {
        return cells.every(c => c.value !== EMPTY);
    }

    function sumBoundsWithRepeats(count) {
        return {
            min: count * Candidates.MIN,
            max: count * Candidates.MAX
        };
    }

    function applyBaseValueToPath(baseValue, pathCells, filledSum) {
        const empty = pathCells.filter(c => c.value === EMPTY);
        const remaining = baseValue - filledSum;
        const { min, max } = sumBoundsWithRepeats(empty.length);
        let changed = false;

        if (remaining < min || remaining > max) {
            for (const c of empty) {
                const prev = c.candidates.raw();
                c.candidates.clear();
                if (c.candidates.raw() !== prev) changed = true;
            }
        } else {
            for (const c of empty) {
                const prev = c.candidates.raw();
                for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                    if (c.candidates.test(d) && d > remaining) {
                        c.candidates.disallow(d);
                    }
                }
                if (c.candidates.raw() !== prev) changed = true;
            }
        }
        return changed;
    }

    function applyFilledPathToBase(baseCells, total) {
        let changed = false;

        if (baseCells.length === 1) {
            const cell = baseCells[0];
            const prev = cell.candidates.raw();
            for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                if (cell.candidates.test(d) && d !== total) {
                    cell.candidates.disallow(d);
                }
            }
            if (cell.candidates.raw() !== prev) changed = true;
        }

        if (baseCells.length === 2) {
            const [a, b] = sortBaseCells(baseCells);
            const options = [];

            for (let x = Candidates.MIN; x <= Candidates.MAX; ++x) {
                for (let y = Candidates.MIN; y <= Candidates.MAX; ++y) {
                    if (10 * x + y === total) options.push([x, y]);
                }
            }

            const allowedA = new Set(options.map(opt => opt[0]));
            const allowedB = new Set(options.map(opt => opt[1]));

            const prevA = a.candidates.raw();
            const prevB = b.candidates.raw();

            for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                if (a.candidates.test(d) && !allowedA.has(d)) a.candidates.disallow(d);
                if (b.candidates.test(d) && !allowedB.has(d)) b.candidates.disallow(d);
            }

            if (a.candidates.raw() !== prevA) changed = true;
            if (b.candidates.raw() !== prevB) changed = true;
        }

        return changed;
    }

    function applyPartialPathBoundsToBase(baseCells, filledSum, emptyCount) {
        const { min: minPathSum, max: maxPathSum } = sumBoundsWithRepeats(emptyCount);
        const totalMin = filledSum + minPathSum;
        const totalMax = filledSum + maxPathSum;
        let changed = false;

        console.log(totalMin, totalMax)

        if (baseCells.length === 1) {
            const cell = baseCells[0];
            const prev = cell.candidates.raw();
            for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                if (cell.candidates.test(d) && (d < totalMin || d > totalMax)) {
                    cell.candidates.disallow(d);
                }
            }
            if (cell.candidates.raw() !== prev) changed = true;
        }

        if (baseCells.length === 2) {
            const [a, b] = sortBaseCells(baseCells);
            const allowedA = new Set();
            const allowedB = new Set();

            // collect allowed digits
            for (let x = Candidates.MIN; x <= Candidates.MAX; ++x) {
                if (x === 0) continue; // first digit can't be 0
                for (let y = Candidates.MIN; y <= Candidates.MAX; ++y) {
                    const composed = 10 * x + y;
                    if (composed >= totalMin && composed <= totalMax) {
                        allowedA.add(x);
                        allowedB.add(y);
                    }
                }
            }

            const prevA = a.candidates.raw();
            const prevB = b.candidates.raw();

            for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                if (a.candidates.test(d) && !allowedA.has(d)) a.candidates.disallow(d);
                if (b.candidates.test(d) && !allowedB.has(d)) b.candidates.disallow(d);
            }

            if (a.candidates.raw() !== prevA) changed = true;
            if (b.candidates.raw() !== prevB) changed = true;
        }


        return changed;
    }

    function checkArrow(rule, board) {
        const baseRegion = rule.fields?.base;
        const pathRegion = rule.fields?.path;
        if (!baseRegion || !pathRegion || baseRegion.size() === 0 || pathRegion.size() === 0) return false;

        const baseCells = baseRegion.items.map(pos => board.getCell(pos));
        const pathCells = pathRegion.items.map(pos => board.getCell(pos));
        const filledPathSum = sumFilled(pathCells);
        const baseValue = getBaseValue(baseCells);
        const emptyPath = pathCells.filter(c => c.value === EMPTY);

        let changed = false;

        console.log("base value")
        console.log(board.toString(false));
        console.log(baseValue);

        if (baseValue != null && baseValue > 0) {
            changed |= applyBaseValueToPath(baseValue, pathCells, filledPathSum);
        }

        if (allFilled(pathCells)) {
            changed |= applyFilledPathToBase(baseCells, filledPathSum);
        } else {
            changed |= applyPartialPathBoundsToBase(baseCells, filledPathSum, emptyPath.length);
        }

        return changed;
    }

    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            const base = rule.fields?.base;
            const path = rule.fields?.path;
            if (base?.has?.(changedCell.pos) || path?.has?.(changedCell.pos)) {
                if (checkArrow(rule, board)) changed = true;
            }
        }
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            if (checkArrow(rule, board)) changed = true;
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const baseRegion = rule.fields?.base;
            const pathRegion = rule.fields?.path;
            if (!baseRegion || !pathRegion || baseRegion.size() === 0 || pathRegion.size() === 0) continue;

            const baseCells = baseRegion.items.map(pos => board.getCell(pos));
            const pathCells = pathRegion.items.map(pos => board.getCell(pos));
            const baseValue = getBaseValue(baseCells);

            if (baseValue === null) continue;

            const sum = sumFilled(pathCells);
            if (sum !== baseValue) return false;
        }

        return true;
    };
}
