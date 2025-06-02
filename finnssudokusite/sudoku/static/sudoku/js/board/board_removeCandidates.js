import { CellIdx } from "../region/CellIdx.js";
import { Region } from "../region/Region.js";
import { RegionType } from "../region/RegionType.js";

export class CandidateRemover {
    constructor() {
        this.board = null;
        this.enabled = false;
    }

    init(board) {
        this.board = board;

        // Bind checkbox if it exists
        const checkbox = document.getElementById("autoRemoveCandidates");
        if (checkbox) {
            this.setEnabled(checkbox.checked); // default state from checkbox
            checkbox.addEventListener("change", e => {
                this.setEnabled(e.target.checked);
            });
        } else {
            this.setEnabled(false); // no checkbox found, default to disabled
        }

        board.onEvent("ev_number_changed", region => {
            if (!this.enabled || !region?.items) return;
            for (const cell of region.items) {
                this._processCell(cell);
            }
        });
    }

    setEnabled(flag) {
        this.enabled = flag;
    }

    enable() {
        this.setEnabled(true);
    }

    disable() {
        this.setEnabled(false);
    }

    _processCell(cell) {
        const value = this.board.getAllNumbers().get(cell);
        if (!value || value <= 0 || value > 9) return;

        const allHandlers = this.board.getAllHandlers();

        for (const handler of allHandlers) {
            if (!handler.enabled) continue;

            if (handler.tag === "Standard") {
                this._applyStandard(cell, value);
            } else if (handler.tag === "Anti-Chess") {
                for (const rule of handler.getRules()) {
                    if (!rule.fields?.enabled) continue;

                    const region = rule.fields?.region;
                    const allowRepeat = rule.fields?.NumberCanRepeat !== false;

                    if (allowRepeat) continue;

                    const isKnight = rule.label === "Anti-Knight";
                    const isKing   = rule.label === "Anti-King";
                    if (!isKnight && !isKing) continue;

                    const peers = isKnight
                        ? this._getKnightPeers(cell)
                        : this._getKingPeers(cell);

                    if (region?.size() > 0) {
                        if (!region.has(cell)) continue;
                        const filtered = peers.filter(p => region.has(p));
                        this._removeCands(filtered, value);
                    } else {
                        this._removeCands(peers, value);
                    }
                }
            }
        }
    }

    _removeCands(cells, val) {
        if (!cells || cells.length === 0) return;
        const region = new Region(RegionType.CELLS, cells);
        this.board.unsetCandidates(region, val, false);
        this.board.unsetCandidates(region, val, true);
    }

    _applyStandard(cell, val) {
        const gridSize = this.board.getGridSize();
        const peers = [];

        for (let i = 0; i < gridSize; i++) {
            if (i !== cell.r) peers.push(new CellIdx(i, cell.c));
            if (i !== cell.c) peers.push(new CellIdx(cell.r, i));
        }

        const boxRow = Math.floor(cell.r / 3) * 3;
        const boxCol = Math.floor(cell.c / 3) * 3;

        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (r === cell.r && c === cell.c) continue;
                peers.push(new CellIdx(r, c));
            }
        }

        this._removeCands(peers, val);
    }

    _getKnightPeers(cell) {
        const offsets = [
            [-2, -1], [-1, -2], [1, -2], [2, -1],
            [2, 1], [1, 2], [-1, 2], [-2, 1]
        ];
        return this._filterValid(cell, offsets);
    }

    _getKingPeers(cell) {
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [ 0, -1],          [ 0, 1],
            [ 1, -1], [ 1, 0], [ 1, 1]
        ];
        return this._filterValid(cell, offsets);
    }

    _filterValid(cell, offsets) {
        const size = this.board.getGridSize();
        const result = [];

        for (const [dr, dc] of offsets) {
            const nr = cell.r + dr;
            const nc = cell.c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                result.push(new CellIdx(nr, nc));
            }
        }

        return result;
    }
}
