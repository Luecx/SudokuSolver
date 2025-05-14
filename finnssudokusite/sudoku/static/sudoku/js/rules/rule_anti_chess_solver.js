import { NO_NUMBER } from "../number/number.js";
import { CellIdx } from "../region/CellIdx.js";
import * as SolverUtils from "../solver/solverUtil.js";

// Move patterns for Anti-Knight and Anti-King rules
const KNIGHT_PATTERN = [
    [-2, -1], [-2, +1], [-1, -2], 
    [-1, +2],           [+1, -2], 
    [+1, +2], [+2, -1], [+2, +1]
];

const KING_PATTERN = [
    [-1, -1], [-1, 0], [-1, +1],
    [ 0, -1],          [ 0, +1],
    [+1, -1], [+1, 0], [+1, +1]
];

export function attachAntiChessSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        const size = board.size;
        let changed = false;

        for (const rule of instance.rules) {
            if (!rule.fields?.enabled) continue;

            const region = rule.fields?.region;
            const movePattern = rule.label === "Anti-King" ? KING_PATTERN : KNIGHT_PATTERN;
            const forbiddenSums = getForbiddenSums(rule);

            // check cage constraints if there's a region defined
            if (region && region.size() > 0 && checkCage(rule, board)) changed = true;
            // no need to check for anti-rules if the cell is empty
            if (changedCell.value === NO_NUMBER) continue;
            // determine if we should apply the rule to this cell
            // skip if region exists, has elements, and doesn't contain the changed cell
            if (region && region.size() > 0 && !region.has(changedCell.pos))
                continue;
            
            // remove the value of the changed cell from candidates of cells that are a move away
            for (const [dr, dc] of movePattern) {
                const nr = changedCell.pos.r + dr;
                const nc = changedCell.pos.c + dc;

                if (!inBounds(nr, nc, size))
                    continue;

                const neighborCell = board.getCell({ r: nr, c: nc });  
                if (neighborCell.value !== NO_NUMBER) continue; // if filled, skip

                // determine if this neighbor should have constraints applied:
                // - if region doesn't exist or is empty, apply to all cells
                // - if region exists and has elements, only apply to cells in that region   
                const shouldApplyConstraint = !region || region.size() === 0 || region.has(neighborCell.pos);
                if (!shouldApplyConstraint) continue; // skip if contraint is not met
                                 
                // remove the changed cell's value from neighbor's candidates
                if (neighborCell.removeCandidate(changedCell.value)) changed = true;       
                
                if (forbiddenSums.length === 0) continue;

                // remove candidates that might sum up to the forbidden sums
                for (const d of neighborCell.candidates) {
                    if (forbiddenSums.includes(changedCell.value + d)) {
                        neighborCell.candidates.disallow(d);
                        changed = true;
                    }
                }
            }
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {        
        let changed = false;
        for (const rule of instance.rules)
            if (rule.fields?.enabled && checkCage(rule, board)) changed = true; 

        return changed;
    };

    instance.checkPlausibility = function (board) {
        const size = board.size;

        for (const rule of instance.rules) {
            if (!rule.fields?.enabled) continue;
            if (!checkCagePlausibility(rule, board)) return false;
            
            const forbiddenSums = getForbiddenSums(rule);
            const region = rule.fields?.region;
            const movePattern = rule.label === "Anti-King" ? KING_PATTERN : KNIGHT_PATTERN;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const cell = board.getCell({r: r, c: c});
                    if (cell.value === NO_NUMBER) continue;

                    // skip if cell is not in the region
                    if (region && region.size() > 0 && !region.has(cell.pos)) continue; 
                    
                    for (const [dr, dc] of movePattern) {
                        const nr = r + dr;
                        const nc = c + dc;

                        if (!inBounds(nr, nc, size))
                            continue;

                        const neighborPos = new CellIdx(nr, nc);
                        if (region && region.size() > 0 && !region.has(neighborPos)) continue;
                            
                        const neighborCell = board.getCell(neighborPos);
                        if (neighborCell.value === NO_NUMBER) continue;

                        // if neighbor cell has the same value as the current cell, return false
                        if (neighborCell.value === cell.value) return false;
                        // if neighbor cell plus current cell's value is in the forbidden sums, return false
                        if (forbiddenSums.includes(cell.value + neighborCell.value)) return false;               
                    }
                }
            }
        }

        return true;
    };
} 

// helper functions

export function getForbiddenSums(rule) {
    if (!rule?.fields) return [];

    const sumsInput = rule.fields.sums;
    
    if (sumsInput == null) return [];
    if (sumsInput.trim() === '') return [];

    return sumsInput
        .split(',')
        .map(part => {
            const trimmed = part.trim();
            return trimmed === '' ? NaN : Number(trimmed);
        })
        .filter(num => {
            return !isNaN(num) && Number.isInteger(num);
        })
        .slice(0, 18); // take only the first 18 numbers
}

function inBounds(r, c, size) {
    return r >= 0 && r < size && c >= 0 && c < size;
}

function checkCagePlausibility(rule, board) {
    const region = rule.fields?.region;
    const allowRepeats = rule.fields?.NumberCanRepeat ?? false;

    if (allowRepeats) return true;
    
    // if region doesn't exist, has no size function, or is empty, no cage constraints to check
    if (!region || typeof region.size !== "function" || region.size() === 0) return true;

    const filled = SolverUtils.cells(region, board).filter(c => c.value !== NO_NUMBER);
    const values = filled.map(c => c.value);
    
    // if repeats are not allowed but we have repeats, it's not plausible
    if (new Set(values).size < values.length) return false;

    return true;
}

function checkCage(rule, board) {
    const region = rule.fields?.region;
    const allowRepeats = rule.fields?.NumberCanRepeat ?? false;
   
    // if region doesn't exist, has no size function, or is empty, no cage constraints to apply
    if (!region || typeof region.size !== "function" || region.size() === 0) return false;
    
    if (allowRepeats) return false;

    const cells = SolverUtils.cells(region, board);
    const filled = cells.filter(c => c.value !== NO_NUMBER);
    const usedValues = new Set(filled.map(c => c.value));
    const remainingCells = cells.filter(c => c.value === NO_NUMBER);
   
    // if all cells are filled, no candidates to modify
    if (remainingCells.length === 0) return false;
   
    let changed = false;
    for (const cell of remainingCells) {
        for (let d = 1; d <= board.size; ++d) {
            if (!cell.candidates.test(d)) continue;
            
            // check if value is already used and repeats aren't allowed
            if (!allowRepeats && usedValues.has(d)) {
                cell.candidates.disallow(d);
                changed = true;
            }
        }
    }

    return changed;
}
