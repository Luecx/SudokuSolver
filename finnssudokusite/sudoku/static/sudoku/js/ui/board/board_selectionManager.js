import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType}     from "../region/RegionType.js";
import { createSelectionConfig } from "./board_selectionConfig.js";

export class SelectionManager {
    constructor(grid) {
        this.grid  = grid;
        this.board = null;

        this.selectionConfig = null;
        this.previousConfig  = null;
        this.selecting       = false;

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
        // close any open selector
        if (this.selectionConfig && this.selectionConfig.target !== RegionType.NONE) {
            // emit an event which stops the current selection
            this.board.emitEvent("ev_selection_ended",
                this.selectionConfig.target === RegionType.CELLS   ? this.board.cellLayer.selected_region :
                this.selectionConfig.target === RegionType.EDGES   ? this.board.hintLayer.selected_region :
                this.selectionConfig.target === RegionType.CORNERS ? this.board.hintLayer.selected_region : null);
            // close the selector
            this.board.cellLayer.hide();
            this.board.hintLayer.hide();
        }

        // save the current config if it exists to allow reverting.
        if (this.selectionConfig) {
            this.previousConfig = this.selectionConfig;
        } else {
            this.previousConfig = this.defaultConfig;
        }

        // set the new config
        this.selectionConfig = config;
        this.deselectAll();

        const target = config.target;

        const isHint = target === RegionType.EDGES
                    || target === RegionType.CORNERS;

        this.board.cellLayer.grid.style.pointerEvents      = isHint ? "none" : "auto";
        this.board.hintLayer.hintLayer.style.pointerEvents = isHint ? "auto" : "none";

        if (target === RegionType.CELLS) {
            this.board.cellLayer.show(config);
            this.board.emitEvent("ev_selection_started", config);
        } else {
            this.board.cellLayer.hide();
        }

        if (isHint) {
            this.board.hintLayer.show(config);
            this.board.emitEvent("ev_selection_started", config);
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
            this.board.cellLayer._clearSelection();
        }

        if (
            this.selectionConfig?.target === RegionType.EDGES ||
            this.selectionConfig?.target === RegionType.CORNERS
        ) {
            this.board.hintLayer.clearSelection();
        }
    }
}
