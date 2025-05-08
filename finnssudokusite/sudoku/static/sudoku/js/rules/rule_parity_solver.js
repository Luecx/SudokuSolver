import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

/**
 * Enforces alternating parity in a sorted region:
 * Even and odd values must alternate. If one cell is known to be even/odd,
 * all others are restricted based on position.
 */
function enforceParityAlternation(region, board) {
    const items = region.items;

    const CAND_EVEN = NumberSet.even(board.size)
    const CAND_ODD = NumberSet.odd(board.size)
    const CAND_ALL = NumberSet.all(board.size);


    let cand_mask_even_id = new NumberSet(board.size);
    cand_mask_even_id.mask = CAND_ALL.mask;

    let cand_mask_odd_id = new NumberSet(board.size);
    cand_mask_odd_id.mask = CAND_ALL.mask;

    // Step 1: Determine valid parity patterns from known values or candidates
    for (let i = 0; i < items.length; ++i) {
        const cell = board.getCell(items[i]);

        if (cell.value !== NO_NUMBER) {
            const isEven = cell.value % 2 === 0;
            if (i % 2 === 0) {
                cand_mask_even_id.andEq(isEven ? CAND_EVEN : CAND_ODD);
                cand_mask_odd_id.andEq(isEven ? CAND_ODD : CAND_EVEN);
            } else {
                cand_mask_even_id.andEq(isEven ? CAND_ODD : CAND_EVEN);
                cand_mask_odd_id.andEq(isEven ? CAND_EVEN : CAND_ODD);
            }
        } else {
            const canBeEven = cell.candidates.and(CAND_EVEN).count() > 0;
            const canBeOdd = cell.candidates.and(CAND_ODD).count() > 0;

            if (!canBeOdd) {
                if (i % 2 === 0) {
                    cand_mask_even_id.andEq(CAND_EVEN);
                    cand_mask_odd_id.andEq(CAND_ODD);
                } else {
                    cand_mask_even_id.andEq(CAND_ODD);
                    cand_mask_odd_id.andEq(CAND_EVEN);
                }
            } else if (!canBeEven) {
                if (i % 2 === 0) {
                    cand_mask_even_id.andEq(CAND_ODD);
                    cand_mask_odd_id.andEq(CAND_EVEN);
                } else {
                    cand_mask_even_id.andEq(CAND_EVEN);
                    cand_mask_odd_id.andEq(CAND_ODD);
                }
            }
        }
    }

    // Step 2: Apply the determined parity masks
    let changed = false;
    for (let i = 0; i < items.length; ++i) {
        const cell = board.getCell(items[i]);
        if (cell.value !== NO_NUMBER) continue;
        const mask = (i % 2 === 0) ? cand_mask_even_id : cand_mask_odd_id;
        changed |= cell.onlyAllowCandidates(mask);
    }

    return changed;
}

/**
 * Attaches parity solver logic to the given instance.
 * The instance must have `.rules`, each with a `.fields.path`.
 */
export function attachParitySolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        let changed = false;
        for (const rule of instance.rules) {
            if (!rule?.fields?.path) continue;
            if (rule.fields.path.has(changedCell.pos)) {
                changed ||= enforceParityAlternation(rule.fields.path, board);
            }
        }
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        for (const rule of instance.rules) {
            if (!rule?.fields?.path) continue;
            changed ||= enforceParityAlternation(rule.fields.path, board);
        }
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            if (!rule?.fields?.path) continue;
            for (const item of rule.fields.path.items) {
                const cell = board.getCell(item);
                if (cell.value === NO_NUMBER && cell.candidates.count() === 0) {
                    return false;
                }
            }
        }
        return true;
    };
}
