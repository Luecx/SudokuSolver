export class StringOption {
    constructor({ label, defaultValue = "", id = null, onChange = null, onDone = null }) {
        this.labelText = label;
        this.id = id ?? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        this.onChange = onChange;
        this.onDone = onDone;

        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("m-2");

        this.label = document.createElement("label");
        this.label.className = "form-label";
        this.label.innerHTML = label;
        if (id) this.label.htmlFor = id;

        this.input = document.createElement("input");
        this.input.className = "form-control";
        this.input.type = "text";
        this.input.value = defaultValue;
        if (id) this.input.id = id;

        this.wrapper.appendChild(this.label);
        this.wrapper.appendChild(this.input);

        this.input.addEventListener("input", () => this._triggerChange());
        this.input.addEventListener("blur", () => this._triggerDone());
    }

    getData() {
        return { label: this.labelText, value: this.input.value };
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
