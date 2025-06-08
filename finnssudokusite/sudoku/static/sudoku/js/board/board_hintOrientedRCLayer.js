import { RegionType } from "../region/RegionType.js";
import { Region } from "../region/Region.js";
import { MouseSelector } from "../util/mouse_selector.js";
import { OrientedRCIdx } from "../region/OrientedRCIdx.js";

export class HintOrientedRCLayer {
    constructor(container, renderer) {
        this.container = container;
        this.renderer = renderer;
        this.board = null;

        this.gridSize = 9;
        this.layer = null;
        this.selector = null;

        this.selected_region = null;
        this.excluded_region = null;
        this.config = null;
        this.showing = false;
    }

    init(board) {
        this.board = board;

        this.layer = document.createElement("div");
        this.layer.className = "hint-oriented-rc-layer layer";
        this.container.appendChild(this.layer);

        this.selector = new MouseSelector({
            getKeyFromEvent: (e) => {
                const label = e.target.closest(".hint-rc-label");
                const key = label?.dataset.key;
                if (!key || !this.config?.target) return null;
                return OrientedRCIdx.fromString(key);
            },
            onSelect: (idx) => this.select(idx),
            onDeselect: (idx) => this.deselect(idx),
            onClear: () => this.clearSelection(),
            onIsSelected: (idx) => this.selected_region?.has(idx),
            onStartSelection: () => this.config?.target === RegionType.ORIENTED_ROWCOL,
        });
        this.selector._onlyOneSelected = () => this.selected_region?.size() === 1;

        this.layer.addEventListener("mousedown", (e) => this.selector.onMouseDown(e));
        this.layer.addEventListener("mousemove", (e) => this.selector.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.selector.onMouseUp(e));
    }

    show(config) {
        this.config = config;
        this.showing = true;

        const type = config.target;
        this.selected_region = new Region(type);
        this.excluded_region = config.excluded_region ?? new Region(type);
        this.selector.selectionMode = config.mode ?? "multiple";

        if (config.initialSelected && Array.isArray(config.initialSelected)) {
            for (const idx of config.initialSelected) {
                this.select(idx);
            }
        }

        this.update();
    }

    hide() {
        this.config = null;
        this.showing = false;
        this.selected_region = null;
        this.excluded_region = null;

        this.update();
        this.board.triggerRender();
    }

    select(idx) {
        if (!this.config || this.config.target !== RegionType.ORIENTED_ROWCOL) return;

        if (this.config.mode === "single") {
            this.clearSelection();
        }

        if (!this.selected_region.has(idx)) {
            this.selected_region.add(idx);
            if (this.showing) {
                this.board.emitEvent("ev_selected_region_changed", this.selected_region);
                this.board.emitEvent("ev_selected_region_el_added", [this.selected_region, idx]);
            }
            this.update();
        }
    }

    deselect(idx) {
        if (!this.config || this.config.target !== RegionType.ORIENTED_ROWCOL) return;

        if (this.selected_region.has(idx)) {
            this.selected_region.remove(idx);
            if (this.showing) {
                this.board.emitEvent("ev_selected_region_changed", this.selected_region);
                this.board.emitEvent("ev_selected_region_el_removed", [this.selected_region, idx]);
            }
            this.update();
        }
    }

    clearSelection() {
        if (!this.config || this.config.target !== RegionType.ORIENTED_ROWCOL) return;

        this.selected_region.clear();
        if (this.showing) {
            this.board.emitEvent("ev_selected_region_changed", this.selected_region);
            this.board.emitEvent("ev_selected_region_cleared", this.selected_region);
        }
        this.update();
    }

    update() {
        if (!this.layer) return;
        this.layer.innerHTML = "";

        if (   !this.showing
            || !this.config
            || this.config.target !== RegionType.ORIENTED_ROWCOL) return;

        const cellSize        = this.renderer.getCellSize();
        const buttonThickness = cellSize * 0.6;

        // Columns (top = ↓, bottom = ↑)
        for (let c = 0; c < this.gridSize; c++) {
            const topPos = this.renderer.getCellTopLeft(0, c);
            const botPos = this.renderer.getCellTopLeft(this.board.getGridSize(), c);

            // ↓
            const down = new OrientedRCIdx(null, c, false);
            if (!this.excluded_region.has(down)) {
                const label = this._createLabel(false, down);
                label.style.left   = `${topPos.x + cellSize / 2}px`;
                label.style.top    = `${topPos.y - buttonThickness / 2}px`;
                label.style.width  = `${cellSize}px`;
                label.style.height = `${buttonThickness}px`;
                this.layer.appendChild(label);
            }

            // ↑
            const up = new OrientedRCIdx(null, c, true);
            if (!this.excluded_region.has(up)) {
                const label = this._createLabel(false, up);
                label.style.left   = `${botPos.x + cellSize / 2}px`;
                label.style.top    = `${botPos.y + buttonThickness / 2}px`; // ✅ fixed
                label.style.width  = `${cellSize}px`;
                label.style.height = `${buttonThickness}px`;
                this.layer.appendChild(label);
            }
        }

        // Rows (left = →, right = ←)
        for (let r = 0; r < this.gridSize; r++) {
            const leftPos  = this.renderer.getCellTopLeft(r, 0);
            const rightPos = this.renderer.getCellTopLeft(r, this.board.getGridSize());

            // →
            const right = new OrientedRCIdx(r, null, false);
            if (!this.excluded_region.has(right)) {
                const label = this._createLabel(true, right);
                label.style.left   = `${leftPos.x - buttonThickness / 2}px`;
                label.style.top    = `${leftPos.y + cellSize / 2}px`;
                label.style.width  = `${buttonThickness}px`;
                label.style.height = `${cellSize}px`;
                this.layer.appendChild(label);
            }

            // ←
            const left = new OrientedRCIdx(r, null, true);
            if (!this.excluded_region.has(left)) {
                const label = this._createLabel(true, left);
                label.style.left   = `${rightPos.x + buttonThickness / 2}px`;
                label.style.top    = `${rightPos.y + cellSize / 2}px`;
                label.style.width  = `${buttonThickness}px`;
                label.style.height = `${cellSize}px`;
                this.layer.appendChild(label);
            }
        }
    }

    _createLabel(isRow, idx) {
        const label = document.createElement("div");
        label.className = "hint-rc-label";
        label.dataset.key = idx.toString();

        const icon = document.createElement("i");
        icon.classList.add("fa-solid",
            isRow
                ? (idx.reversed ? "fa-arrow-left" : "fa-arrow-right")
                : (idx.reversed ? "fa-arrow-up" : "fa-arrow-down")
        );
        label.appendChild(icon);

        if (this.selected_region?.has(idx)) {
            label.classList.add("selected");
        }

        return label;
    }
}
