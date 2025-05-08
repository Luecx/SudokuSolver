/**
 * RegionType.js
 *
 * Defines symbolic constants for different region types in a grid-based structure.
 * These are used to distinguish how elements are grouped (e.g., individual cells, edges, corners, or full rows/columns).
 */

export const RegionType = {
    /** No region selected */
    NONE: 'none',

    /** Region composed of CellIdx items (individual cells) */
    CELLS: 'cells',

    /** Region composed of EdgeIdx items (edges between cells) */
    EDGES: 'edges',

    /** Region composed of CornerIdx items (junctions between 4 cells) */
    CORNERS: 'corners',

    /** Region composed of RCIdx items (entire rows or columns or wildcard combinations) */
    ROWCOL: "rowcol",
};
