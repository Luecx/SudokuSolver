import { MouseSelector } from "./board_mouseSelector.js";
import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType}     from "./region/RegionType.js";
import { CellIdx       } from "./region/CellIdx.js";
import { EdgeIdx       } from "./region/EdgeIdx.js";
import { CornerIdx     } from "./region/CornerIdx.js";
import { Region, RegionClassMap } from "./region/Region.js";

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
        this.grid.className = "cell-layer";
        Object.assign(this.grid.style, {
            position: "absolute",
            pointerEvents: "auto",
        });
        this.container.appendChild(this.grid);
        this.board.addRenderCall("render_selection", this.renderSelection.bind(this));

        this.selector = new MouseSelector({
            getKeyFromEvent: (e) => {
                const cell = e.target.closest(".cell");
                return cell ? new CellIdx(Number(cell.dataset.r), Number(cell.dataset.c)) : null;
            },
            onSelect: (cellIdx) => this.select(cellIdx),
            onDeselect: (cellIdx) => this.deselect(cellIdx),
            onClear: () => this.clearSelection(),
            onIsSelected: (cellIdx) => this.selected_region.has(cellIdx),
            onStartSelection: () => this.config?.type === RegionType.CELLS,
        });

        this.selector._onlyOneSelected = () => this.selected_region.size() === 1;

        this.grid.addEventListener("mousedown", (e) => this.selector.onMouseDown(e));
        this.grid.addEventListener("mousemove", (e) => this.selector.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.selector.onMouseUp(e));
    }

    show(config) {
        this.config = config;
        this.selector.mode = config.mode ?? SelectionMode.MULTIPLE;
        this.showing = true;

        this.grid.querySelectorAll(".cell").forEach(cell => {
            cell.classList.add("selectable");
        });
    }

    hide() {
        this.clearSelection();
        this.config = null;
        this.showing = false;

        this.grid.querySelectorAll(".cell").forEach(cell => {
            cell.classList.remove("selectable", "selected");
        });
    }

    generate(cellSize, usedSize, gridOffset) {
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

    select(cellIdx) {
        if (!this.config || this.config.type !== RegionType.CELLS) return;

        if (!this.selected_region.has(cellIdx)) {
            this.selected_region.add(cellIdx);
            this._toggleClass(cellIdx.r, cellIdx.c, true);
            if (this.showing) {
                this.config.onItemsAdded?.([cellIdx]);
                this.config.onItemsChanged?.(this.selected_region.values());
            }
            this.board.triggerRender();
        }
    }

    deselect(cellIdx) {
        if (!this.config || this.config.type !== RegionType.CELLS) return;

        if (this.selected_region.has(cellIdx)) {
            this.selected_region.remove(cellIdx);
            this._toggleClass(cellIdx.r, cellIdx.c, false);
            if (this.showing) {
                this.config.onItemsRemoved?.([cellIdx]);
                this.config.onItemsChanged?.(this.selected_region.values());
            }
            this.board.triggerRender();
        }
    }

    clearSelection() {
        if (!this.config || this.config.type !== RegionType.CELLS) return;

        if (this.selected_region.size() > 0) {
            const cleared = this.selected_region.values();
            for (const cellIdx of cleared) {
                this._toggleClass(cellIdx.r, cellIdx.c, false);
            }
            this.selected_region.clear();
            if (this.showing) {
                this.config.onItemsCleared?.();
                this.config.onItemsRemoved?.(cleared);
                this.config.onItemsChanged?.([]);
            }
            this.board.triggerRender();
        }
    }

    renderSelection(ctx) {
        if (!this.config || this.config.type !== RegionType.CELLS) return;

        const cellSize = this.board.getCellSize();
        const offset = this.board.getPadding();
        const insetPx = 3;
        const inset = insetPx / cellSize;

        const cells = this.selected_region.values().map(({ r, c }) => ({ x: r, y: c }));
        const loops = buildInsetPath(cells, inset);

        ctx.save();
        ctx.strokeStyle = "rgba(0, 120, 255, 0.6)";
        ctx.lineWidth = insetPx * 2;
        ctx.lineJoin = "round";

        for (const loop of loops) {
            ctx.beginPath();
            loop.forEach((pt, i) => {
                const x = offset + pt.x * cellSize;
                const y = offset + pt.y * cellSize;
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