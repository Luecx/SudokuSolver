import { EMPTY } from "../solver/defs.js";
import {CAND_ALL, CAND_EVEN, CAND_ODD, Candidates} from "../solver/candidates.js";

/**
 * Enforces alternating parity in a sorted region:
 * Even and odd values must alternate. If one cell is known to be even/odd,
 * all others are restricted based on position.
 */
function enforceParityAlternation(region, board) {
    const items = region.items;

    let cand_mask_even_id = new Candidates();
    cand_mask_even_id.mask = CAND_ALL.mask;
    let cand_mask_odd_id  = new Candidates();
    cand_mask_odd_id.mask = CAND_ALL.mask;

    // Step 1: Find first known parity
    for (let i = 0; i < items.length; ++i) {
        const cell = board.getCell(items[i]);

        if (cell.value !== EMPTY) {
            if (i % 2 === 0) {
                cand_mask_even_id.andEq(cell.value % 2 === 0 ? CAND_EVEN : CAND_ODD);
                cand_mask_odd_id .andEq(cell.value % 2 === 0 ? CAND_ODD  : CAND_EVEN);
            }else {
                cand_mask_even_id.andEq(cell.value % 2 === 0 ? CAND_ODD  : CAND_EVEN);
                cand_mask_odd_id .andEq(cell.value % 2 === 0 ? CAND_EVEN : CAND_ODD);
            }
            // index_even = (cell.value % 2 === 0) ? i : i + 1;
        } else if (cell.candidates.and(CAND_ODD).count() === 0) {
            // no odd candidates at this i
            cand_mask_even_id.andEq(i % 2 === 0 ? CAND_EVEN : CAND_ODD);
            cand_mask_odd_id .andEq(i % 2 === 0 ? CAND_ODD  : CAND_EVEN);
        } else if (cell.candidates.and(CAND_EVEN).count() === 0) {
            // no even candidates at this i
            cand_mask_even_id.andEq(i % 2 === 0 ? CAND_ODD  : CAND_EVEN);
            cand_mask_odd_id .andEq(i % 2 === 0 ? CAND_EVEN : CAND_ODD);
        }
    }

    // Step 2: Enforce alternating parity
    let changed = false;
    for (let i = 0; i < items.length; ++i) {
        const cell = board.getCell(items[i]);
        if (cell.value !== EMPTY) continue;

        let mask = i % 2 === 0 ? cand_mask_even_id : cand_mask_odd_id;

        // check if something will be changed
        if (cell.candidates.and(mask.not()).count() > 0)
            changed = true;

        cell.candidates.andEq(mask);
    }

    return false;
}

/**
 * Attaches parity solver logic to the given instance.
 * The instance must have `.rules`, each with a `.fields.region`.
 */
export function attachParitySolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            if (!rule?.fields?.path) continue;
            if (rule.fields?.path?.has(changedCell.pos)) {
                changed |= enforceParityAlternation(rule.fields.path, board);
            }
        }
        return false;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            if (!rule?.fields?.path) continue;
            changed |= enforceParityAlternation(rule.fields.path, board);
        }
        return false;
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
