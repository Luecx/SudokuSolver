import { NumberSet } from '../number/number_set.js';
import { NO_NUMBER } from '../number/number.js';

const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const BOARD_SIZE = 9;

export function attachStandardSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;
        let changed = false;
        const rm = NumberSet.fromNumber(changedCell.value);
        for (const c of board.getRow(changedCell.pos.r))
            if (c.value === NO_NUMBER && c.removeCandidates(rm)) changed = true;
        for (const c of board.getCol(changedCell.pos.c))
            if (c.value === NO_NUMBER && c.removeCandidates(rm)) changed = true;
        for (const c of board.getBlock(changedCell.pos.r, changedCell.pos.c))
            if (c.value === NO_NUMBER && c.removeCandidates(rm)) changed = true;
        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;

        for (let i = 0; i < BOARD_SIZE; i++) {
            if (hiddenSingles(board.getRow(i))) changed = true;
            if (hiddenSingles(board.getCol(i))) changed = true;
        }

        for (let br = 0; br < BOARD_SIZE; br += 3)
            for (let bc = 0; bc < BOARD_SIZE; bc += 3)
                if (hiddenSingles(board.getBlock(br, bc))) changed = true;

        // if (pointing(board)) changed = true;
        // if (claiming(board)) changed = true;
        // if (nakedPairs(board)) changed = true;
        // if (xWing(board)) changed = true;
        // if (swordfish(board)) changed = true;
        // if (xyWing(board)) changed = true;

        return changed;
    };

    instance.checkPlausibility = function (board) {
        const groups = [...board.rows, ...board.cols, ...board.blocks];
        for (const group of groups) {
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
            if (combined.raw() !== NumberSet.all().raw()) return false;
        }
        return true;
    };
}

/* === Advanced Rule Techniques === */

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

function pointing(board) {
    let changed = false;
    for (let br = 0; br < BOARD_SIZE; br += 3) {
        for (let bc = 0; bc < BOARD_SIZE; bc += 3) {
            const block = board.getBlock(br, bc);
            for (const d of ALL_DIGITS) {
                let rowMask = 0, colMask = 0;
                for (const c of block) {
                    if (c.value === NO_NUMBER && c.candidates.test(d)) {
                        rowMask |= 1 << (c.pos.r - br);
                        colMask |= 1 << (c.pos.c - bc);
                    }
                }
                if ([1, 2, 4].includes(rowMask)) {
                    const local = rowMask === 1 ? 0 : rowMask === 2 ? 1 : 2;
                    const global = br + local;
                    for (const peer of board.getRow(global)) {
                        if (Math.floor(peer.pos.c / 3) !== Math.floor(bc / 3))
                            if (peer.removeCandidate(d)) changed = true;
                    }
                }
                if ([1, 2, 4].includes(colMask)) {
                    const local = colMask === 1 ? 0 : colMask === 2 ? 1 : 2;
                    const global = bc + local;
                    for (const peer of board.getCol(global)) {
                        if (Math.floor(peer.pos.r / 3) !== Math.floor(br / 3))
                            if (peer.removeCandidate(d)) changed = true;
                    }
                }
            }
        }
    }
    return changed;
}

function claiming(board) {
    let changed = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
        const row = board.getRow(r);
        for (const d of ALL_DIGITS) {
            let block = -1, count = 0;
            for (const c of row) {
                if (c.value === NO_NUMBER && c.candidates.test(d)) {
                    count++;
                    const b = Math.floor(c.pos.c / 3);
                    if (block < 0) block = b;
                    else if (block !== b) { block = -2; break; }
                }
            }
            if (count > 1 && block >= 0) {
                const br = Math.floor(r / 3) * 3;
                const bc = block * 3;
                for (const c of board.getBlock(br, bc)) {
                    if (c.value === NO_NUMBER && c.pos.r !== r)
                        if (c.removeCandidate(d)) changed = true;
                }
            }
        }
    }

    for (let cidx = 0; cidx < BOARD_SIZE; cidx++) {
        const col = board.getCol(cidx);
        for (const d of ALL_DIGITS) {
            let block = -1, count = 0;
            for (const c of col) {
                if (c.value === NO_NUMBER && c.candidates.test(d)) {
                    count++;
                    const b = Math.floor(c.pos.r / 3);
                    if (block < 0) block = b;
                    else if (block !== b) { block = -2; break; }
                }
            }
            if (count > 1 && block >= 0) {
                const br = block * 3;
                const bc = Math.floor(cidx / 3) * 3;
                for (const c of board.getBlock(br, bc)) {
                    if (c.value === NO_NUMBER && c.pos.c !== cidx)
                        if (c.removeCandidate(d)) changed = true;
                }
            }
        }
    }

    return changed;
}

function nakedPairs(board) {
    let changed = false;
    const process = (unit) => {
        const masks = unit.map(cell => (cell.value === NO_NUMBER ? cell.candidates : new NumberSet()));
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (masks[i].count() !== 2) continue;
            for (let j = i + 1; j < BOARD_SIZE; j++) {
                if (!masks[i].equals(masks[j])) continue;
                for (let k = 0; k < BOARD_SIZE; k++) {
                    if (k === i || k === j) continue;
                    const c = unit[k];
                    if (c.value === NO_NUMBER && c.removeCandidates(masks[i])) changed = true;
                }
            }
        }
    };

    for (let i = 0; i < BOARD_SIZE; i++) process(board.getRow(i));
    for (let i = 0; i < BOARD_SIZE; i++) process(board.getCol(i));
    for (let br = 0; br < BOARD_SIZE; br += 3)
        for (let bc = 0; bc < BOARD_SIZE; bc += 3)
            process(board.getBlock(br, bc));

    return changed;
}

function xWing(board) {
    let changed = false;
    for (const d of ALL_DIGITS) {
        const rowCols = Array.from({ length: BOARD_SIZE }, () => []);
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = board.getCell({ r, c });
                if (cell.value === NO_NUMBER && cell.candidates.test(d)) rowCols[r].push(c);
            }
        }
        for (let r1 = 0; r1 < BOARD_SIZE; r1++) {
            if (rowCols[r1].length !== 2) continue;
            for (let r2 = r1 + 1; r2 < BOARD_SIZE; r2++) {
                if (JSON.stringify(rowCols[r1]) !== JSON.stringify(rowCols[r2])) continue;
                for (let r3 = 0; r3 < BOARD_SIZE; r3++) {
                    if (r3 === r1 || r3 === r2) continue;
                    for (const col of rowCols[r1]) {
                        const cell = board.getCell({ r: r3, c: col });
                        if (cell.value === NO_NUMBER && cell.removeCandidate(d)) changed = true;
                    }
                }
            }
        }
    }
    return changed;
}

function swordfish(board) {
    let changed = false;
    for (const d of ALL_DIGITS) {
        const rowCols = Array.from({ length: BOARD_SIZE }, () => []);
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = board.getCell({ r, c });
                if (cell.value === NO_NUMBER && cell.candidates.test(d)) rowCols[r].push(c);
            }
        }
        for (let a = 0; a < BOARD_SIZE; a++) {
            if (rowCols[a].length < 2 || rowCols[a].length > 3) continue;
            for (let b = a + 1; b < BOARD_SIZE; b++) {
                if (rowCols[b].length < 2 || rowCols[b].length > 3) continue;
                for (let c = b + 1; c < BOARD_SIZE; c++) {
                    if (rowCols[c].length < 2 || rowCols[c].length > 3) continue;
                    const union = [...new Set([...rowCols[a], ...rowCols[b], ...rowCols[c]])];
                    if (union.length !== 3) continue;
                    for (let r2 = 0; r2 < BOARD_SIZE; r2++) {
                        if (r2 === a || r2 === b || r2 === c) continue;
                        for (const col of union) {
                            const cell = board.getCell({ r: r2, c: col });
                            if (cell.value === NO_NUMBER && cell.removeCandidate(d)) changed = true;
                        }
                    }
                }
            }
        }
    }
    return changed;
}

function xyWing(board) {
    let changed = false;
    const bivals = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = board.getCell({ r, c });
            if (cell.value === NO_NUMBER && cell.candidates.count() === 2)
                bivals.push(cell);
        }
    }

    const isPeer = (a, b) =>
        a.pos.r === b.pos.r ||
        a.pos.c === b.pos.c ||
        Math.floor(a.pos.r / 3) * 3 + Math.floor(a.pos.c / 3) ===
        Math.floor(b.pos.r / 3) * 3 + Math.floor(b.pos.c / 3);

    for (const P of bivals) {
        const [x, y] = [...P.candidates];
        for (const A of bivals) {
            if (A === P || !A.candidates.test(x) || A.candidates.test(y) || !isPeer(P, A)) continue;
            const z = [...A.candidates.and(new NumberSet(~(1 << x) & NumberSet.all().mask))][0];
            for (const B of bivals) {
                if (
                    B === P || B === A || !B.candidates.test(y) || B.candidates.test(x)
                    || !B.candidates.test(z) || !isPeer(P, B)
                ) continue;

                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        const C = board.getCell({ r, c });
                        if (
                            C.value === NO_NUMBER &&
                            C.candidates.test(z) &&
                            isPeer(C, A) &&
                            isPeer(C, B)
                        ) {
                            if (C.removeCandidate(z)) changed = true;
                        }
                    }
                }
            }
        }
    }
    return changed;
}
