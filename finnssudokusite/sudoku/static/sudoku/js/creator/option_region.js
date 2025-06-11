import { Region } from "../region/Region.js";

export class RegionSelectorOption {
    constructor({ label, id = null, board, config, onChange = null, onDone = null, onStartPreSelecting = null,
                    onStartPostSelecting = null }) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.board = board;
        this.config = config;
        this.onChange = onChange;
        this.onDone = onDone;
        this.onStartPreSelecting = onStartPreSelecting;
        this.onStartPostSelecting = onStartPostSelecting;

        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("m-2");

        this.label = document.createElement("label");
        this.label.className = "form-label";
        this.label.innerHTML = this.labelText;
        if (id) this.label.htmlFor = id;
        this.wrapper.appendChild(this.label);

        this.region = document.createElement("div");
        this.region.className = "form-control bg-light text-muted text-center py-2";
        this.region.style.cursor = "pointer";
        this.region.innerHTML = "Edit";
        this.wrapper.appendChild(this.region);

        this.active = false;
        this.currentCount = 0;
        this.selected = [];

        this._boundHandlers = null;

        this.region.addEventListener("click", () => {
            this.active ? this.stop() : this.start();
        });

        this._updateDisplay();
    }

    start() {
        if (this.active) return;
        this.active = true;

        if (this.onStartPreSelecting) {
            this.onStartPreSelecting();
        }
        this.board.setSelectionMode(this.config);
        if (this.onStartPostSelecting) {
            this.onStartPostSelecting();
        }
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
            },
            regionChanged: (region) => {
                this.selected = [...region.values()];
                this.currentCount = this.selected.length;
                this._updateDisplay();
                this._triggerChange();
            },
            selectionEnded: (config, region) => {
                if (config !== this.config) return;
                this.selected = [...region.values()];
                this.currentCount = this.selected.length;
                this._triggerChange();
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
            this.region.innerHTML = `Stop selecting (${this.currentCount})`;
        } else {
            this.region.classList.remove("bg-primary", "text-white");
            this.region.innerHTML = this.currentCount > 0 ? `Edit (${this.currentCount} selected)` : "Edit";
        }
    }

    getData() {
        const region = new Region(this.config.target);
        for (const item of this.selected) {
            region.add(item);
        }
        return { label: this.labelText, value: region.copy() };
    }

    get element() {
        return this.wrapper;
    }

    _triggerChange() {
        this.onChange?.({
            id: this.id,
            label: this.labelText,
            value: this.getData().value
        });
    }

    _triggerDone() {
        this.onDone?.({
            id: this.id,
            label: this.labelText,
            value: this.getData().value
        });
    }

    clear() {
        this.selected = [];
        this.currentCount = 0;
        this._updateDisplay();
    }
}
