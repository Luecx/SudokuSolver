import { CellIdx } from "../region/CellIdx.js";

export class HistoryManager {
    constructor(renderer) {
        this.board = null;
        this.renderer = renderer;
        this.history = [];
        this.currentIndex = -1; // Start at -1 since no history yet
        this.isRestoring = false;
    }

    init(board) {
        this.board = board;

        // Save initial state first (like starting position in chess)
        this._saveInitialState();

        const undoButton = document.getElementById("btn-undo");
        if (undoButton) {
            undoButton.addEventListener("click", () => {
                this.undo();
            });
        }

        const redoButton = document.getElementById("btn-redo");
        if (redoButton) {
            redoButton.addEventListener("click", () => {
                this.redo();
            });
        }

        if (undoButton && redoButton) {
            board.onEvent("ev_number_changed", region => {
                if (!this.isRestoring) this._saveBoardState();
            });

            board.onEvent("ev_candidates_changed", region => {
                if (!this.isRestoring) this._saveBoardState();
            });
            
            board.onEvent("ev_color_changed", region => {
                if (!this.isRestoring) this._saveBoardState();
            });
        }
    }

    undo() {
        if (this._canUndo()) {
            this.currentIndex--;
            this._restoreState(this.history[this.currentIndex]);
        }
    }

    redo() {
        if (this._canRedo()) {
            this.currentIndex++;
            this._restoreState(this.history[this.currentIndex]);
        }
    }

    _saveInitialState() {
        const state = this._createBoardSnapshot();
        this.history.push(state);
        this.currentIndex = 0; // Now we have one state
    }

    _saveBoardState() {
        // Remove any "future" history if we're not at the end (delete old variations)
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        const state = this._createBoardSnapshot();
        if (state.length > 0) {
            this.history.push(state);
            this.currentIndex++;
        }
    }

    _createBoardSnapshot() {
        const snapshot = [];
        const gridSize = this.board.getGridSize();
        
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cellIdx = new CellIdx(r, c);
                const cell = this.board.contentLayer.getCell(cellIdx);
                
                // Save all cells (both fixed and non-fixed)
                if (cell) {
                    snapshot.push(this._createCellSnapshot(cell));
                }
            }
        }
        return snapshot;
    }

    _createCellSnapshot(cell) {
        return {
            idx: cell.idx,
            value: cell.value,
            fixed: cell.fixed,
            ordinaryCandidates: [...cell.ordinaryCandidates],
            centeredCandidates: [...cell.centeredCandidates],
            colors: [...cell.colors]
        };
    }

    _canUndo() {
        return this.currentIndex > 0; // Changed from >= 0 to > 0
    }

    _canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    _restoreState(state) {
        this.isRestoring = true;
        
        // Restore all saved cell states
        for (const cellData of state) {
            const cell = this.board.contentLayer.getCell(cellData.idx);
            if (!cell) continue;
        
            cell.value = cellData.value;
            cell.fixed = cellData.fixed;
            cell.ordinaryCandidates = [...cellData.ordinaryCandidates];
            cell.centeredCandidates = [...cellData.centeredCandidates];
            cell.colors = [...cellData.colors];
                
            this.board.contentLayer.updateCell(cell);
        }
        
        this.renderer.triggerRender();        
        this.isRestoring = false;
    }
}