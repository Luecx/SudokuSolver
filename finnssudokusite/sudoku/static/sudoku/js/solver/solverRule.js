// === rule.js ===

import { RegionType } from "../region/RegionType.js";
import { Region } from "../region/Region.js";
import { SolverCell } from "./solverCell.js";
import { SolverBoard } from "./solverBoard.js";

/**
 * Base class for all Sudoku rules.
 * Subclasses must implement all three methods:
 * - numberChanged
 * - candidatesChanged
 * - checkPlausibility
 */
export class SolverRule {
    /**
     * Called when a number is set on the board.
     * @param {SolverBoard} board - Current solver board state.
     * @param {SolverCell} changedCell - The cell that was updated.
     * @returns {boolean} - True if this rule made further changes to the board.
     */
    numberChanged(board, changedCell) {
        throw new Error('numberChanged() must be implemented');
    }

    /**
     * Called after numbers are placed to allow the rule to prune or alter candidates.
     * @param {SolverBoard} board - Current solver board state.
     * @returns {boolean} - True if any candidates were changed by this rule.
     */
    candidatesChanged(board) {
        throw new Error('candidatesChanged() must be implemented');
    }

    /**
     * Called to validate that the current board state is plausible under this rule.
     * @param {SolverBoard} board - Current solver board state.
     * @returns {boolean} - True if the board satisfies the rule so far.
     */
    checkPlausibility(board) {
        throw new Error('checkPlausibility() must be implemented');
    }

    /**
     * Returns a region of all cell indices that are relevant to this rule,
     * including all internal `this.fields` and, if applicable, any subrules in `this.rules`.
     *
     * This is used to determine which cells the rule is monitoring,
     * primarily for GUI highlighting or analysis.
     *
     * @param {SolverBoard} board - The board context (not required but sometimes useful).
     * @returns {Region} - A Region of type CELLS containing all relevant cell indices.
     */
    attachedCells(board) {
        let result = new Region(RegionType.CELLS);

        /**
         * Adds all attached cells from a field (if it's a Region).
         * @param {*} field
         */
        const addField = (field) => {
            if (field instanceof Region) {
                try {
                    result = result.union(field.attachedCells(board.size));
                } catch (e) {
                    console.warn(`Skipping region: ${e.message}`);
                }
            }
        };

        // Merge subrule regions
        if (Array.isArray(this.rules)) {
            for (const rule of this.rules) {
                for (const field of Object.values(rule.fields || {})) {
                    addField(field);
                }
            }
        }

        // Merge own region fields
        for (const field of Object.values(this.fields || {})) {
            addField(field);
        }

        return result;
    }
}
