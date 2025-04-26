import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType } from "../region/RegionType.js";

/**
 * Returns a structured selection config.
 *
 * @param {Object} opts - Custom options for the selection.
 * @returns {Object} Validated selection config.
 */
export function createSelectionConfig(opts = {}) {
    return {
        target             : opts.target ?? RegionType.CELLS,
        mode               : opts.mode ?? SelectionMode.SINGLE,
        showVisual         : opts.showVisual ?? true,
        preserveOnModifier : opts.preserveOnModifier ?? null,

        // Optional exclusions
        excludeEdges       : opts.excludeEdges ?? [],
        excludeCorners     : opts.excludeCorners ?? [],
        initialSelected    : opts.initialSelected ?? [],
    };
}
