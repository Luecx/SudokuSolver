import { CellIdx } from "../region/CellIdx.js";

export class HistoryManager {
    constructor(renderer) {
        this.board = null;
        this.renderer = renderer;
        this.history = [];
        this.currentIndex = -1;
        this.isRestoring = false;
        this.pendingSave = false; // Flag to prevent multiple saves
        this.saveTimeout = null; // Timeout to batch saves
    }

    init(board) {
        this.board = board;

        this.saveInitialState();

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

        // Listen to events and batch multiple saves from the same user action
        if (undoButton && redoButton) {
            board.onEvent("ev_number_changed", region => {
                if (!this.isRestoring) this._debouncedSave();
            });

            board.onEvent("ev_candidates_changed", region => {
                if (!this.isRestoring) this._debouncedSave();
            });
            
            board.onEvent("ev_color_changed", region => {
                if (!this.isRestoring) this._debouncedSave();
            });

            this._updateHistoryIndicator();
        }
    }

    // Debounce saves to merge multiple events from the same user action
    _debouncedSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Wait a short time to see if more events come in
        this.saveTimeout = setTimeout(() => {
            this._saveBoardState();
            this.saveTimeout = null;
        }, 10); // 10ms delay to batch events
    }

    undo() {
        if (this._canUndo()) {
            this.currentIndex--;
            this._restoreState(this.history[this.currentIndex]);
            this._updateHistoryIndicator();
        }
    }

    redo() {
        if (this._canRedo()) {
            this.currentIndex++;
            this._restoreState(this.history[this.currentIndex]);
            this._updateHistoryIndicator();
        }
    }

    saveInitialState() {
        const snapshot = this._createBoardSnapshot();
        this.history = [];
        this.history.push(snapshot);
        this.currentIndex = 0;
    }

    _updateHistoryIndicator() {
        const indicator = document.getElementById("history-indicator");
        if (indicator) {
            const current = this.currentIndex;
            const total = this.history.length - 1;
            indicator.innerHTML = `<small>${current}/${total}</small>`;
        }
    }

    _saveBoardState() {
        // Remove any "future" history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Save entire board state
        const snapshot = this._createBoardSnapshot();
        this.history.push(snapshot);
        this.currentIndex++;

        this._updateHistoryIndicator(); 
    }

    _createBoardSnapshot() {
        const snapshot = [];
        const gridSize = this.board.getGridSize();

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = this.board.contentLayer.getCell(new CellIdx(r, c));
                if (cell)
                    snapshot.push(this._createCellSnapshot(cell));
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
        return this.currentIndex > 0;
    }

    _canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    _restoreState(state) {
        this.isRestoring = true;
        
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
