import { SelectionTarget, SelectionMode } from "./board_selectionEnums.js";

export class InteractionManager {
    constructor(grid, ruleManager, renderer) {
        this.grid = grid;
        this.ruleManager = ruleManager;
        this.renderer = renderer;
        this.board = null;

        this.visualEnabled = true;
        this.selectionConfig = null;
    }

    setup(board) {
        this.board = board;
    }

    /**
     * Applies a selection configuration, enabling appropriate interaction.
     * @param {Object} config - Configuration created by `createSelectionConfig()`
     */
    setSelection(config) {
        this.selectionConfig = config;
        this.deselectAll();

        const target = config.target;

        const isHint = target === SelectionTarget.EDGES
                            || target === SelectionTarget.CORNERS;

        this.board.cellLayer.grid.style.pointerEvents = isHint ? "none" : "auto";
        this.board.hintLayer.hintLayer.style.pointerEvents = isHint ? "auto" : "none";

        if (target === SelectionTarget.CELLS) {
            this.board.cellLayer.show(config);
        } else {
            this.board.cellLayer.hide();
        }

        if (isHint) {
            this.board.hintLayer.show(config);
        } else {
            this.board.hintLayer.hide();
        }
    }


    /**
     * Enables or disables blue cell selection highlighting.
     * @param {boolean} show
     */
    showSelectionBlue(show) {
        this.visualEnabled = show;
    }

    /**
     * Deselects everything across all types.
     */
    deselectAll() {
        if (this.selectionConfig?.target === SelectionTarget.CELLS) {
            this.board.cellLayer.clearSelection();
            this.selectionConfig.onCellsCleared?.();
        }

        if (
            this.selectionConfig?.target === SelectionTarget.EDGES ||
            this.selectionConfig?.target === SelectionTarget.CORNERS
        ) {
            this.board.hintLayer.clearSelection();
        }
    }
}
