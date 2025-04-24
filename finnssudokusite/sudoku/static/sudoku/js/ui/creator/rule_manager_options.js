import {SelectionMode, SelectionTarget} from "../board_selectionEnums.js";

export function booleanOption({label, defaultValue = false, id = null}) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-check mb-2";

    const input = document.createElement("input");
    input.className = "form-check-input";
    input.type = "checkbox";
    input.checked = defaultValue;
    if (id) input.id = id;

    const inputLabel = document.createElement("label");
    inputLabel.className = "form-check-label";
    inputLabel.textContent = label;
    if (id) inputLabel.htmlFor = id;

    wrapper.appendChild(input);
    wrapper.appendChild(inputLabel);

    return {
        element: wrapper,
        getValue: () => input.checked
    };
}

export function numberOption({label, defaultValue = 0, min = 0, max = 100,
                                 step = 1, id = null}) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-2";

    const inputLabel = document.createElement("label");
    inputLabel.className = "form-label";
    inputLabel.textContent = label;
    if (id) inputLabel.htmlFor = id;

    const input = document.createElement("input");
    input.className = "form-control";
    input.type = "number";
    input.value = defaultValue;
    input.min = min;
    input.max = max;
    input.step = step;
    if (id) input.id = id;

    wrapper.appendChild(inputLabel);
    wrapper.appendChild(input);

    return {
        element: wrapper,
        getValue: () => parseFloat(input.value)
    };
}

export function stringOption({label, defaultValue = "", id = null}) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-2";

    const inputLabel = document.createElement("label");
    inputLabel.className = "form-label";
    inputLabel.textContent = label;
    if (id) inputLabel.htmlFor = id;

    const input = document.createElement("input");
    input.className = "form-control";
    input.type = "text";
    input.value = defaultValue;
    if (id) input.id = id;

    wrapper.appendChild(inputLabel);
    wrapper.appendChild(input);

    return {
        element: wrapper,
        getValue: () => input.value
    };
}

export function regionSelector({ label, id = null, board, target = SelectionTarget.CELLS, mode = SelectionMode.MULTIPLE }) {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-2";

    const inputLabel = document.createElement("label");
    inputLabel.className = "form-label";
    inputLabel.textContent = label;
    if (id) inputLabel.htmlFor = id;

    const region = document.createElement("div");
    region.className = "form-control bg-light text-muted text-center py-2";
    region.style.cursor = "pointer";
    region.style.transition = "background 0.2s";
    region.textContent = "Edit";
    if (id) region.id = id;

    wrapper.appendChild(inputLabel);
    wrapper.appendChild(region);

    let active = false;
    let selected = [];

    const updateDisplay = () => {
        if (active) {
            region.classList.add("bg-primary", "text-white");
            region.textContent = `Stop selecting (${selected.length})`;
        } else {
            region.classList.remove("bg-primary", "text-white");
            region.textContent = selected.length > 0 ? `Edit (${selected.length} selected)` : "Edit";
        }
    };

    const clearVisual = () => {
        selected = [];
        board.setSelection({ target: SelectionTarget.NONE });
        active = false;
        updateDisplay();
    };

    region.addEventListener("click", () => {
        if (active) {
            clearVisual();
        } else {
            selected = [];

            board.setSelection({
                target: target,
                mode: mode,
                showVisual: true,

                onCellAdded: ({ r, c }) => {
                    selected.push({ r, c });
                    console.log("Cell selected:", r, c);
                    updateDisplay();
                },
                onEdgeAdded: ({ from, to }) => {
                    selected.push({ from, to });
                    updateDisplay();
                },
                onCornerAdded: ({ r, c }) => {
                    selected.push({ r, c });
                    updateDisplay();
                },
                onCellsCleared: () => {
                    selected = [];
                    updateDisplay();
                }
            });

            active = true;
            updateDisplay();
        }
    });

    return {
        element: wrapper,
        getValue: () => selected,
        clear: clearVisual
    };
}
