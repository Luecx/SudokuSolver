import { NumberSet } from '../number/number_set.js';
import { NO_NUMBER } from '../number/number.js';

const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
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
        
        // Apply constraints to region
        // Find the region containing this cell
        for (const region of getIrregularRegions(instance)) {            
            // Check if the region contains the changed cell
            let cellInRegion = false;
            for (const cell of region.items) {
                if (cell.r === changedCell.pos.r && cell.c === changedCell.pos.c) {
                    cellInRegion = true;
                    break;
                }
            }
            
            if (cellInRegion) {
                // Remove the candidate from all cells in this region
                for (const pos of region.items) {
                    const cell = board.getCell({r: pos.r, c: pos.c});
                    if (cell.value === NO_NUMBER && cell.removeCandidates(rm)) 
                        changed = true;
                }
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
        for (const region of getIrregularRegions(instance)) {            
            const cells = region.items.map(pos => board.getCell({r: pos.r, c: pos.c}));
            if (hiddenSingles(cells)) changed = true;
        }

        if (pointing(board, getIrregularRegions(instance))) changed = true;
        if (claiming(board, getIrregularRegions(instance))) changed = true;

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (!groupIsPlausible(board.getRow(i))) return false;
            if (!groupIsPlausible(board.getCol(i))) return false;
        }
        
        // check irregular regions
        for (const region of getIrregularRegions(instance)) {
            const cells = region.items.map(pos => board.getCell({r: pos.r, c: pos.c}));
            if (!groupIsPlausible(cells)) return false;
        }
        
        return true;
    };
}

// Helper functions

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
    for (const key of regionKeys) {
        regions.push(instance.fields[key]);
    }

    return regions;
}

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
    
    return combined.raw() === NumberSet.all().raw();
}

function hiddenSingles(unit) {
    let changed = false;
    const seenOnce = new NumberSet();
    const seenTwice = new NumberSet();

    for (const c of unit) {
        if (c.value !== NO_NUMBER) {
            seenOnce.orEq(NumberSet.fromNumber(c.value));
        } else {
            seenTwice.orEq(seenOnce.and(c.candidates));
            seenOnce.orEq(c.candidates);
        }
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

function pointing(board, regions) {
    let changed = false;
    
    for (const region of regions) {        
        for (const d of ALL_DIGITS) {
            // Find which rows this digit appears in within the region
            const rowCounts = new Array(BOARD_SIZE).fill(0);
            // Find which columns this digit appears in within the region
            const colCounts = new Array(BOARD_SIZE).fill(0);
            
            // Count occurrences in each row and column
            for (const pos of region.items) {
                const cell = board.getCell({r: pos.r, c: pos.c});
                if (cell.value === NO_NUMBER && cell.candidates.test(d)) {
                    rowCounts[pos.r]++;
                    colCounts[pos.c]++;
                }
            }
            
            // If digit is confined to a single row in this region
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (rowCounts[r] > 0) {
                    // Check if all cells with this candidate in the region are in this row
                    const totalCandidates = region.items.reduce((count, pos) => {
                        const cell = board.getCell({r: pos.r, c: pos.c});
                        return count + (cell.value === NO_NUMBER && cell.candidates.test(d) ? 1 : 0);
                    }, 0);
                    
                    if (rowCounts[r] === totalCandidates && rowCounts[r] > 1) {
                        // Remove this digit from other cells in the same row but outside the region
                        for (const cell of board.getRow(r)) {
                            // Check if this cell is not in our region
                            const inRegion = region.items.some(pos => pos.r === r && pos.c === cell.pos.c);
                            if (!inRegion && cell.value === NO_NUMBER && cell.removeCandidate(d)) {
                                changed = true;
                            }
                        }
                    }
                }
            }
            
            // If digit is confined to a single column in this region
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (colCounts[c] > 0) {
                    // Check if all cells with this candidate in the region are in this column
                    const totalCandidates = region.items.reduce((count, pos) => {
                        const cell = board.getCell({r: pos.r, c: pos.c});
                        return count + (cell.value === NO_NUMBER && cell.candidates.test(d) ? 1 : 0);
                    }, 0);
                    
                    if (colCounts[c] === totalCandidates && colCounts[c] > 1) {
                        // Remove this digit from other cells in the same column but outside the region
                        for (const cell of board.getCol(c)) {
                            // Check if this cell is not in our region
                            const inRegion = region.items.some(pos => pos.r === cell.pos.r && pos.c === c);
                            if (!inRegion && cell.value === NO_NUMBER && cell.removeCandidate(d)) {
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
    }
    
    return changed;
}

function claiming(board, regions) {
    let changed = false;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (const d of ALL_DIGITS) {
            const regionCounts = new Map();
            
            // Count occurrences of the digit in this row by region
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = board.getCell({r: r, c: c});
                if (cell.value === NO_NUMBER && cell.candidates.test(d)) {
                    // Find the region this cell belongs to
                    for (let regionIdx = 0; regionIdx < regions.length; regionIdx++) {
                        let region = regions[regionIdx];
                        
                        if (region.items.some(pos => pos.r === r && pos.c === c)) {
                            regionCounts.set(regionIdx, (regionCounts.get(regionIdx) || 0) + 1);
                            break;
                        }
                    }
                }
            }
            
            // If all candidates in the row are in a single region
            for (const [regionIdx, count] of regionCounts.entries()) {
                if (count > 1) {
                    // Count total occurrences of this digit in the row
                    const totalInRow = Array.from(regionCounts.values()).reduce((sum, val) => sum + val, 0);
                    
                    if (count === totalInRow) {
                        // Remove this digit from other cells in the same region but not in this row
                        const region = regions[regionIdx];
                        for (const pos of region.items) {
                            if (pos.r !== r) {
                                const cell = board.getCell({r: pos.r, c: pos.c});
                                if (cell.value === NO_NUMBER && cell.removeCandidate(d)) {
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    for (let c = 0; c < BOARD_SIZE; c++) {
        for (const d of ALL_DIGITS) {
            const regionCounts = new Map();
            
            // Count occurrences of the digit in this column by region
            for (let r = 0; r < BOARD_SIZE; r++) {
                const cell = board.getCell({r: r, c: c});
                if (cell.value === NO_NUMBER && cell.candidates.test(d)) {
                    // Find the region this cell belongs to
                    for (let regionIdx = 0; regionIdx < regions.length; regionIdx++) {
                        const region = regions[regionIdx];                        
                        if (region.items.some(pos => pos.r === r && pos.c === c)) {
                            regionCounts.set(regionIdx, (regionCounts.get(regionIdx) || 0) + 1);
                            break;
                        }
                    }
                }
            }
            
            // If all candidates in the column are in a single region
            for (const [regionIdx, count] of regionCounts.entries()) {
                if (count > 1) {
                    // Count total occurrences of this digit in the column
                    const totalInCol = Array.from(regionCounts.values()).reduce((sum, val) => sum + val, 0);
                    
                    if (count === totalInCol) {
                        // Remove this digit from other cells in the same region but not in this column
                        const region = regions[regionIdx];
                        for (const pos of region.items) {
                            if (pos.c !== c) {
                                const cell = board.getCell({r: pos.r, c: pos.c});
                                if (cell.value === NO_NUMBER && cell.removeCandidate(d)) {
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    return changed;
}
