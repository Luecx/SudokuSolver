// === solver_stats.js ===

/**
 * Class representing statistics collected during the solving process.
 * Useful for performance analysis, debugging, and understanding solver behavior.
 */
export class SolverStats {
    /**
     * Creates a new SolverStats instance.
     *
     * @param {number} solutionsFound - Total number of valid solutions discovered.
     * @param {number} nodesExplored  - Number of recursive search nodes evaluated.
     * @param {number} timeTakenMs    - Time taken to solve, in milliseconds.
     * @param {boolean} interrupted   - Whether solving was interrupted early due to constraints (e.g. maxNodes limit).
     */
    constructor(solutionsFound = 0, nodesExplored = 0, timeTakenMs = 0.0, interrupted = false) {
        this.solutionsFound = solutionsFound;
        this.nodesExplored = nodesExplored;
        this.timeTakenMs = timeTakenMs;
        this.interrupted = interrupted;
    }

    /**
     * Returns a formatted multi-line string with all stats.
     * Suitable for console logging or display.
     *
     * @returns {string} Human-readable summary of the statistics.
     */
    toString() {
        return [
            '\n------------------------------',
            ` Solutions Found: ${this.solutionsFound}`,
            `  Nodes Explored: ${this.nodesExplored}`,
            `       Time (ms): ${this.timeTakenMs.toFixed(2)}`,
            `     Interrupted: ${this.interrupted ? 'Yes' : 'No'}`,
            '------------------------------\n',
        ].join('\n');
    }

    /**
     * Prints the formatted stats directly to the console.
     */
    print() {
        console.log(this.toString());
    }
}
