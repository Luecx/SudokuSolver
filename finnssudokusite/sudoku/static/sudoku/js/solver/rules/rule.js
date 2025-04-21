// === rule.js ===

/**
 * Base class for all Sudoku rules.
 * Subclasses should implement all three methods.
 */
export class Rule {
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
}
