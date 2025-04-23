import { SelectionTarget, SelectionMode } from "./board_selectionEnums.js";
import { MouseSelector } from "./board_mouseSelector.js";

export class HintDotLayer {
    constructor(container, renderer) {
        this.container = container;
        this.renderer = renderer;

        this.hintLayer = null;
        this.selectedItems = new Set();
        this.excludedItems = new Set();

        this.gridSize = 9;
        this.currentTarget = SelectionTarget.NONE;
        this.selectionMode = SelectionMode.MULTIPLE;

        this.selector = null;

        this.onItemAdded = null;
        this.onItemRemoved = null;
        this.onSelectionCleared = null;
    }

    init(board) {
        this.board = board;

        this.hintLayer = document.createElement("div");
        this.hintLayer.className = "hint-layer";
        this.container.appendChild(this.hintLayer);

        this.selector = new MouseSelector({
            getKeyFromEvent: (e) => {
                const dot = e.target.closest(".hint-dot");
                return dot?.dataset?.key ?? null;
            },
            onSelect: (key) => this.select(key),
            onDeselect: (key) => this.deselect(key),
            onClear: () => this.clearSelection(),
            onIsSelected: (key) => this.selectedItems.has(key),
            onStartSelection: () => this.currentTarget !== SelectionTarget.NONE
        });

        this.selector._onlyOneSelected = () => this.selectedItems.size === 1;

        this.hintLayer.addEventListener("mousedown", (e) => this.selector.onMouseDown(e));
        this.hintLayer.addEventListener("mousemove", (e) => this.selector.onMouseMove(e));
        window.addEventListener("mouseup", (e) => this.selector.onMouseUp(e));
    }

    show(config) {
        const {
            target = SelectionTarget.EDGES,
            exclude = [],
            onItemAdded = null,
            onItemRemoved = null,
            onSelectionCleared = null,
            mode = SelectionMode.MULTIPLE
        } = config;

        this.currentTarget = target;
        this.selectionMode = mode;
        this.onItemAdded = onItemAdded;
        this.onItemRemoved = onItemRemoved;
        this.onSelectionCleared = onSelectionCleared;

        this.selector.selectionMode = mode;

        this.excludedItems = new Set(exclude.map(this._buildKey.bind(this)));
        this.update();
    }

    hide() {
        this.currentTarget = SelectionTarget.NONE;
        this.excludedItems.clear();
        this.clearSelection();
        this.update();
    }

    select(key) {
        if (this.selectionMode === SelectionMode.SINGLE) {
            this.clearSelection();
        }
        if (!this.selectedItems.has(key)) {
            this.selectedItems.add(key);
            this.onItemAdded?.(key, this._parseKey(key));
            this.update();
        }
    }

    deselect(key) {
        if (this.selectedItems.delete(key)) {
            this.onItemRemoved?.(key, this._parseKey(key));
            this.update();
        }
    }

    clearSelection() {
        if (this.selectedItems.size > 0) {
            this.selectedItems.clear();
            this.onSelectionCleared?.();
            this.update();
        }
    }

    update() {
        console.log(this.currentTarget);
        if (!this.hintLayer || this.currentTarget === SelectionTarget.NONE) return;
        this.hintLayer.innerHTML = "";

        if (this.currentTarget === SelectionTarget.EDGES) {
            this._renderEdges();
        } else if (this.currentTarget === SelectionTarget.CORNERS) {
            this._renderCorners();
        }
    }

    _renderEdges() {
        const size = this.gridSize;
        const cellSize = this.renderer.getCellSize();

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const neighbors = [[r + 1, c], [r, c + 1]];
                for (const [nr, nc] of neighbors) {
                    if (nr >= size || nc >= size) continue;

                    const key = this._buildKey({ r1: r, c1: c, r2: nr, c2: nc });
                    if (this.excludedItems.has(key)) continue;

                    const a = this.renderer.getCellTopLeft(r, c);
                    const b = this.renderer.getCellTopLeft(nr, nc);
                    const cx = (a.x + b.x + cellSize) / 2;
                    const cy = (a.y + b.y + cellSize) / 2;

                    const dot = this._createDot(cx, cy, key);

                    console.log(dot);
                    console.log(this.hintLayer);

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
                const key = this._buildKey({ r, c });
                if (this.excludedItems.has(key)) continue;

                const { x, y } = this.renderer.getCellTopLeft(r - 1, c - 1);
                const cx = x + cellSize;
                const cy = y + cellSize;

                const dot = this._createDot(cx, cy, key);
                this.hintLayer.appendChild(dot);
            }
        }
    }

    _createDot(cx, cy, key) {
        const dot = document.createElement("div");
        dot.className = "hint-dot";
        dot.dataset.key = key;
        dot.style.left = `${cx}px`;
        dot.style.top = `${cy}px`;
        if (this.selectedItems.has(key)) {
            dot.classList.add("selected");
        }
        return dot;
    }

    _buildKey(obj) {
        if (this.currentTarget === SelectionTarget.EDGES) {
            return `${obj.r1},${obj.c1}-${obj.r2},${obj.c2}`;
        } else if (this.currentTarget === SelectionTarget.CORNERS) {
            return `${obj.r},${obj.c}`;
        }
        return "";
    }

    _parseKey(key) {
        if (this.currentTarget === SelectionTarget.EDGES) {
            const [a, b] = key.split("-");
            const [r1, c1] = a.split(",").map(Number);
            const [r2, c2] = b.split(",").map(Number);
            return { r1, c1, r2, c2 };
        } else if (this.currentTarget === SelectionTarget.CORNERS) {
            const [r, c] = key.split(",").map(Number);
            return { r, c };
        }
        return {};
    }
}
