import { EMPTY } from "../solver/defs.js";
import { CAND_EVEN, CAND_ODD } from "../solver/candidates.js";

/**
 * Enforces alternating parity in a sorted region:
 * Even and odd values must alternate. If one cell is known to be even/odd,
 * all others are restricted based on position.
 */
function enforceParityAlternation(region, board) {
    const items = region.items;
    let index_even = null;

    // Step 1: Find first known parity
    for (let i = 0; i < items.length; ++i) {
        const cell = board.getCell(items[i]);

        if (cell.value !== EMPTY) {
            index_even = (cell.value % 2 === 0) ? i : i + 1;
            break;
        } else if (cell.candidates.and(CAND_ODD).count() === 0) {
            // Only even candidates
            index_even = i;
            break;
        } else if (cell.candidates.and(CAND_EVEN).count() === 0) {
            // Only odd candidates
            index_even = i + 1;
            break;
        }
    }

    if (index_even === null) return false;

    // Step 2: Enforce alternating parity
    let changed = false;
    for (let i = 0; i < items.length; ++i) {
        const cell = board.getCell(items[i]);
        if (cell.value !== EMPTY) continue;

        const is_even = (i % 2 === index_even % 2);
        const prev = cell.candidates.raw();

        cell.candidates.andEq(is_even ? CAND_EVEN : CAND_ODD);

        if (cell.candidates.raw() !== prev) changed = true;
    }

    return changed;
}

/**
 * Attaches parity solver logic to the given instance.
 * The instance must have `.rules`, each with a `.fields.region`.
 */
export function attachParitySolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            if (rule.fields?.path?.has(changedCell.pos)) {
                changed |= enforceParityAlternation(rule.fields.path, board);
            }
        }
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            changed |= enforceParityAlternation(rule.fields.path, board);
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            if (!rule?.fields?.path) continue;
            for (const item of rule.fields.path.items) {
                const cell = board.getCell(item);
                if (cell.value === EMPTY && cell.candidates.count() === 0) {
                    return false;
                }
            }
        }
        return true;
    };
}
