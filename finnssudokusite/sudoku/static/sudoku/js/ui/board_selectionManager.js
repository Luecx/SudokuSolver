import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType}     from "./region/RegionType.js";
import { createSelectionConfig } from "./board_selectionConfig.js";

export class InteractionManager {
    constructor(grid, ruleManager, renderer) {
        this.grid = grid;
        this.ruleManager = ruleManager;
        this.renderer = renderer;
        this.board = null;

        this.selectionConfig = null;
        this.previousConfig = null;

        this.defaultConfig = createSelectionConfig({
            target: RegionType.CELLS,
            mode: SelectionMode.MULTIPLE
        });
    }

    setup(board) {
        this.board = board;
    }

    /**
     * Applies a selection configuration, enabling appropriate interaction.
     * Stores the current config as the previous one before switching.
     * @param {Object} config - Configuration created by `createSelectionConfig()`
     */
    setSelection(config) {
        if (this.selectionConfig) {
            this.previousConfig = this.selectionConfig;
        }

        this.selectionConfig = config;
        this.deselectAll();

        const target = config.target;

        const isHint = target === RegionType.EDGES
            || target === RegionType.CORNERS;

        this.board.cellLayer.grid.style.pointerEvents      = isHint ? "none" : "auto";
        this.board.hintLayer.hintLayer.style.pointerEvents = isHint ? "auto" : "none";

        if (target === RegionType.CELLS) {
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
     * Reverts the selection config to the last one before the most recent set.
     */
    revertSelection() {
        if (this.previousConfig) {
            this.setSelection(this.previousConfig);
        }
    }

    /**
     * Applies the default selection config (cells, multiple).
     */
    resetSelectionToDefault() {
        this.setSelection(this.defaultConfig);
    }

    /**
     * Deselects everything across all types.
     */
    deselectAll() {
        if (this.selectionConfig?.target === RegionType.CELLS) {
            this.board.cellLayer.clearSelection();
            this.selectionConfig.onItemsCleared?.();
        }

        if (
            this.selectionConfig?.target === RegionType.EDGES ||
            this.selectionConfig?.target === RegionType.CORNERS
        ) {
            this.board.hintLayer.clearSelection();
            this.selectionConfig.onItemsCleared?.();
        }
    }
}
