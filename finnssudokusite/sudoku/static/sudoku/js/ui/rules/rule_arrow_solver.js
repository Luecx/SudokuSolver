import { EMPTY } from "../../solver/defs.js";
import { Candidates } from "../../solver/candidates.js";

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
        return null; // Incomplete or invalid
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

    function checkArrow(rule, board) {
        const baseRegion = rule.fields?.base;
        const pathRegion = rule.fields?.path;
        if (!baseRegion || !pathRegion || baseRegion.size() === 0 || pathRegion.size() === 0) return false;

        const baseCells = baseRegion.items.map(pos => board.getCell(pos));
        const pathCells = pathRegion.items.map(pos => board.getCell(pos));
        const baseValue = getBaseValue(baseCells);
        const pathSum = sumFilled(pathCells);

        let changed = false;

        // Case 1: Base value known → reduce path candidates
        if (baseValue !== null) {
            const remaining = baseValue - pathSum;
            const empty = pathCells.filter(c => c.value === EMPTY);

            const minSum = sumSmallest(empty.length);
            const maxSum = sumLargest(empty.length);

            if (remaining < minSum || remaining > maxSum) {
                for (const c of empty) {
                    const prev = c.candidates.raw();
                    c.candidates.clear();
                    if (c.candidates.raw() !== prev) changed = true;
                }
            } else {
                for (const c of empty) {
                    const prev = c.candidates.raw();
                    for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                        if (!c.candidates.test(d)) continue;
                        if (d > remaining) {
                            c.candidates.disallow(d);
                        }
                    }
                    if (c.candidates.raw() !== prev) changed = true;
                }
            }
        }

        // Case 2: Path fully filled → reduce base candidates
        if (allFilled(pathCells)) {
            const pathTotal = sumFilled(pathCells);
            const baseEmpty = baseCells.filter(c => c.value === EMPTY);

            if (baseCells.length === 1) {
                const cell = baseCells[0];
                const prev = cell.candidates.raw();
                for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                    if (!cell.candidates.test(d)) continue;
                    if (d !== pathTotal) {
                        cell.candidates.disallow(d);
                    }
                }
                if (cell.candidates.raw() !== prev) changed = true;
            }

            if (baseCells.length === 2) {
                const [a, b] = sortBaseCells(baseCells);
                const target = pathTotal;
                const options = [];

                for (let x = Candidates.MIN; x <= Candidates.MAX; ++x) {
                    for (let y = Candidates.MIN; y <= Candidates.MAX; ++y) {
                        if (10 * x + y === target) options.push([x, y]);
                    }
                }

                const allowedA = new Set(options.map(opt => opt[0]));
                const allowedB = new Set(options.map(opt => opt[1]));

                const prevA = a.candidates.raw();
                const prevB = b.candidates.raw();
                for (let d = Candidates.MIN; d <= Candidates.MAX; ++d) {
                    if (!allowedA.has(d) && a.candidates.test(d)) a.candidates.disallow(d);
                    if (!allowedB.has(d) && b.candidates.test(d)) b.candidates.disallow(d);
                }

                if (a.candidates.raw() !== prevA) changed = true;
                if (b.candidates.raw() !== prevB) changed = true;
            }
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

/* === Helpers === */

function sumSmallest(count) {
    let sum = 0, val = 1;
    while (count-- > 0) sum += val++;
    return sum;
}

function sumLargest(count) {
    let sum = 0, val = 9;
    while (count-- > 0) sum += val--;
    return sum;
}
