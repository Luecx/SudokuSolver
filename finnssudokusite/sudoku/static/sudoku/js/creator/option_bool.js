export class BooleanOption {
    constructor({ label, defaultValue = false, id = null, onChange = null, onDone = null }) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.onChange = onChange;
        this.onDone = onDone;

        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("form-check", "m-2");

        this.input = document.createElement("input");
        this.input.className = "form-check-input";
        this.input.type = "checkbox";
        this.input.checked = defaultValue;
        this.input.id = this.id;

        this.label = document.createElement("label");
        this.label.className = "form-check-label";
        this.label.innerHTML = label;
        this.label.htmlFor = this.id;

        this.wrapper.appendChild(this.input);
        this.wrapper.appendChild(this.label);

        this.input.addEventListener("change", () => {
            this._triggerChange();
            this._triggerDone();
        });
    }

    getData() {
        return { label: this.labelText, value: this.input.checked };
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
