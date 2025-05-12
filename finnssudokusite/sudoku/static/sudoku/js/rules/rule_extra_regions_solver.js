import { NumberSet } from '../number/number_set.js';
import { NO_NUMBER } from '../number/number.js';
import * as SolverUtils from '../solver/solverUtil.js';

export function attachExtraRegionsSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;
        
        let changed = false;
        const rm = NumberSet.fromNumber(changedCell.value);
        
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!region || !region.has(changedCell.pos)) continue;

            // remove the candidate from all cells in this extra region
            for (const pos of region.items) {
                const cell = board.getCell({r: pos.r, c: pos.c});
                if (cell.value === NO_NUMBER && cell.removeCandidates(rm)) changed = true;
            }
        }
        
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;
        
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!region) continue;
            if (hiddenSingles(SolverUtils.cells(region, board))) changed = true;           
        }
        
        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            const region = rule.fields?.region;
            if (!region) continue;
            if (!groupIsPlausible(SolverUtils.cells(region, board))) return false;
        }
        
        return true;
    };
}

// helper functions

function groupIsPlausible(group) {
    let seen = new NumberSet();
    seen.clear();
    
    for (const c of group) {
        if (c.value === NO_NUMBER) continue;
        if (seen.test(c.value)) return false; // duplicate found
        seen.allow(c.value);
    }
    
    return true;
}

function hiddenSingles(unit) {
    let changed = false;
    const seenOnce = new NumberSet();
    const seenTwice = new NumberSet();

    for (const c of unit) {
        seenTwice.orEq(seenOnce.and(c.getCandidates()));
        seenOnce.orEq(c.getCandidates());
    }
    const unique = seenOnce.and(seenTwice.not());
    for (const c of unit) {
        if (c.value === NO_NUMBER) {
            const pick = c.candidates.and(unique);
            if (pick.count() === 1 && c.removeCandidates(pick.not())) changed = true;
        }
    }
    return changed;
}
