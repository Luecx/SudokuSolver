import { NO_NUMBER } from "../number/number.js";
import { NumberSet } from "../number/number_set.js";

export function attachChevronSolverLogic(instance) {
    instance.numberChanged = function (board, changedCell) {
        if (changedCell.value === NO_NUMBER) return false;
        let changed = false;

        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;

            for (const edge of rule.fields.region.items) {
                const cell = board.getCell({ r: edge.r1, c: edge.c1 });
                const neighbor = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= enforceGreaterLess(cell, neighbor, rule.symbol);
                changed ||= enforceGreaterLess(neighbor, cell, getOppositeSymbol(rule.symbol));
            }
        }

        return changed;
    };

    instance.candidatesChanged = function (board) {
        let changed = false;

        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;

            for (const edge of rule.fields.region.items) {
                const cell = board.getCell({ r: edge.r1, c: edge.c1 });
                const neighbor = board.getCell({ r: edge.r2, c: edge.c2 });

                changed ||= enforceGreaterLess(cell, neighbor, rule.symbol);
                changed ||= enforceGreaterLess(neighbor, cell, getOppositeSymbol(rule.symbol));
            }
        }

        return changed;
    };

    instance.checkPlausibility = function (board) {
        for (const rule of instance.rules) {
            if (!rule?.fields?.region) continue;

            for (const edge of rule.fields.region.items) {
                const cell = board.getCell({ r: edge.r1, c: edge.c1 });
                const neighbor = board.getCell({ r: edge.r2, c: edge.c2 });

                // if condition is not met, return false
                if (!checkGreaterLessPair(cell, neighbor, rule.symbol))
                    return false;
            }
        }

        // All checks passed
        return true;
    };
}

// helper functions

function getOppositeSymbol(symbol) {
    switch (symbol) {
        case 'up': return 'down';
        case 'down': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
        default: return symbol;
    }
}

function checkGreaterLessPair(cell, neighbor, symbol) {
    if (cell.value === NO_NUMBER || neighbor.value === NO_NUMBER)
        return true;
    
    switch (symbol) {
        case 'up':
        case 'left':
            return cell.value < neighbor.value;
        case 'down':
        case 'right':
            return cell.value > neighbor.value;
        default:
            throw new Error(`Invalid symbol in chevron solver: ${symbol}`);
    }
}

function enforceGreaterLess(cell, neighbor, symbol) {
    if (cell.value !== NO_NUMBER && neighbor.value !== NO_NUMBER) {
        // Both cells are filled, no changes needed
        return false;
    }

    let changed = false;
    const candidates = cell.getCandidates();
    const neighborCandidates = neighbor.getCandidates();

    if (symbol === 'up' || symbol === 'left') {
        // Current cell must be < neighbor
        if (cell.value !== NO_NUMBER) {
            // neighbor must be > current value
            changed |= neighbor.onlyAllowCandidates(
                NumberSet.greaterThan(cell.value, cell.size)
            );
        } else if (neighbor.value !== NO_NUMBER) {
            // Current cell must be < neighbor value
            changed |= cell.onlyAllowCandidates(
                NumberSet.lessThan(neighbor.value, cell.size)
            );
        } else {
            // Both empty - mutual restriction
            const minCell = candidates.lowest();
            changed |= neighbor.onlyAllowCandidates(
                NumberSet.greaterThan(minCell - 1, cell.size)
            );

            const maxNeighbor = neighborCandidates.highest();
            changed |= cell.onlyAllowCandidates(
                NumberSet.lessThan(maxNeighbor + 1, cell.size)
            );
        }
    } 
    else if (symbol === 'down' || symbol === 'right') {
        // Current cell must be > neighbor
        if (cell.value !== NO_NUMBER) {
            // Neighbor must be < current value
            changed |= neighbor.onlyAllowCandidates(
                NumberSet.lessThan(cell.value, cell.size)
            );
        } else if (neighbor.value !== NO_NUMBER) {
            // Current cell must be > neighbor value
            changed |= cell.onlyAllowCandidates(
                NumberSet.greaterThan(neighbor.value, cell.size)
            );
        } else {
            // Both empty - mutual restriction
            const maxCell = candidates.highest();
            changed |= neighbor.onlyAllowCandidates(
                NumberSet.lessThan(maxCell + 1, cell.size)
            );

            const minNeighbor = neighborCandidates.lowest();
            changed |= cell.onlyAllowCandidates(
                NumberSet.greaterThan(minNeighbor - 1, cell.size)
            );
        }
    }

    return changed;
}
