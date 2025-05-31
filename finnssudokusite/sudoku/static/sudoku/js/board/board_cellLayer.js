import { MouseSelector } from "../util/mouse_selector.js";
import { buildInsetPath } from "../util/inset_path.js";
import { RegionType } from "../region/RegionType.js";
import { CellIdx } from "../region/CellIdx.js";
import { Region } from "../region/Region.js";
import { SelectionMode } from "./board_selectionEnums.js"; // assumed MULTIPLE/SINGLE enum

class Highlight {
    constructor() {
        this.enabled = true;
        this.highlighted_region = new Region(RegionType.CELLS);
    }

    add(cellIdx) {
        this.highlighted_region.add(cellIdx);
    }

    enable(val) {
        this.enabled = val;
        if (!val)
            this.highlighted_region.clear();
    }

    isEnabled() { return this.enabled; }
    getRegion() { return this.highlighted_region; }
    clear() { this.highlighted_region.clear(); }
}

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

        this.highlights = {
            row: new Highlight(),
            column: new Highlight(),
            block: new Highlight(),
            number: new Highlight(),
            candidates: new Highlight() // regions not used, only dom
        };
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
        this.board.addRenderCall("render_highlight", this._renderHighlight.bind(this), 1000);
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

            this._updateHighlights();
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

            this._updateHighlights();
        }
    }

    _clearSelection() {
        if (!this.config || this.config.target !== RegionType.CELLS) return;

        const cleared = this.selected_region.values();
        for (const cellIdx of cleared) {
            this._toggleClass(cellIdx.r, cellIdx.c, false);
        }

        this.selected_region.clear();
        this._clearAllHighlights();

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

    // highlighting related

    _renderHighlight(ctx) {
        ctx.save();
        this._renderBaseHighlights(ctx);        
        this._renderNumberHighlight(ctx);
        ctx.restore();
    }

    _renderBaseHighlights(ctx) {
        const combinedRegion = new Region(RegionType.CELLS);
        
        // Combine all enabled base highlight regions
        ['row', 'column', 'block'].forEach(type => {
            if (this.highlights[type].isEnabled()) {
                this.highlights[type].getRegion().values().forEach(cellIdx => {
                    combinedRegion.add(cellIdx);
                });
            }
        });
        
        if (combinedRegion.size() > 0) {
            this._renderRegion(ctx, combinedRegion, "rgba(10, 60, 110, 0.1)");
        }
    }

    _renderNumberHighlight(ctx) {
        if (this.highlights.number.isEnabled() && this.highlights.number.getRegion().size() > 0) {
            this._renderRegion(ctx, this.highlights.number.getRegion(), "rgba(10, 60, 110, 0.15)");
        }
    }

    _renderRegion(ctx, region, fillStyle) {
        const cells = region.values().map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, 0);

        ctx.fillStyle = fillStyle;

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
            ctx.fill();
        }
    }

    _updateHighlights() {
        this._clearAllHighlights();
        
        if (this.selected_region.size() === 1) {
            const cellIdx = this.selected_region.values()[0];
            this._updateRegionHighlights(cellIdx);
        }
        
        this._updateNumberHighlight();
    }

    _updateRegionHighlights(cellIdx) {
        // Row highlight
        if (this.highlights.row.isEnabled()) {
            for (let c = 0; c < this.gridSize; c++) {
                this.highlights.row.add(new CellIdx(cellIdx.r, c));
            }
        }

        // Column highlight
        if (this.highlights.column.isEnabled()) {
            for (let r = 0; r < this.gridSize; r++) {
                this.highlights.column.add(new CellIdx(r, cellIdx.c));
            }
        }

        // Block highlight
        if (this.highlights.block.isEnabled()) {
            const blockStartR = Math.floor(cellIdx.r / 3) * 3;
            const blockStartC = Math.floor(cellIdx.c / 3) * 3;
            
            for (let r = blockStartR; r < blockStartR + 3; r++) {
                for (let c = blockStartC; c < blockStartC + 3; c++) {
                    this.highlights.block.add(new CellIdx(r, c));
                }
            }
        }
    }

    _updateNumberHighlight() {
        const uniqueValue = this._getUniqueSelectedValue();
        
        if (uniqueValue === null) {
            this._clearNumberHighlights();
            return;
        }

        // Highlight cells with same number
        if (this.highlights.number.isEnabled()) {
            const sameValueCells = this.board.contentLayer.getCellsByValue(uniqueValue);
            sameValueCells.forEach(cellIdx => {
                this.highlights.number.add(cellIdx);
            });
        }

        // Highlight candidate numbers
        if (this.highlights.candidates.isEnabled()) {
            this._highlightCandidateNumbers(uniqueValue);
        }
    }

    _getUniqueSelectedValue() {
        let uniqueValue = null;
        
        for (const idx of this.selected_region.values()) {
            const value = this.board.contentLayer.getCell(idx).value;
            if (!value) continue; // skip empty cells

            if (uniqueValue === null) {
                uniqueValue = value;
            } else if (uniqueValue !== value) {
                return null; // different values found, not unique
            }
        }
        
        return uniqueValue;
    }

    _highlightCandidateNumbers(value) {
        const candidateDivs = this.board.contentLayer.grid.querySelectorAll('.candidate-cell');
        candidateDivs.forEach(div => {
            if (div.textContent.trim() === value.toString()) {
                div.style.fontWeight = 'bold';
            }
        });
    }

    _clearAllHighlights() {
        this._clearRegionHighlights();
        this._clearNumberHighlights();
    }

    _clearRegionHighlights() {
        ['row', 'column', 'block'].forEach(type => {
            this.highlights[type].clear();
        });
    }

    _clearNumberHighlights() {
        this.highlights.number.clear();
        
        // Reset candidate styling
        const candidateDivs = this.board.contentLayer.grid.querySelectorAll('.candidate-cell');
        candidateDivs.forEach(div => {
            div.style.fontWeight = 'normal';
        });
    }
}
