import { NumberSet } from '../number/number_set.js';
import { NO_NUMBER } from '../number/number.js';
import { hiddenSingles } from './rule_standard_solver.js';
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
    seen.mask = 0;
    let combined = new NumberSet();
    
    for (const c of group) {
        if (c.value !== NO_NUMBER) {
            if (seen.test(c.value)) return false;
            seen.allow(c.value);
            combined.orEq(NumberSet.fromNumber(c.value));
        } else {
            combined.orEq(c.candidates);
        }
    }
    
    return combined.count() >= group.length;
}
