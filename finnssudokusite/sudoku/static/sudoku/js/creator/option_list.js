export class ListOption {
    constructor({ label, defaultValue = [], max_num_count = 4, min = -Infinity, max = Infinity, id = null, onChange = null, onDone = null }) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.onChange = onChange;
        this.onDone = onDone;
        this.maxCount = max_num_count;
        this.min = min;
        this.max = max;
        this._lastKey = null;

        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("m-2");

        this.label = document.createElement("label");
        this.label.className = "form-label";
        this.label.innerHTML = label;
        this.wrapper.appendChild(this.label);

        this.inputContainer = document.createElement("div");
        this.inputContainer.className = "d-grid";
        this.inputContainer.style.gridTemplateColumns = `repeat(${Math.min(5, max_num_count)}, 1fr)`;
        this.inputContainer.style.gap = "6px";
        this.inputContainer.style.width = "100%";
        this.inputContainer.style.maxWidth = "100%";

        this.inputs = [];

        for (let i = 0; i < max_num_count; i++) {
            const input = document.createElement("input");
            input.className = "form-control text-center";
            input.type = "number";
            input.placeholder = `#${i + 1}`;
            input.value = defaultValue[i] ?? "";
            input.min = min;
            input.max = max;

            input.style.width = "100%";
            input.style.flex = "1 1 auto";
            input.style.minWidth = "0";

            input.addEventListener("keydown", (e) => {
                this._lastKey = e.key;
            });

            input.addEventListener("mousedown", () => {
                this._lastKey = "mouse";
            });

            input.addEventListener("input", () => {
                const val = input.value;
                const isArrowKey = this._lastKey === "ArrowUp" || this._lastKey === "ArrowDown" || this._lastKey === "mouse";

                if (this.min >= 0 && this.max < 10 && val.length > 0 && !isArrowKey) {
                    const idx = this.inputs.indexOf(input);
                    if (idx < this.inputs.length - 1) {
                        this.inputs[idx + 1].focus();
                    }
                }

                this._handleShiftUp();
                this._triggerChange();
            });

            input.addEventListener("blur", () => {
                const val = parseFloat(input.value.trim());
                if (!isNaN(val)) {
                    input.value = Math.min(this.max, Math.max(this.min, val));
                }
                this._triggerDone();
            });

            this.inputs.push(input);
            this.inputContainer.appendChild(input);
        }

        this.wrapper.appendChild(this.inputContainer);
    }

    _handleShiftUp() {
        const values = this.inputs.map(input => input.value.trim()).filter(v => v !== "");
        for (let i = 0; i < this.maxCount; i++) {
            this.inputs[i].value = values[i] ?? "";
        }
    }

    getData() {
        return {
            label: this.labelText,
            value: this.inputs
                .map(input => input.value.trim())
                .filter(val => val !== "")
                .map(Number)
        };
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
}
