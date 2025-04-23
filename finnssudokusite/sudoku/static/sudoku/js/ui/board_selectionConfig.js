import { SelectionTarget, SelectionMode } from "./board_selectionEnums.js";

/**
 * Returns a structured selection config.
 *
 * @param {Object} opts - Custom options for the selection.
 * @returns {Object} Validated selection config.
 */
export function createSelectionConfig(opts = {}) {
    return {
        target              : opts.target     ?? SelectionTarget.CELLS,
        mode                : opts.mode       ?? SelectionMode.SINGLE,
        showVisual          : opts.showVisual ?? true,
        preserveOnModifier  : opts.preserveOnModifier ?? null,

        onCellAdded         : opts.onCellAdded ?? (() => {}),
        onCellsCleared      : opts.onCellsCleared ?? (() => {}),

        onEdgeAdded         : opts.onEdgeAdded ?? (() => {}),
        excludeEdges        : opts.excludeEdges ?? [],

        onCornerAdded       : opts.onCornerAdded ?? (() => {}),
        excludeCorners      : opts.excludeCorners ?? [],
    };
}
