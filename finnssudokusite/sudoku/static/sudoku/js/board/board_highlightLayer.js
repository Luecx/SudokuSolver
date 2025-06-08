import { Region } from "../region/Region.js";
import { CellIdx } from "../region/CellIdx.js";
import { RegionType } from "../region/RegionType.js";
import { buildInsetPath } from "../util/inset_path.js";

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

export class HighlightLayer {
    constructor(renderer) {
        this.board = null;
        this.renderer = renderer;

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
        // any changes shall cause a redraw
        this.board.addRenderCall("render_highlight", this._renderHighlight.bind(this), 1000);
        
        // highlight updates
        this.board.onEvent("ev_selected_region_changed", () => {
            this.updateHighlights();
            this.renderer.triggerRender();
        });

        this.board.onEvent("ev_number_changed", () => {
            this.updateHighlights();
            this.renderer.triggerRender();
        });

        this.board.onEvent("ev_candidates_changed", () => {
            this.updateHighlights();
            this.renderer.triggerRender();
        });

        // highlight toggles
        const highlightTypes = [
            { id: 'highlightRow', type: 'row' },
            { id: 'highlightColumn', type: 'column' },
            { id: 'highlightBlock', type: 'block' },
            { id: 'highlightNumber', type: 'number' },
            { id: 'highlightCandidates', type: 'candidates' }
        ];

        highlightTypes.forEach(({ id, type }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.highlights[type].enable(e.target.checked);
                    this.updateHighlights();
                });
            } else {
                this.highlights[type].enable(false);
            }
        });
    }

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
            this._renderRegion(ctx, this.highlights.number.getRegion(), "rgba(10, 60, 110, 0.2)");
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

    updateHighlights() {
        this._clearAllHighlights();

        const selectedRegion = this.board.cellLayer.selected_region;
        if (selectedRegion.size() === 1) {
            const cellIdx = selectedRegion.values()[0];
            this._updateRegionHighlights(cellIdx);
        }
        
        this._updateNumberHighlight();
    }

    _updateRegionHighlights(cellIdx) {
        // Row highlight
        const gridSize = this.board.getGridSize();
        if (this.highlights.row.isEnabled())
            for (let c = 0; c < gridSize; c++)
                this.highlights.row.add(new CellIdx(cellIdx.r, c));

        // Column highlight
        if (this.highlights.column.isEnabled())
            for (let r = 0; r < gridSize; r++)
                this.highlights.column.add(new CellIdx(r, cellIdx.c));

        // Block highlight
        if (this.highlights.block.isEnabled()) {
            const blockStartR = Math.floor(cellIdx.r / 3) * 3;
            const blockStartC = Math.floor(cellIdx.c / 3) * 3;
            
            for (let r = blockStartR; r < blockStartR + 3; r++)
                for (let c = blockStartC; c < blockStartC + 3; c++)
                    this.highlights.block.add(new CellIdx(r, c));
        }
    }

    _updateNumberHighlight() {
        console.log("updating number highlights");
        const uniqueValue = this._getUniqueSelectedValue();
        console.log(uniqueValue);
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
        
        const selectedRegion = this.board.cellLayer.selected_region;
        for (const idx of selectedRegion.values()) {
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
                div.style.setProperty('font-weight', 'bold', 'important');
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
            div.style.setProperty('font-weight', 'normal', 'important');
        });
    }
}
