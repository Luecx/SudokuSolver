export class BooleanOption {
    constructor({ label, defaultValue = false, id = null, onDone = null }) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.onDone = onDone;

        this.wrapper = document.createElement("div");
        this.wrapper.className = "form-check mb-2";

        this.input = document.createElement("input");
        this.input.className = "form-check-input";
        this.input.type = "checkbox";
        this.input.checked = defaultValue;
        if (id) this.input.id = id;

        this.label = document.createElement("label");
        this.label.className = "form-check-label";
        this.label.textContent = label;
        if (id) this.label.htmlFor = id;

        this.wrapper.appendChild(this.input);
        this.wrapper.appendChild(this.label);

        this.input.addEventListener("change", () => this._triggerDone());
    }

    getData() {
        return { label: this.labelText, value: this.input.checked };
    }

    get element() {
        return this.wrapper;
    }

    _triggerDone() {
        this.onDone?.({
            id: this.id,
            label: this.labelText,
            value: this.getData().value
        });
    }
}