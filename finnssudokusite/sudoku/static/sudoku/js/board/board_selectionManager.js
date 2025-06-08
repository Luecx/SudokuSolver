import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType } from "../region/RegionType.js";
import { createSelectionConfig } from "./board_selectionConfig.js";
import { Region } from "../region/Region.js"

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
        if (target === RegionType.ORIENTED_ROWCOL) {
            return this.board.hintORCLayer.selected_region;
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
        if (target === RegionType.ORIENTED_ROWCOL && region.type === RegionType.ORIENTED_ROWCOL) {
            this.board.hintORCLayer.selected_region = region;
        }
        if (target === RegionType.DIAGONAL && region.type === RegionType.DIAGONAL) {
            this.board.hintDiagLayer.selected_region = region;
        }
    }

    setSelectionMode(config) {
        // Close any open selector
        if (this.selectionConfig && this.selectionConfig.target !== RegionType.NONE) {
            this.board.emitEvent("ev_selection_ended",
                this.selectionConfig.target === RegionType.CELLS           ? this.board.cellLayer.selected_region :
                    this.selectionConfig.target === RegionType.EDGES           ? this.board.hintLayer.selected_region :
                        this.selectionConfig.target === RegionType.CORNERS         ? this.board.hintLayer.selected_region :
                            this.selectionConfig.target === RegionType.ROWCOL          ? this.board.hintRCLayer.selected_region :
                                this.selectionConfig.target === RegionType.ORIENTED_ROWCOL ? this.board.hintORCLayer.selected_region :
                                    this.selectionConfig.target === RegionType.DIAGONAL        ? this.board.hintDiagLayer.selected_region  : null
            );

            this.board.cellLayer.hide();
            this.board.hintLayer.hide();
            this.board.hintRCLayer.hide();
            this.board.hintORCLayer.hide();
            this.board.hintDiagLayer.hide();
        }

        this.previousConfig = this.selectionConfig ?? this.defaultConfig;
        this.selectionConfig = config;
        this.deselectAll();

        const target = config.target;

        const isHint = target === RegionType.EDGES
            || target === RegionType.CORNERS;

        const isRC    = target === RegionType.ROWCOL;
        const isORC   = target === RegionType.ORIENTED_ROWCOL;
        const isDiag  = target === RegionType.DIAGONAL;

        // Disable all pointer events
        this.board.cellLayer.grid.style.pointerEvents             = "none";
        this.board.hintLayer.hintLayer.style.pointerEvents        = "none";
        this.board.hintRCLayer.rcLayer.style.pointerEvents        = "none";
        this.board.hintORCLayer.layer.style.pointerEvents  = "none";
        this.board.hintDiagLayer.diagLayer.style.pointerEvents    = "none";

        if (isRC)        this.board.hintRCLayer.rcLayer.style.pointerEvents        = "auto";
        else if (isORC)  this.board.hintORCLayer.layer.style.pointerEvents         = "auto";
        else if (isDiag) this.board.hintDiagLayer.diagLayer.style.pointerEvents    = "auto";
        else if (isHint) this.board.hintLayer.hintLayer.style.pointerEvents        = "auto";
        else             this.board.cellLayer.grid.style.pointerEvents             = "auto";

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

        if (isORC) {
            this.board.hintORCLayer.show(config);
            this.board.emitEvent("ev_selection_started", config);
        } else {
            this.board.hintORCLayer.hide();
        }

        if (isDiag) {
            this.board.hintDiagLayer.show(config);
            this.board.emitEvent("ev_selection_started", config);
        } else {
            this.board.hintDiagLayer.hide();
        }
    }

    revertSelection() {
        if (this.previousConfig) {
            this.setSelectionMode(this.previousConfig);
        }
    }

    resetSelectionToDefault() {
        this.setSelectionMode(this.defaultConfig);
    }

    deselectAll() {
        const target = this.selectionConfig?.target;
        if (target === RegionType.CELLS) {
            this.board.cellLayer._clearSelection();
        }
        if (target === RegionType.EDGES || target === RegionType.CORNERS) {
            this.board.hintLayer.clearSelection();
        }
        if (target === RegionType.ROWCOL) {
            this.board.hintRCLayer.clearSelection();
        }
        if (target === RegionType.ORIENTED_ROWCOL) {
            this.board.hintORCLayer.clearSelection();
        }
    }

    shiftSelection(dy, dx) {
        if (this.selectionConfig?.target !== RegionType.CELLS) return;

        const region = this.getSelectedRegion();
        if (!region || region.type !== RegionType.CELLS || region.size() === 0) return;

        const rows = this.board.getGridSize();
        const cols = rows;
        const CellIdxClass = region.itemClass;

        const shiftedItems = region.items
            .map(cell => new CellIdxClass(cell.r + dy, cell.c + dx))
            .filter(cell =>
                cell.r >= 0 && cell.r < rows &&
                cell.c >= 0 && cell.c < cols
            );

        if (shiftedItems.length === 0) return;

        const newRegion = new Region(RegionType.CELLS, shiftedItems);
        this.setSelectedRegion(newRegion);
        this.board.emitEvent("ev_selected_region_changed", newRegion);
    }
}
