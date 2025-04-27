import { RegionType } from "../region/RegionType.js";
import { Region, RegionClassMap } from "../region/Region.js";
import { MouseSelector } from "../util/mouse_selector.js";
import { SelectionMode } from "./board_selectionEnums.js";

export class HintDotLayer {
    constructor(container, renderer) {
        this.container = container;
        this.renderer = renderer;
        this.board = null;

        this.gridSize = 9;
        this.showing = false;
        this.config = null;

        this.hintLayer = null;
        this.selector = null;

        this.selected_region = null;
        this.excluded_region = null;
    }

    init(board) {
        this.board = board;

        this.hintLayer = document.createElement("div");
        this.hintLayer.className = "hint-layer";
        this.container.appendChild(this.hintLayer);

        this.selector = new MouseSelector({
            getKeyFromEvent: (e) => {
                const dot = e.target.closest(".hint-dot");
                const key = dot?.dataset.key;
                if (!key || !this.config?.target) return null;
                return RegionClassMap[this.config.target].fromString(key);
            },
            onSelect: (idx) => this.select(idx),
            onDeselect: (idx) => this.deselect(idx),
            onClear: () => this.clearSelection(),
            onIsSelected: (idx) => this.selected_region?.has(idx),
            onStartSelection: () => this.config?.target !== RegionType.NONE,
        });

        this.selector._onlyOneSelected = () => this.selected_region?.size() === 1;

        this.hintLayer.addEventListener("mousedown", (e) => this.selector.onMouseDown(e));
        this.hintLayer.addEventListener("mousemove", (e) => this.selector.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.selector.onMouseUp(e));
    }

    show(config) {
        this.config = config;
        this.showing = true;

        const type = config.target;
        this.selected_region = new Region(type);
        this.excluded_region = config.excluded_region?? new Region(type);
        this.selector.selectionMode = config.mode ?? SelectionMode.MULTIPLE;

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

        // force rerender
        this.board.triggerRender();
    }

    select(idx) {
        if (!this.config || this.config.target === RegionType.NONE) return;

        if (this.config.mode === SelectionMode.SINGLE) {
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
        if (!this.config || this.config.target === RegionType.NONE) return;

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
        if (!this.config || this.config.target === RegionType.NONE) return;

        const cleared = this.selected_region.values();
        this.selected_region.clear();
        if (this.showing) {
            this.board.emitEvent("ev_selected_region_changed", this.selected_region);
            this.board.emitEvent("ev_selected_region_cleared", this.selected_region);
        }
        this.update();
    }

    update() {
        if (!this.hintLayer) return;

        this.hintLayer.innerHTML = "";

        if (!this.showing || !this.config || this.config.target === RegionType.NONE) return;

        const target = this.config.target;
        if (target === RegionType.EDGES) {
            this._renderEdges();
        } else if (target === RegionType.CORNERS) {
            this._renderCorners();
        }
    }

    _renderEdges() {
        const size = this.gridSize;
        const cellSize = this.renderer.getCellSize();

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                for (const [nr, nc] of [[r + 1, c], [r, c + 1]]) {
                    if (nr >= size || nc >= size) continue;

                    const idx = new RegionClassMap[RegionType.EDGES](r, c, nr, nc);
                    if (this.excluded_region.has(idx)) continue;

                    const a = this.renderer.getCellTopLeft(r, c);
                    const b = this.renderer.getCellTopLeft(nr, nc);
                    const cx = (a.x + b.x + cellSize) / 2;
                    const cy = (a.y + b.y + cellSize) / 2;

                    const dot = this._createDot(cx, cy, idx);
                    this.hintLayer.appendChild(dot);
                }
            }
        }
    }

    _renderCorners() {
        const size = this.gridSize;
        const cellSize = this.renderer.getCellSize();

        for (let r = 0; r <= size; r++) {
            for (let c = 0; c <= size; c++) {
                const idx = new RegionClassMap[RegionType.CORNERS](r, c);
                if (this.excluded_region.has(idx)) continue;

                const { x, y } = this.renderer.getCellTopLeft(r - 1, c - 1);
                const cx = x + cellSize;
                const cy = y + cellSize;

                const dot = this._createDot(cx, cy, idx);
                this.hintLayer.appendChild(dot);
            }
        }
    }

    _createDot(cx, cy, idx) {
        const dot = document.createElement("div");
        dot.className = "hint-dot";
        dot.dataset.key = idx.toString();
        dot.style.left = `${cx}px`;
        dot.style.top = `${cy}px`;
        if (this.selected_region.has(idx)) {
            dot.classList.add("selected");
        }
        return dot;
    }
}
