import { NumberSet } from '../number/number_set.js';
import { NO_NUMBER } from '../number/number.js';
import { CellIdx } from "../region/CellIdx.js";

export function attachCloneSolverLogic(instance) {
    instance.numberChanged = function(board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;
        
        let changed = false;
        const rules = instance.rules;
        const cloneGroups = findCloneGroups(rules);
        
        for (const group of cloneGroups) {
            if (group.length < 2) continue; // skip if no clone exists
            
            // find which region contains the changed cell
            let changedRegionIdx = -1;
            let changedItemIdx = -1;
            
            for (const regionIdx of group) {
                const region = rules[regionIdx].fields.region;
                
                const itemIdx = region.findIndex(changedCell.pos);
                if (itemIdx !== -1) {
                    // Cell found in this region
                    changedRegionIdx = regionIdx;
                    changedItemIdx = itemIdx;
                    break;
                }
            }

            // if changed cell doesnt affect this group, skip
            if (changedRegionIdx === -1) continue;
            
            for (let i = 0; i < group.length; i++) {
                if (i === changedRegionIdx) continue; // skip region that was changed
                
                const region = rules[group[i]].fields.region;
                const pos = region.items[changedItemIdx];
                const cell = board.getCell({r: pos.r, c: pos.c});
            
                // make only the current value a candidate
                changed |= cell.onlyAllowCandidates(NumberSet.fromNumber(changedCell.value));
            }
        }
        
        return changed;
    };

    instance.candidatesChanged = function(board) {
        // only makes sense to implement if this is used in standard sudoku
        return false; 
    };

    instance.checkPlausibility = function(board) {
        const rules = instance.rules;
        const cloneGroups = findCloneGroups(rules);
        
        for (const group of cloneGroups) {
            if (group.length < 2) return false; // skip if no clone exists

            const regionSize = rules[group[0]].fields.region.size();
            for (let itemIdx = 0; itemIdx < regionSize; itemIdx++) {
                let value;

                for (const regionIdx of group) {
                    const region = rules[regionIdx].fields.region;
                    const pos = region.items[itemIdx];
                    const cell = board.getCell({r: pos.r, c: pos.c});

                    if (cell.value === NO_NUMBER) continue;

                    if (!value)
                        value = cell.value;
                    else if (value !== cell.value)
                        return false; // conflict found
                }
            }
        }
        
        return true;
    };
}

// helper functions

export function findCloneGroups(rules) {
    const cloneGroups = [];
    const processed = new Set();
         
    for (let i = 0; i < rules.length; i++) {
        if (processed.has(i)) continue;            

        const region = rules[i].fields.region;
        const clones = [i];
            
        for (let j = i + 1; j < rules.length; j++) {
            if (processed.has(j)) continue;
                
            if (isRegionSameShape(region,  rules[j].fields.region)) {
                clones.push(j);
                processed.add(j);
            }
        }

        //if (clones.length < 2) {
        //    throw new Error("Clone groups must have at least 2 regions");
        //}
            
        processed.add(i);
        cloneGroups.push(clones);
    }

    // sort each clone regions so items are easier to compare later on
    for (const group of cloneGroups) {
        for (const regionIdx of group) {
            const region = rules[regionIdx].fields.region;
            if (!region) continue;
            
            region.items.sort((a, b) => {
                if (a.r !== b.r) 
                    return a.r - b.r; // sort by row first
                else 
                    return a.c - b.c; // for same row, sort by column
            });
        }
    }
        
    return cloneGroups;
}

function isRegionSameShape(region1, region2) {
    if (!region1 || !region2) return false; // check if both regions are defined
    if (region1.size() !== region2.size()) return false;

    const normalizeCoordinates = (cells) => {
        if (cells.length === 0) return [];

        let minRow = Infinity;
        let minCol = Infinity;
            
        for (const cell of cells) {
            minRow = Math.min(minRow, cell.r);
            minCol = Math.min(minCol, cell.c);
        }

        return cells.map(cell => new CellIdx(cell.r - minRow, cell.c - minCol));
    };

    const cells1 = region1.items;
    const cells2 = region2.items;

    const normalizedCells1 = normalizeCoordinates(cells1);
    const normalizedCells2 = normalizeCoordinates(cells2);

    const shape1 = normalizedCells1.map(cell => cell.toString()).sort();
    const shape2 = normalizedCells2.map(cell => cell.toString()).sort();

    for (let i = 0; i < shape1.length; i++)
        if (shape1[i] !== shape2[i]) return false;

    return true;
}
