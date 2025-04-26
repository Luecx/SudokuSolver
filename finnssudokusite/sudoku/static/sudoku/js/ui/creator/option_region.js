import { Region } from "../region/Region.js"; // <- needed to construct Region if missing

export class RegionSelectorOption {
    constructor({ label, id = null, board, config, onDone = null, initialRegion = null }) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.onDone = onDone;
        this.board = board;
        this.config = config;

        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("mb-2");

        this.label = document.createElement("label");
        this.label.className = "form-label";
        this.label.textContent = this.labelText;
        if (id) this.label.htmlFor = id;
        this.wrapper.appendChild(this.label);

        this.region = document.createElement("div");
        this.region.className = "form-control bg-light text-muted text-center py-2";
        this.region.style.cursor = "pointer";
        this.region.textContent = "Edit";
        this.wrapper.appendChild(this.region);

        this.active = false;
        this.currentCount = 0;
        this.selected = [];

        // 🔥 Initialize from given initialRegion
        if (initialRegion instanceof Region) {
            this.selected = [...initialRegion.values()];
            this.currentCount = this.selected.length;
        } else {
            this.selected = [];
            this.currentCount = 0;
        }

        this._boundHandlers = null;

        this.region.addEventListener("click", () => {
            if (this.active) {
                this.stop();
            } else {
                this.start();
            }
        });

        this._updateDisplay();
    }

    start() {
        if (this.active) return;
        this.active = true;
        this.board.setSelection(this.config);
        // this.board.setSelectedItems(this.selected);
        this._attachBoardListeners();
        this._updateDisplay();
    }

    stop() {
        if (!this.active) return;
        this.active = false;
        this.board.resetSelectionToDefault();
        this._detachBoardListeners();
        this._triggerDone();
        this._updateDisplay();
    }

    _attachBoardListeners() {
        if (this._boundHandlers) return;

        this._boundHandlers = {
            selectionStarted: (config) => {
                if (config !== this.config) return;
                // this.board.setSelectedItems(this.selected);
            },
            regionChanged: (region) => {
                this.selected = [...region.values()];
                this.currentCount = this.selected.length;
                this._updateDisplay();
            },
            selectionEnded: (config, region) => {
                if (config !== this.config) return;
                this.selected = [...region.values()];
                this.currentCount = this.selected.length;
                this.stop();
            }
        };

        this.board.onEvent("ev_selection_started", this._boundHandlers.selectionStarted);
        this.board.onEvent("ev_selected_region_changed", this._boundHandlers.regionChanged);
        this.board.onEvent("ev_selection_ended", this._boundHandlers.selectionEnded);
    }

    _detachBoardListeners() {
        if (!this._boundHandlers) return;

        this.board.offEvent("ev_selection_started", this._boundHandlers.selectionStarted);
        this.board.offEvent("ev_selected_region_changed", this._boundHandlers.regionChanged);
        this.board.offEvent("ev_selection_ended", this._boundHandlers.selectionEnded);

        this._boundHandlers = null;
    }

    _updateDisplay() {
        if (this.active) {
            this.region.classList.add("bg-primary", "text-white");
            this.region.textContent = `Stop selecting (${this.currentCount})`;
        } else {
            this.region.classList.remove("bg-primary", "text-white");
            this.region.textContent = this.currentCount > 0 ? `Edit (${this.currentCount} selected)` : "Edit";
        }
    }

    _triggerDone() {
        this.onDone?.({
            id: this.id,
            label: this.labelText,
            value: this.getData().value
        });
    }

    getData() {
        return { label: this.labelText, value: [...this.selected] };
    }

    get element() {
        return this.wrapper;
    }

    clear() {
        this.selected = [];
        this.currentCount = 0;
        this._updateDisplay();
    }
}
