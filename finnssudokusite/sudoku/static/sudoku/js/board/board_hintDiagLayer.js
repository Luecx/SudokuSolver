import { RegionType } from "../region/RegionType.js";
import { Region, RegionClassMap } from "../region/Region.js";
import { MouseSelector } from "../util/mouse_selector.js";

export class HintDiagLayer {
    constructor(container, renderer) {
        this.container = container;
        this.renderer = renderer;
        this.board = null;

        this.gridSize = 9;
        this.diagLayer = null;
        this.selector = null;

        this.selected_region = null;
        this.excluded_region = null;
        this.config = null;
        this.showing = false;
    }

    init(board) {
        this.board = board;

        this.diagLayer = document.createElement("div");
        this.diagLayer.className = "hint-diag-layer layer";
        this.container.appendChild(this.diagLayer);

        this.selector = new MouseSelector({
            getKeyFromEvent: (e) => {
                const label = e.target.closest(".hint-diag-label");
                const key = label?.dataset.key;
                if (!key || !this.config?.target) return null;
                return RegionClassMap[this.config.target].fromString(key);
            },
            onSelect: (idx) => this.select(idx),
            onDeselect: (idx) => this.deselect(idx),
            onClear: () => this.clearSelection(),
            onIsSelected: (idx) => this.selected_region?.has(idx),
            onStartSelection: () => this.config?.target === RegionType.DIAGONAL,
        });

        this.selector._onlyOneSelected = () => this.selected_region?.size() === 1;

        this.diagLayer.addEventListener("mousedown", (e) => this.selector.onMouseDown(e));
        this.diagLayer.addEventListener("mousemove", (e) => this.selector.onMouseMove(e));
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
        console.log(idx);

        if (!this.config || this.config.target !== RegionType.DIAGONAL) return;

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
        if (!this.config || this.config.target !== RegionType.DIAGONAL) return;

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
        if (!this.config || this.config.target !== RegionType.DIAGONAL) return;

        this.selected_region.clear();
        if (this.showing) {
            this.board.emitEvent("ev_selected_region_changed", this.selected_region);
            this.board.emitEvent("ev_selected_region_cleared", this.selected_region);
        }
        this.update();
    }

    update() {
        if (!this.diagLayer) return;
        this.diagLayer.innerHTML = "";

        if (!this.showing || !this.config || this.config.target !== RegionType.DIAGONAL) return;

        const cellSize = this.renderer.getCellSize();
        const arrowSize = cellSize * 0.2;

        const boardSize = this.gridSize;

        // Main diagonals → left and right sides
        for (let d = -boardSize + 1; d <= boardSize - 1; ++d) {
            const diagIdx = RegionClassMap[RegionType.DIAGONAL].fromString(`main:${d}`);
            if (this.excluded_region.has(diagIdx)) continue;

            const labelSize = arrowSize * 2;

            // left side
            if (d <= 0) {
                const base  = this.renderer.getCellTopLeft(-d, 0)
                const label = this._createLabel(true, d);

                base.x -= 4;
                base.y -= 4;

                label.style.fontSize = `${labelSize * 1}px`;
                label.style.width = `${labelSize}px`;
                label.style.height = `${labelSize}px`;
                label.style.left = `${base.x}px`;  // position the bottom-right corner
                label.style.top = `${base.y}px`;

                this.diagLayer.appendChild(label);
            } else {
                const base  = this.renderer.getCellTopLeft(d, this.gridSize);
                const label = this._createLabel(true, boardSize - d);
                base.x += labelSize;
                base.y += labelSize;

                base.x += 4;
                base.y += 4;

                label.style.fontSize = `${labelSize * 1}px`;
                label.style.width = `${labelSize}px`;
                label.style.height = `${labelSize}px`;
                label.style.left = `${base.x}px`;  // position the bottom-right corner
                label.style.top = `${base.y}px`;
                this.diagLayer.appendChild(label);
            }

            // top and bottom
            if (d < 0) {
                const base  = this.renderer.getCellTopLeft(0, -d)
                const label = this._createLabel(false, -boardSize -d);
                base.x += labelSize;

                base.x += 4;
                base.y -= 4;

                label.style.fontSize = `${labelSize * 1}px`;
                label.style.width = `${labelSize}px`;
                label.style.height = `${labelSize}px`;
                label.style.left = `${base.x}px`;  // position the bottom-right corner
                label.style.top = `${base.y}px`;

                this.diagLayer.appendChild(label);
            } else {
                const base  = this.renderer.getCellTopLeft(this.gridSize, d);
                const label = this._createLabel(false, d);
                base.y += labelSize;

                base.x -= 4;
                base.y += 4;

                label.style.fontSize = `${labelSize * 1}px`;
                label.style.width = `${labelSize}px`;
                label.style.height = `${labelSize}px`;
                label.style.left = `${base.x}px`;  // position the bottom-right corner
                label.style.top = `${base.y}px`;
                this.diagLayer.appendChild(label);
            }

        }

    }

    _createLabel(isMain, num) {
        const key = (isMain ? "main" : "anti") + ":" + num;
        const label = document.createElement("div");
        label.className = "hint-diag-label";
        label.dataset.key = key;

        const idx = RegionClassMap[RegionType.DIAGONAL].fromString(key);

        // Only add the icon if it's not selected
        if (!this.selected_region?.has(idx)) {
            let icon;
            if (isMain) {
                icon = num <= 0 ? "bi-arrow-down-right" : "bi-arrow-up-left";
            } else {
                icon = num < 0 ? "bi-arrow-down-left" : "bi-arrow-up-right";
            }
            label.innerHTML = `<i class="bi ${icon}"></i>`;
        } else {
            label.innerHTML = ""; // clickable, but no arrow
        }

        return label;
    }



}
