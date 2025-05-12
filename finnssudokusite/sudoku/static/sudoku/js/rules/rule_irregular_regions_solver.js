import { NumberSet } from '../number/number_set.js';
import { NO_NUMBER } from '../number/number.js';
import { groupIsPlausible , hiddenSingles } from './rule_standard_solver.js';
import * as SolverUtils from '../solver/solverUtil.js';

const BOARD_SIZE = 9;

export function attachIrregularSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;
        
        let changed = false;
        const rm = NumberSet.fromNumber(changedCell.value);
        
        for (const c of board.getRow(changedCell.pos.r))
            if (c.value === NO_NUMBER && c.removeCandidates(rm)) changed = true;
        for (const c of board.getCol(changedCell.pos.c))
            if (c.value === NO_NUMBER && c.removeCandidates(rm)) changed = true;
        
        // find the region containing this cell
        const regions = getIrregularRegions(instance);
        for (const region of regions) {
            if (!region.has(changedCell.pos))
                continue;
            // remove the candidate from all cells in this region
            for (const pos of region.items) {
                const cell = board.getCell({r: pos.r, c: pos.c});
                if (cell.value === NO_NUMBER && cell.removeCandidates(rm)) changed = true;
            }
        }
        
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;

        for (let i = 0; i < BOARD_SIZE; i++) {
            if (hiddenSingles(board.getRow(i))) changed = true;
            if (hiddenSingles(board.getCol(i))) changed = true;
        }

        // process irregular regions for hidden singles
        const regions = getIrregularRegions(instance);
        for (const region of regions)   
            if (hiddenSingles(SolverUtils.cells(region, board))) changed = true;

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (!groupIsPlausible(board.getRow(i))) return false;
            if (!groupIsPlausible(board.getCol(i))) return false;
        }
        
        // check irregular regions
        const regions = getIrregularRegions(instance);
        for (const region of regions)
            if (!groupIsPlausible(SolverUtils.cells(region, board))) return false;
        
        return true;
    };
}

// Helper function

function getIrregularRegions(instance) {
    const regionKeys = [
        'region1', 
        'region2', 
        'region3', 
        'region4', 
        'region5',
        'region6', 
        'region7', 
        'region8', 
        'region9'
    ];
   
    let regions = [];
    for (const key of regionKeys)
        regions.push(instance.fields[key]);

    return regions;
}
