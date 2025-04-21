// === solver_stats.js ===

export class SolverStats {
    constructor(solutionsFound = 0, nodesExplored = 0, timeTakenMs = 0.0) {
        this.solutionsFound = solutionsFound; // integer count
        this.nodesExplored = nodesExplored;
        this.timeTakenMs = timeTakenMs;
    }

    /**
     * Nicely formatted string output
     * @returns {string}
     */
    toString() {
        return [
            '\n------------------------------',
            ` Solutions Found: ${this.solutionsFound}`,
            `  Nodes Explored: ${this.nodesExplored}`,
            `       Time (ms): ${this.timeTakenMs.toFixed(2)}`,
            '------------------------------\n',
        ].join('\n');
    }

    /**
     * Log the stats to the console
     */
    print() {
        console.log(this.toString());
    }
}
