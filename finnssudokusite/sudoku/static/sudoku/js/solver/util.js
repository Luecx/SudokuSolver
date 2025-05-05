import { CellRegion } from "../region/Region.js";
import { EMPTY } from "./defs.js";
import { Candidates } from "./candidates.js";
import { CellIdx } from "../region/CellIdx.js";
import { Cell } from "./cell.js";

// === Region Utilities ===

// --- Counting ---

export function count_number(region, board, num) {
    return region.items.reduce((acc, pos) =>
        board.getCell(pos).value === num ? acc + 1 : acc, 0);
}

export function count_candidate(region, board, num) {
    return region.items.reduce((acc, pos) => {
        const cell = board.getCell(pos);
        return cell.value === EMPTY && cell.candidates.test(num) ? acc + 1 : acc;
    }, 0);
}

export function count_numbers(region, board) {
    const result = Array(10).fill(0);
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== EMPTY) result[val]++;
    }
    return result;
}

export function count_candidates(region, board) {
    const result = Array(10).fill(0);
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            for (let d = 1; d <= 9; d++) {
                if (cell.candidates.test(d)) result[d]++;
            }
        }
    }
    return result;
}

// --- Region Filters ---

export function empty(region, board) {
    const items = region.items.filter(pos => board.getCell(pos).value === EMPTY);
    return new CellRegion(items);
}

export function nonempty(region, board) {
    const items = region.items.filter(pos => board.getCell(pos).value !== EMPTY);
    return new CellRegion(items);
}

// --- Candidate and Number Union ---

export function combined_candidates(region, board) {
    const result = new Candidates();
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) result.orEq(cell.candidates);
    }
    return result;
}

export function combined_numbers(region, board) {
    const result = new Candidates();
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== EMPTY) result.allow(val);
    }
    return result;
}

// --- Min / Max ---

export function min_number(region, board) {
    let min = 10;
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== EMPTY && val < min) min = val;
    }
    return min === 10 ? null : min;
}

export function max_number(region, board) {
    let max = 0;
    for (const pos of region.items) {
        const val = board.getCell(pos).value;
        if (val !== EMPTY && val > max) max = val;
    }
    return max === 0 ? null : max;
}

export function min_candidate(region, board) {
    let min = 10;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            for (let d = 1; d <= 9; d++) {
                if (cell.candidates.test(d)) {
                    min = Math.min(min, d);
                }
            }
        }
    }
    return min === 10 ? null : min;
}

export function max_candidate(region, board) {
    let max = 0;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            for (let d = 1; d <= 9; d++) {
                if (cell.candidates.test(d)) {
                    max = Math.max(max, d);
                }
            }
        }
    }
    return max === 0 ? null : max;
}

// --- Removal ---

export function remove_candidate(region, board, num) {
    let changed = false;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY && cell.candidates.test(num)) {
            cell.candidates.disallow(num);
            changed = true;
        }
    }
    return changed;
}

export function remove_candidates(region, board, cands) {
    let changed = false;
    const mask = ~cands.raw() & Candidates.MASK_ALL;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            const before = cell.candidates.raw();
            cell.candidates.andEq(new Candidates(mask));
            if (cell.candidates.raw() !== before) changed = true;
        }
    }
    return changed;
}

export function remove_candidates_range(region, board, below, above) {
    let changed = false;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            for (let d = 1; d <= 9; d++) {
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
    const result = new Candidates();
    result.mask = Candidates.MASK_ALL;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            result.andEq(cell.candidates);
        }
    }
    return result;
}

// --- Arithmetic ---

export function sum(region, board) {
    return region.items.reduce((acc, pos) => {
        const val = board.getCell(pos).value;
        return val !== EMPTY ? acc + val : acc;
    }, 0);
}

export function lowerbound(region, board) {
    let total = 0;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            total += min_candidate(new CellRegion([pos]), board) ?? 1;
        } else {
            total += cell.value;
        }
    }
    return total;
}

export function upperbound(region, board) {
    let total = 0;
    for (const pos of region.items) {
        const cell = board.getCell(pos);
        if (cell.value === EMPTY) {
            total += max_candidate(new CellRegion([pos]), board) ?? 9;
        } else {
            total += cell.value;
        }
    }
    return total;
}

// --- Cell Mapping ---

export function cells(region, board) {
    return region.items.map(pos => board.getCell(pos));
}
