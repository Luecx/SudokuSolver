import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType } from "../region/RegionType.js";
import { createSelectionConfig } from "./board_selectionConfig.js";

export class SelectionManager {
    constructor() {
        this.board = null;

        this.selectionConfig = null;
        this.previousConfig  = null;

        this.defaultConfig = createSelectionConfig({
            target: RegionType.CELLS,
            mode: SelectionMode.MULTIPLE,
            isDefault: true,
        });
    }

    setup(board) {
        this.board = board;
        this.resetSelectionToDefault();
    }
    
    isDefaultMode() {
        return this.selectionConfig?.isDefault ?? false;
    }

    getSelectedRegion() {
        if (!this.selectionConfig) return null;

        const target = this.selectionConfig.target;

        if (target === RegionType.CELLS) {
            return this.board.cellLayer.selected_region;
        }
        if (target === RegionType.EDGES || target === RegionType.CORNERS) {
            return this.board.hintLayer.selected_region;
        }
        if (target === RegionType.ROWCOL) {
            return this.board.hintRCLayer.selected_region;
        }
        if (target === RegionType.DIAGONAL) {
            return this.board.hintDiagLayer.selected_region;
        }
        return null;
    }
    
    setSelectedRegion(region) {
        if (!this.selectionConfig) return;

        const target = this.selectionConfig.target;

        if (target === RegionType.CELLS && region.type === RegionType.CELLS) {
            this.board.cellLayer.selected_region = region;
        }
        if ((target === RegionType.EDGES || target === RegionType.CORNERS) &&
            (region.type === RegionType.EDGES || region.type === RegionType.CORNERS)) {
            this.board.hintLayer.selected_region = region;
        }
        if (target === RegionType.ROWCOL && region.type === RegionType.ROWCOL) {
            this.board.hintRCLayer.selected_region = region;
        }
        if (target === RegionType.DIAGONAL && region.type === RegionType.ROWCOL) {
            this.board.hintDiagLayer.selected_region = region;
        }
    }

    /**
     * Applies a selection configuration, enabling appropriate interaction.
     * Stores the current config as the previous one before switching.
     * @param {Object} config - Configuration created by `createSelectionConfig()`
     */
    setSelectionMode(config) {
        // close any open selector
        if (this.selectionConfig && this.selectionConfig.target !== RegionType.NONE) {
            // emit an event which stops the current selection
            this.board.emitEvent("ev_selection_ended",
                this.selectionConfig.target === RegionType.CELLS    ? this.board.cellLayer.selected_region :
                this.selectionConfig.target === RegionType.EDGES    ? this.board.hintLayer.selected_region :
                this.selectionConfig.target === RegionType.CORNERS  ? this.board.hintLayer.selected_region :
                this.selectionConfig.target === RegionType.ROWCOL   ? this.board.hintRCLayer.selected_region :
                this.selectionConfig.target === RegionType.DIAGONAL ? this.board.hintDiagLayer.selected_region  : null
            );

            // close the selector
            this.board.cellLayer.hide();
            this.board.hintLayer.hide();
            this.board.hintRCLayer.hide();
            this.board.hintDiagLayer.hide();
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

        const isRC = target === RegionType.ROWCOL;
        const isDiag = target === RegionType.DIAGONAL


        this.board.cellLayer.grid.style.pointerEvents        = "none";
        this.board.hintLayer.hintLayer.style.pointerEvents   = "none";
        this.board.hintRCLayer.rcLayer.style.pointerEvents   = "none";
        this.board.hintDiagLayer.diagLayer.style.pointerEvents = "none";

        if (isRC)        this.board.hintRCLayer.rcLayer.style.pointerEvents = "auto";
        else if (isDiag) this.board.hintDiagLayer.diagLayer.style.pointerEvents = "auto";
        else if (isHint) this.board.hintLayer.hintLayer.style.pointerEvents = "auto";
        else             this.board.cellLayer.grid.style.pointerEvents = "auto";

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

        if (isRC) {
            this.board.hintRCLayer.show(config);
            this.board.emitEvent("ev_selection_started", config);
        } else {
            this.board.hintRCLayer.hide();
        }

        if (isDiag) {
            this.board.hintDiagLayer.show(config);
            this.board.emitEvent("ev_selection_started", config);
        } else {
            this.board.hintDiagLayer.hide();
        }
    }

    /**
     * Reverts the selection config to the last one before the most recent set.
     */
    revertSelection() {
        if (this.previousConfig) {
            this.setSelectionMode(this.previousConfig);
        }
    }

    /**
     * Applies the default selection config (cells, multiple).
     */
    resetSelectionToDefault() {
        this.setSelectionMode(this.defaultConfig);
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

        if (this.selectionConfig?.target === RegionType.ROWCOL) {
            this.board.hintRCLayer.clearSelection();
        }
    }
}
