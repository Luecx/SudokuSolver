import { NO_NUMBER } from "../number/number.js";
import { CellIdx } from "../region/CellIdx.js";

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
            
            // check cage constraints if there's a region defined
            if (region && region.size() > 0 && checkCage(rule, board))
                changed = true;
            // no need to check for anti-rules if the cell is empty
            if (changedCell.value === NO_NUMBER) continue;
            // determine if we should apply the rule to this cell
            // skip if region exists, has elements, and doesn't contain the changed cell
            if (region && region.size() > 0 && !region.has(changedCell))
                continue;
            
            // remove the value of the changed cell from candidates of cells that are a move away
            for (const [dr, dc] of movePattern) {
                const nr = changedCell.pos.r + dr;
                const nc = changedCell.pos.c + dc;

                if (!inBounds(nr, nc, size))
                    continue;

                const neighborCell = board.getCell({ r: nr, c: nc });  
                // determine if this neighbor should have constraints applied:
                // - if region doesn't exist or is empty, apply to all cells
                // - if region exists and has elements, only apply to cells in that region
                const shouldApplyConstraint = !region || region.size() === 0 || region.has(neighborCell);
                    
                if (shouldApplyConstraint && neighborCell.value === NO_NUMBER) {
                    // remove the changed cell's value from neighbor's candidates
                    if (neighborCell.removeCandidate(changedCell.value))
                        changed = true;       
                }
            }
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        // no need to check for anti-rules here
        
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

            const region = rule.fields?.region;
            const movePattern = rule.label === "Anti-King" ? KING_PATTERN : KNIGHT_PATTERN;

            let cellsToCheck = [];
            if (region && region.size() > 0) {
                // only check cells in the region
                cellsToCheck = region.items.map(pos => ({
                    pos,
                    cell: board.getCell(pos)
                })).filter(item => item.cell.value !== NO_NUMBER);
            } else {
                // check all cells on the board
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        const pos = { r, c };
                        const cell = board.getCell(pos);
                        if (cell.value !== NO_NUMBER)
                            cellsToCheck.push({ pos, cell });
                    }
                }
            }

            // check constraints for all collected cells
            for (const { pos, cell } of cellsToCheck) {
                const { r, c } = pos;
                const value = cell.value;
                
                if (value === NO_NUMBER) continue;

                for (const [dr, dc] of movePattern) {
                    const nr = r + dr;
                    const nc = c + dc;

                    if (!inBounds(nr, nc, size))
                        continue;

                    const neighborPos = new CellIdx(nr, nc);
                    
                    // only check within region if one is specified
                    if (region && region.size() > 0 && !region.has(neighborPos))
                        continue;
                        
                    const neighborCell = board.getCell(neighborPos);
                    if (neighborCell.value !== NO_NUMBER && neighborCell.value === value)
                        return false; // found same value at knight/king distance
                }
            }
        }

        return true;
    };
} 

// helper functions

function inBounds(r, c, size) {
    return r >= 0 && r < size && c >= 0 && c < size;
}

function getForbiddenSums(rule) {
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

function checkCagePlausibility(rule, board) {
    const region = rule.fields?.region;
    const allowRepeats = rule.fields?.NumberCanRepeat ?? false;
    const forbiddenSums = getForbiddenSums(rule);
    
    // if region doesn't exist, has no size function, or is empty, no cage constraints to check
    if (!region || typeof region.size !== "function" || region.size() === 0) {
        return true;
    }

    const cells = region.items.map(pos => board.getCell(pos));
    const filled = cells.filter(c => c.value !== NO_NUMBER);
    const values = filled.map(c => c.value);

    const sum = values.reduce((s, v) => s + v, 0);
    
    // check for forbidden sums if the cage is complete
    if (filled.length === region.size() && forbiddenSums.length > 0 && forbiddenSums.includes(sum))
        return false;
    // if repeats are not allowed but we have repeats, it's not plausible
    if (!allowRepeats && new Set(values).size < values.length)
        return false;

    return true;
}

function checkCage(rule, board) {
    const region = rule.fields?.region;
    const forbiddenSums = getForbiddenSums(rule);
    const allowRepeats = rule.fields?.NumberCanRepeat ?? false;
   
    // if region doesn't exist, has no size function, or is empty, no cage constraints to apply
    if (!region || typeof region.size !== "function" || region.size() === 0) return false;
    
    const cells = region.items.map(pos => board.getCell(pos));
    const filled = cells.filter(c => c.value !== NO_NUMBER);
    const usedValues = new Set(filled.map(c => c.value));
    const filledSum = filled.reduce((s, c) => s + c.value, 0);
    const remainingCells = cells.filter(c => c.value === NO_NUMBER);
   
    // if all cells are filled, no candidates to modify
    if (remainingCells.length === 0) return false;
   
    let changed = false;
    for (const cell of remainingCells) {
        const prev = cell.candidates.raw();
        for (let d = 1; d <= board.size; ++d) {
            if (!cell.candidates.test(d)) continue;
            
            // check if value is already used and repeats aren't allowed
            if (!allowRepeats && usedValues.has(d)) {
                cell.candidates.disallow(d);
                continue;
            }
            // check if adding this value would result in a forbidden sum
            // only check if the cage would be filled completely with this value
            if (remainingCells.length === 1 && forbiddenSums.includes(filledSum + d)) {
                cell.candidates.disallow(d);
                continue;
            }
        }

        if (cell.candidates.raw() !== prev) changed = true;
    }

    return changed;
}
