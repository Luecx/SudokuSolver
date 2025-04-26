export class NumberOption {
    constructor({ label, defaultValue = 0, min = 0, max = 100, step = 1, id = null, onChange = null, onDone = null }) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.onChange = onChange;
        this.onDone = onDone;

        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("mb-2");

        this.label = document.createElement("label");
        this.label.className = "form-label";
        this.label.textContent = label;
        if (id) this.label.htmlFor = id;

        this.input = document.createElement("input");
        this.input.className = "form-control";
        this.input.type = "number";
        this.input.value = defaultValue;
        this.input.min = min;
        this.input.max = max;
        this.input.step = step;
        if (id) this.input.id = id;

        this.wrapper.appendChild(this.label);
        this.wrapper.appendChild(this.input);

        this.input.addEventListener("input", () => this._triggerChange());
        this.input.addEventListener("blur", () => this._triggerDone());
    }

    getData() {
        return { label: this.labelText, value: parseFloat(this.input.value) };
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
