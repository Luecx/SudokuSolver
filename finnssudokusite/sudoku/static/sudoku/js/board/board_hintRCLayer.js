import { RegionType } from "../region/RegionType.js";
import {Region, RegionClassMap} from "../region/Region.js";
import { MouseSelector } from "../util/mouse_selector.js";

export class HintRCLayer {
    constructor(container, renderer) {
        this.container = container;
        this.renderer = renderer;
        this.board = null;

        this.gridSize = 9;
        this.rcLayer = null;
        this.selector = null;

        this.selected_region = null;
        this.excluded_region = null;
        this.config = null;
        this.showing = false;
    }

    init(board) {
        this.board = board;

        this.rcLayer = document.createElement("div");
        this.rcLayer.className = "rc-layer";
        this.container.appendChild(this.rcLayer);

        this.selector = new MouseSelector({
            getKeyFromEvent: (e) => {
                const label = e.target.closest(".hint-rc-label");
                const key = label?.dataset.key;
                if (!key || !this.config?.target) return null;
                return RegionClassMap[this.config.target].fromString(key);
            },
            onSelect: (idx) => this.select(idx),
            onDeselect: (idx) => this.deselect(idx),
            onClear: () => this.clearSelection(),
            onIsSelected: (idx) => this.selected_region?.has(idx),
            onStartSelection: () => this.config?.target === RegionType.ROWCOL,
        });

        this.selector._onlyOneSelected = () => this.selected_region?.size() === 1;

        this.rcLayer.addEventListener("mousedown", (e) => this.selector.onMouseDown(e));
        this.rcLayer.addEventListener("mousemove", (e) => this.selector.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.selector.onMouseUp(e));
    }

    show(config) {
        this.config = config;
        this.showing = true;

        console.log("showing hint rc layer");
        console.log("type: " + config.target);

        const type = config.target;
        this.selected_region        = new Region(type);
        this.excluded_region        = config.excluded_region?? new Region(type);
        this.selector.selectionMode = config.mode ?? "multiple";

        console.log(RegionClassMap[type]);

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
        if (!this.config || this.config.target !== RegionType.ROWCOL) return;

        if (this.config.mode === "single") {
            this.clearSelection();
        }

        console.log(this.selected_region);
        console.log("class:" + this.selected_region.constructor.name);

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
        if (!this.config || this.config.target !== RegionType.ROWCOL) return;

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
        if (!this.config || this.config.target !== RegionType.ROWCOL) return;

        const cleared = this.selected_region.values();
        this.selected_region.clear();
        if (this.showing) {
            this.board.emitEvent("ev_selected_region_changed", this.selected_region);
            this.board.emitEvent("ev_selected_region_cleared", this.selected_region);
        }
        this.update();
    }

    update() {
        if (!this.rcLayer) return;
        this.rcLayer.innerHTML = "";

        if (!this.showing || !this.config || this.config.target !== RegionType.ROWCOL) return;

        const cellSize = this.renderer.getCellSize();
        const padding  = this.renderer.getPadding();
        const topLeft  = this.renderer.getCellTopLeft(0, 0);

        const buttonThickness = cellSize * 0.6; // 60% of cell size

        // Column buttons (top)
        for (let c = 0; c < this.gridSize; c++) {
            const idx = new RegionClassMap[RegionType.ROWCOL](NaN, c);
            if (this.excluded_region.has(idx)) continue;

            const a = this.renderer.getCellTopLeft(0, c);

            const label = this._createLabel(false, idx); // false = column
            label.style.left = `${a.x + cellSize / 2}px`;
            label.style.top  = `${topLeft.y - buttonThickness / 2}px`; // slightly above
            label.style.width  = `${cellSize}px`;
            label.style.height = `${buttonThickness}px`;

            this.rcLayer.appendChild(label);
        }

        // Row buttons (left)
        for (let r = 0; r < this.gridSize; r++) {
            const idx = new RegionClassMap[RegionType.ROWCOL](r, NaN);
            if (this.excluded_region.has(idx)) continue;

            const a = this.renderer.getCellTopLeft(r, 0);

            const label = this._createLabel(true, idx); // true = row
            label.style.left = `${topLeft.x - buttonThickness / 2}px`; // slightly left
            label.style.top  = `${a.y + cellSize / 2}px`;
            label.style.width  = `${buttonThickness}px`;
            label.style.height = `${cellSize}px`;

            this.rcLayer.appendChild(label);
        }
    }



    _createLabel(isRow, idx) {
        const label = document.createElement("div");
        label.className = "hint-rc-label";
        label.dataset.key = idx.toString();

        label.innerText = isRow ? "→" : "↓"; // ← Arrows instead of numbers

        if (this.selected_region?.has(idx)) {
            label.classList.add("selected");
        }

        return label;
    }

}
