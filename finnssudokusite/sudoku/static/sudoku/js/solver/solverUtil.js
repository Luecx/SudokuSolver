// === solver_util.js ===

import { Region } from "../region/Region.js";
import { RegionType } from "../region/RegionType.js";
import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

// --- Counting ---

export function count_number(region, board, num) {
    return region.items.reduce((acc, pos) => board.getCell(pos).value === num ? acc + 1 : acc, 0);
}

export function count_candidate(region, board, num) {
    return region.items.reduce((acc, pos) => {
        const cell = board.getCell(pos);
        return cell.value === NO_NUMBER && cell.candidates.test(num) ? acc + 1 : acc;
    }, 0);
}

export function count_numbers(region, board) {
    const result = Array(board.size + 1).fill(0);
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== NO_NUMBER) result[val]++;
    }
    return result;
}

export function count_candidates(region, board) {
    const result = Array(board.size + 1).fill(0);
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER) {
            for (const d of cell.candidates) {
                result[d]++;
            }
        }
    }
    return result;
}

// --- Region Filters ---

export function empty(region, board) {
    return new Region(RegionType.CELLS, region.items.filter(pos => board.getCell(pos).value === NO_NUMBER));
}

export function nonempty(region, board) {
    return new Region(RegionType.CELLS, region.items.filter(pos => board.getCell(pos).value !== NO_NUMBER));
}

// --- Candidate and Number Union ---

export function combined_candidates(region, board) {
    let result = new NumberSet(board.size);
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER) result.orEq(cell.candidates);
    }
    return result;
}

export function combined_numbers(region, board) {
    let result = new NumberSet(board.size);
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== NO_NUMBER) result.allow(val);
    }
    return result;
}

// --- Min / Max ---

export function min_number(region, board) {
    let min = board.size + 1;
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== NO_NUMBER && val < min) min = val;
    }
    return min > board.size ? null : min;
}

export function max_number(region, board) {
    let max = 0;
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== NO_NUMBER && val > max) max = val;
    }
    return max === 0 ? null : max;
}

export function min_candidate(region, board) {
    let min = board.size + 1;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER) {
            for (const d of cell.candidates) min = Math.min(min, d);
        }
    }
    return min > board.size ? null : min;
}

export function max_candidate(region, board) {
    let max = 0;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER) {
            for (const d of cell.candidates) max = Math.max(max, d);
        }
    }
    return max === 0 ? null : max;
}

// --- Removal ---

export function remove_candidate(region, board, num) {
    let changed = false;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER && cell.candidates.test(num)) {
            cell.candidates.disallow(num);
            changed = true;
        }
    }
    return changed;
}

export function remove_candidates(region, board, cands) {
    let changed = false;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER) {
            const before = cell.candidates.raw();
            cell.candidates.andEq(cands.not());
            if (cell.candidates.raw() !== before) changed = true;
        }
    }
    return changed;
}

export function remove_candidates_range(region, board, below, above) {
    let changed = false;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER) {
            for (let d = 1; d <= board.size; d++) {
                if ((d < below || d > above) && cell.candidates.test(d)) {
                    cell.candidates.disallow(d);
                    changed = true;
                }
            }
        }
    }
    return changed;
}

// --- Intersection ---

export function intersect_candidates(region, board) {
    let result = NumberSet.all(board.size);
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === NO_NUMBER) {
            result.andEq(cell.candidates);
        }
    }
    return result;
}

// --- Arithmetic ---

export function sum(region, board) {
    return region.items.reduce((acc, pos) => {
        const val = board.getCell(pos).value;
        return val !== NO_NUMBER ? acc + val : acc;
    }, 0);
}

export function lowerbound(region, board) {
    return region.items.reduce((acc, pos) => {
        const cell = board.getCell(pos);
        return acc + (cell.value !== NO_NUMBER ? cell.value : min_candidate(new Region(RegionType.CELLS, [pos]), board) ?? 1);
    }, 0);
}

export function upperbound(region, board) {
    return region.items.reduce((acc, pos) => {
        const cell = board.getCell(pos);
        return acc + (cell.value !== NO_NUMBER ? cell.value : max_candidate(new Region(RegionType.CELLS, [pos]), board) ?? board.size);
    }, 0);
}

// --- Cell Mapping ---

export function cells(region, board) {
    return region.items.map(pos => board.getCell(pos));
}
