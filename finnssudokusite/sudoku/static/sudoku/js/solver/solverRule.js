// === rule.js ===

import {RegionType} from "../region/RegionType.js";
import {Region} from "../region/Region.js";

/**
 * Base class for all Sudoku rules.
 * Subclasses should implement all three methods.
 */
export class SolverRule {
    /**
     * Called when a number is set on the board.
     * @param {Board} board
     * @param {Cell} changedCell
     * @returns {boolean} - whether this rule changed anything
     */
    numberChanged(board, changedCell) {
        throw new Error('numberChanged() must be implemented');
    }

    /**
     * Called to allow the rule to prune or adjust candidates.
     * @param {Board} board
     * @returns {boolean} - whether any candidates were changed
     */
    candidatesChanged(board) {
        throw new Error('candidatesChanged() must be implemented');
    }

    /**
     * Called to check if the current board violates the rule.
     * @param {Board} board
     * @returns {boolean}
     */
    checkPlausibility(board) {
        throw new Error('checkPlausibility() must be implemented');
    }

    relevantCells(board) {

        let result = new Region(RegionType.CELLS);
        // lambda to add a field to the region
        const addField = (field) => {
            if (field instanceof Region) {
                try {
                    const asCells = field.toCellRegion();
                    result = result.union(asCells);
                } catch (e) {
                    console.warn(`Skipping region: ${e.message}`);
                }
            }
        }

        // go through each rule and then through each field
        for (const rule of this.rules) {
            for (const field of Object.values(rule.fields)) {
                addField(field);
            }
        }

        for (const field of Object.values(this.fields)) {
            addField(field);
        }
        return result;
    }

}
