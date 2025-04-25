import { SelectionMode } from "../board_selectionEnums.js";
import { RegionType}     from "../region/RegionType.js";
import { createSelectionConfig } from "../board_selectionConfig.js";

/**
 * Base class for UI options in the Sudoku interface.
 */
export class BaseOption {
    constructor(label, id = null, onDone = null) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.onDone = onDone;

        this.wrapper = document.createElement("div");
        this.label = document.createElement("label");
        this.label.className = "form-label";
        this.label.textContent = label;
        if (id) this.label.htmlFor = id;

        this.wrapper.appendChild(this.label);
    }

    /**
     * Returns { label, value }
     */
    getData() {
        throw new Error("getData() must be implemented by subclasses.");
    }

    /**
     * DOM access
     */
    get element() {
        return this.wrapper;
    }

    /**
     * Triggers the onDone callback if provided.
     */
    _triggerDone() {
        this.onDone?.({
            id: this.id,
            label: this.labelText,
            value: this.getData().value
        });
    }
}

/**
 * Checkbox-based boolean option.
 */
export class BooleanOption extends BaseOption {
    constructor({ label, defaultValue = false, id = null, onDone = null }) {
        super(label, id, onDone);
        this.wrapper.className = "form-check mb-2";

        this.input = document.createElement("input");
        this.input.className = "form-check-input";
        this.input.type = "checkbox";
        this.input.checked = defaultValue;
        if (id) this.input.id = id;

        this.label.className = "form-check-label";
        this.wrapper.appendChild(this.input);
        this.wrapper.appendChild(this.label); // correct order for Bootstrap

        this.input.addEventListener("change", () => this._triggerDone());
    }

    getData() {
        return { label: this.labelText, value: this.input.checked };
    }
}

/**
 * Numeric input option.
 */
export class NumberOption extends BaseOption {
    constructor({ label, defaultValue = 0, min = 0, max = 100, step = 1, id = null, onDone = null }) {
        super(label, id, onDone);
        this.wrapper.classList.add("mb-2");

        this.input = document.createElement("input");
        this.input.className = "form-control";
        this.input.type = "number";
        this.input.value = defaultValue;
        this.input.min = min;
        this.input.max = max;
        this.input.step = step;
        if (id) this.input.id = id;

        this.wrapper.appendChild(this.input);

        this.input.addEventListener("blur", () => this._triggerDone());
        this.input.addEventListener("change", () => this._triggerDone());
    }

    getData() {
        return { label: this.labelText, value: parseFloat(this.input.value) };
    }
}

/**
 * Single-line text input.
 */
export class StringOption extends BaseOption {
    constructor({ label, defaultValue = "", id = null, onDone = null }) {
        super(label, id, onDone);
        this.wrapper.classList.add("mb-2");

        this.input = document.createElement("input");
        this.input.className = "form-control";
        this.input.type = "text";
        this.input.value = defaultValue;
        if (id) this.input.id = id;

        this.wrapper.appendChild(this.input);

        this.input.addEventListener("blur", () => this._triggerDone());
        this.input.addEventListener("change", () => this._triggerDone());
    }

    getData() {
        return { label: this.labelText, value: this.input.value };
    }
}

/**
 * Region selector tied to the board’s selection system.
 */
export class RegionSelectorOption extends BaseOption {
    constructor({ label, id = null, board, config, onDone = null }) {
        super(label, id, onDone);
        this.wrapper.classList.add("mb-2");

        this.region = document.createElement("div");
        this.region.className = "form-control bg-light text-muted text-center py-2";
        this.region.style.cursor = "pointer";
        this.region.style.transition = "background 0.2s";
        this.region.textContent = "Edit";
        if (id) this.region.id = id;

        this.wrapper.appendChild(this.region);

        this.active = false;
        this.currentCount = 0;
        this.selected = [];

        const updateDisplay = () => {
            if (this.active) {
                this.region.classList.add("bg-primary", "text-white");
                this.region.textContent = `Stop selecting (${this.currentCount})`;
            } else {
                this.region.classList.remove("bg-primary", "text-white");
                this.region.textContent = this.currentCount > 0
                    ? `Edit (${this.currentCount} selected)`
                    : "Edit";
            }
        };

        const originalChanged = config.onItemsChanged ?? (() => {});
        config.onItemsChanged = (items) => {
            console.log(items);
            console.log("==============================")
            this.selected = [...items];
            this.currentCount = items.length;
            updateDisplay();
            originalChanged(items);
        };

        const clearVisual = () => {
            this.active = false;
            updateDisplay();

            this._triggerDone();

            // Delay board reset to preserve selected items for onDone
            setTimeout(() => board.resetSelectionToDefault(), 0);
        };


        this.region.addEventListener("click", () => {
            if (this.active) {
                clearVisual(); // deactivates + triggers done
            } else {
                this.selected = [];
                board.setSelection(config);
                this.active = true;
                updateDisplay();
            }
        });
    }

    getData() {
        return { label: this.labelText, value: [...this.selected] };
    }

    clear() {
        this.selected = [];
        this.currentCount = 0;
        this.region.textContent = "Edit";
        this.region.classList.remove("bg-primary", "text-white");
    }
}
