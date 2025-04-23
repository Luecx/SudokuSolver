import { SelectionTarget, SelectionMode } from "./board_selectionEnums.js";
import { buildInsetPath } from "./board_insetPath.js";
import { MouseSelector } from "./board_mouseSelector.js";

export class CellLayer {
    constructor(container, gridSize) {
        this.container = container;
        this.gridSize = gridSize;
        this.grid = null;

        this.selected = new Set();
        this.currentTarget = SelectionTarget.NONE;

        this.selector = null;

        this.onItemAdded = null;
        this.onItemRemoved = null;
        this.onSelectionCleared = null;
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
                return cell ? `${cell.dataset.r},${cell.dataset.c}` : null;
            },
            onSelect: (key) => this.select(key),
            onDeselect: (key) => this.deselect(key),
            onClear: () => this.clearSelection(),
            onIsSelected: (key) => this.selected.has(key),
            onStartSelection: () => this.currentTarget === SelectionTarget.CELLS
        });

        this.selector._onlyOneSelected = () => this.selected.size === 1;

        this.grid.addEventListener("mousedown", (e) => this.selector.onMouseDown(e));
        this.grid.addEventListener("mousemove", (e) => this.selector.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.selector.onMouseUp(e));
    }

    show(config) {
        this.currentTarget = config.target ?? SelectionTarget.CELLS;
        this.onItemAdded = config.onItemAdded ?? null;
        this.onItemRemoved = config.onItemRemoved ?? null;
        this.onSelectionCleared = config.onSelectionCleared ?? null;

        this.selector.mode = config.mode;

        this.grid.querySelectorAll(".cell").forEach(cell => {
            cell.classList.add("selectable");
        });
    }

    hide() {
        this.currentTarget = SelectionTarget.NONE;
        this.clearSelection();

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

    select(key) {
        if (!this.selected.has(key)) {
            this.selected.add(key);
            const [r, c] = key.split(",").map(Number);
            this._toggleClass(r, c, true);
            this.onItemAdded?.(key, { r, c });
            this.board.triggerRender();
        }
    }

    deselect(key) {
        if (this.selected.delete(key)) {
            const [r, c] = key.split(",").map(Number);
            this._toggleClass(r, c, false);
            this.onItemRemoved?.(key, { r, c });
            this.board.triggerRender();
        }
    }

    clearSelection() {
        if (this.selected.size > 0) {
            this.selected.forEach((key) => {
                const [r, c] = key.split(",").map(Number);
                this._toggleClass(r, c, false);
            });
            this.selected.clear();
            this.onSelectionCleared?.();
            this.board.triggerRender();
        }
    }

    renderSelection(ctx) {
        const cellSize = this.board.getCellSize();
        const offset = this.board.getPadding();

        const cells = Array.from(this.selected).map(key => {
            const [r, c] = key.split(",").map(Number);
            return { x: r, y: c };
        });

        const insetPx = 3;
        const inset = insetPx / cellSize;
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
