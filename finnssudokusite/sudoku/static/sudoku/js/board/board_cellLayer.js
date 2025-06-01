import { MouseSelector } from "../util/mouse_selector.js";
import { buildInsetPath } from "../util/inset_path.js";
import { RegionType } from "../region/RegionType.js";
import { CellIdx } from "../region/CellIdx.js";
import { Region } from "../region/Region.js";
import { SelectionMode } from "./board_selectionEnums.js"; // assumed MULTIPLE/SINGLE enum

export class CellLayer {
    constructor(container, gridSize) {
        this.container = container;
        this.gridSize = gridSize;
        this.grid = null;
        this.board = null;

        this.selected_region = new Region(RegionType.CELLS);
        this.selector = null;
        this.config = null;
        this.showing = false;
    }

    init(board) {
        this.board = board;

        this.grid = document.createElement("div");
        this.grid.className = "layer bg-layer";
        Object.assign(this.grid.style, {
            position: "absolute",
            pointerEvents: "auto",
        });
        this.container.appendChild(this.grid);


        this.selector = new MouseSelector({
            getKeyFromEvent: (e) => {
                const cell = e.target.closest(".cell");
                return cell ? new CellIdx(Number(cell.dataset.r), Number(cell.dataset.c)) : null;
            },
            onSelect        : (cellIdx) => this._select(cellIdx),
            onDeselect      : (cellIdx) => this._deselect(cellIdx),
            onClear         : () => this._clearSelection(),
            onIsSelected    : (cellIdx) => this.selected_region.has(cellIdx),
            onStartSelection: () => this.config?.type === RegionType.CELLS,
        });

        this.selector._onlyOneSelected = () => this.selected_region.size() === 1;

        this.grid.addEventListener("pointerdown", e => {
            if (e.pointerType === "touch" || e.pointerType === "mouse") {
                e.preventDefault();
                this.selector.onMouseDown(e);
            }
        });

        this.grid.addEventListener("pointermove", e => {
            if (e.pointerType === "touch" || e.pointerType === "mouse") {
                e.preventDefault();
                this.selector.onMouseMove(e);
            }
        });

        window.addEventListener("pointerup", e => {
            if (e.pointerType === "touch" || e.pointerType === "mouse") {
                e.preventDefault();
                this.selector.onMouseUp(e);
            }
        });

        // any changes shall cause a redraw
        this.board.addRenderCall("render_selection", this._renderSelection.bind(this), 1000);
        this.board.onEvent("ev_selected_region_changed", () => {board.triggerRender()});
    }

    show(config) {
        this.config = config;
        this.selector.mode = config.mode ?? SelectionMode.MULTIPLE;
        this.showing = true;

        this.grid.querySelectorAll(".cell").forEach(cell => {
            cell.classList.add("selectable");
        });

        if (config.initialSelected instanceof Region) {
            config.initialSelected.values().forEach(cellIdx => {
                this._select(cellIdx);
            });
        }
    }

    hide() {
        this.showing = false;
        this._clearSelection();
        this.config = null;

        this.grid.querySelectorAll(".cell").forEach(cell => {
            cell.classList.remove("selectable", "selected");
        });
        // force rerender
        this.board.triggerRender();
    }

    _generate(cellSize, usedSize, gridOffset) {
        this.grid.innerHTML = "";
        Object.assign(this.grid.style, {
            width: `${usedSize}px`,
            height: `${usedSize}px`,
            top: `${gridOffset}px`,
            left: `${gridOffset}px`,
        });

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement("div");
                cell.className = "cell selectable";
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                this.grid.appendChild(cell);
            }
        }
    }

    _select(cellIdx) {
        if (!this.config || this.config.target !== RegionType.CELLS) return;
        if (!this.selected_region.has(cellIdx)) {
            this.selected_region.add(cellIdx);
            this._toggleClass(cellIdx.r, cellIdx.c, true);

            if (this.showing) {
                this.board.emitEvent("ev_selected_region_changed", this.selected_region);
                this.board.emitEvent("ev_selected_region_el_added", [this.selected_region, cellIdx]);
            }
        }
    }

    _deselect(cellIdx) {
        if (!this.config || this.config.target !== RegionType.CELLS) return;
        if (this.selected_region.has(cellIdx)) {
            this.selected_region.remove(cellIdx);
            this._toggleClass(cellIdx.r, cellIdx.c, false);

            if (this.showing) {
                this.board.emitEvent("ev_selected_region_changed", this.selected_region);
                this.board.emitEvent("ev_selected_region_el_removed", [this.selected_region, cellIdx]);
            }
        }
    }

    _clearSelection() {
        if (!this.config || this.config.target !== RegionType.CELLS) return;

        const cleared = this.selected_region.values();
        for (const cellIdx of cleared) {
            this._toggleClass(cellIdx.r, cellIdx.c, false);
        }

        this.selected_region.clear();

        if (this.showing) {
            this.board.emitEvent("ev_selected_region_changed", this.selected_region);
            this.board.emitEvent("ev_selected_region_cleared", this.selected_region);
        }
    }

    _renderSelection(ctx) {
        if (!this.config || this.config.target !== RegionType.CELLS) return;

        const cellSize = this.board.getCellSizeCTX();
        const insetPx  = cellSize / 20;
        const inset    = insetPx / cellSize;

        const cells = this.selected_region.values().map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, inset);

        ctx.save();
        ctx.strokeStyle = "rgba(0, 120, 255, 0.6)";
        ctx.lineWidth = insetPx * 2;
        ctx.lineJoin = "round";

        for (const loop of loops) {
            ctx.beginPath();
            loop.forEach((pt, i) => {
                const topLeft = this.board.getCellTopLeftCTX(pt.x, pt.y);
                const x = topLeft.x;
                const y = topLeft.y;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }


    _toggleClass(r, c, on) {
        const cell = this.grid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) cell.classList.toggle("selected", on);
    }
}