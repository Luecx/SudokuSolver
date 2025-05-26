import { CellIdx } from "../region/CellIdx.js";
import { Solution } from "../solution/solution.js";

export class Cell {
    constructor(r, c) {
        this.idx = new CellIdx(r, c);
        this.value = null;
        this.fixed = false;
        this.ordinaryCandidates = [];
        this.centeredCandidates = [];
        this.colors = [];

        this.element = null;
        this.valueLayer = null;
        this.candidateLayer = null;
        this.centeredCandidateLayer = null;
    }

    hasValue() {
        return this.value !== null;
    }

    clear() {
        this.value = null;
        this.fixed = false;
        this.ordinaryCandidates = [];
        this.centeredCandidates = [];
        this.colors = [];
    }
}

export class BoardNumberLayer {
    constructor(container, renderer, gridSize = 9) {
        this.container = container;
        this.gridSize = gridSize;
        this.board = null;
        this.cells = [];
        this.grid = null;
        this.useSolutionStyle = false;
    }

    init(board) {
        this.board = board;

        this.grid = document.createElement("div");
        this.grid.className = "number-layer layer";
        Object.assign(this.grid.style, {
            position: "absolute",
            pointerEvents: "none",
        });
        this.container.appendChild(this.grid);

        this.generateEmptyBoard();
    }

    generateEmptyBoard() {
        this.cells = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.cells.push(new Cell(r, c));
            }
        }
    }

    getFixedNumbers() {
        const solution = new Solution(this.board.gridSize);
        for (const cell of this.cells) {
            if (cell.fixed && cell.value !== null) {
                solution.set(cell.idx, cell.value);
            }
        }
        return solution;
    }

    _generate(cellSize, usedSize, gridOffset) {
        this.grid.innerHTML = "";
        Object.assign(this.grid.style, {
            width: `${usedSize}px`,
            height: `${usedSize}px`,
            top: `${gridOffset}px`,
            left: `${gridOffset}px`,
        });

        for (const cell of this.cells) {
            const div = document.createElement("div");
            div.className = "cell-content";
            div.dataset.r = cell.idx.r;
            div.dataset.c = cell.idx.c;
            div.style.gridArea = `${cell.idx.r + 1} / ${cell.idx.c + 1}`;
            div.style.position = "relative"; // critical for absolute children

            const valueLayer = document.createElement("div");
            valueLayer.className = "value-layer";
            div.appendChild(valueLayer);

            const candidateLayer = document.createElement("div");
            candidateLayer.className = "candidate-layer";
            div.appendChild(candidateLayer);

            const centeredCandidateLayer = document.createElement("div");
            centeredCandidateLayer.className = "centered-candidate-layer";
            div.appendChild(centeredCandidateLayer);

            cell.element = div;
            cell.valueLayer = valueLayer;
            cell.candidateLayer = candidateLayer;
            cell.centeredCandidateLayer = centeredCandidateLayer;

            this.grid.appendChild(div);
            this.updateCell(cell);
        }
    }

    updateCell(cell) {
        this.updateBackground(cell);
        this.updateValue(cell);
        this.updateCandidates(cell);
        this.updateCenteredCandidates(cell);
    }

    updateBackground(cell) {
        if (!cell.element) return;
        cell.element.style.background = this.computeBackground(cell.colors);
        cell.element.classList.toggle("multi-color-background", cell.colors.length > 1);
    }

    updateValue(cell) {
        const valueLayer = cell.valueLayer;
        valueLayer.textContent = "";
        valueLayer.classList.remove("fixed", "editable", "solution-style");

        if (cell.hasValue()) {
            const cellSize = this.board.getCellSize();
            valueLayer.textContent = cell.value;
            valueLayer.style.fontSize = `${cellSize * 0.8}px`;
            valueLayer.classList.add(cell.fixed ? "fixed" : "editable");
            if (!cell.fixed && this.useSolutionStyle) {
                valueLayer.classList.add("solution-style");
            }
        }
    }

    updateCandidates(cell) {
        const candidateLayer = cell.candidateLayer;
        candidateLayer.innerHTML = "";

        const candidateOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const candidateColor = this.useSolutionStyle ? "red" : "#222";
        const cellSize = this.board.getCellSize();
        const candidateSize = (cellSize * 0.7) / 3;

        for (let n of candidateOrder) {
            const candidate = document.createElement("div");
            candidate.className = "candidate-cell";
            candidate.style.fontSize = `${candidateSize * 0.7}px`;
            candidate.style.color = candidateColor;
            if (cell.ordinaryCandidates.includes(n)) {
                candidate.textContent = n;
            }
            candidateLayer.appendChild(candidate);
        }
    }

    updateCenteredCandidates(cell) {
        const layer = cell.centeredCandidateLayer;
        layer.textContent = "";
        layer.className = "centered-candidate-layer";

        if (cell.centeredCandidates.length === 0) {
            layer.style.display = "none";
            return;
        }

        const count = Math.min(cell.centeredCandidates.length, 9);
        layer.classList.add(`cc-size-${count}`);
        layer.textContent = cell.centeredCandidates.sort().join("");
        layer.style.display = "flex";
    }

    computeBackground(colors) {
        if (!colors || colors.length === 0) return "transparent";
        if (colors.length === 1) return colors[0];

        const slice = 360 / colors.length;
        const offset = 38;
        return `conic-gradient(from ${offset}deg, ${colors.map((c, i) =>
            `${c} ${slice * i}deg ${slice * (i + 1)}deg`
        ).join(", ")})`;
    }

    setValue(idx, value, fixed = false) {
        const cell = this.getCell(idx);
        if (!cell) return;

        // Prevent changing fixed cells unless replacing with another fixed value
        if (cell.fixed && !fixed) return;

        cell.value = value;
        cell.fixed = fixed;
        cell.ordinaryCandidates = [];
        cell.centeredCandidates = [];
        this.updateCell(cell);
    }

    setCandidate(idx, candidate, centered = false) {
        const cell = this.getCell(idx);
        if (!cell || cell.fixed || cell.value != null) return;

        const list = centered ? cell.centeredCandidates : cell.ordinaryCandidates;
        if (!list.includes(candidate)) {
            list.push(candidate);
            list.sort((a, b) => a - b);
        }
        if (!centered) cell.value = null;
        this.updateCell(cell);
    }

    unsetCandidate(idx, candidate, centered = false) {
        const cell = this.getCell(idx);
        if (!cell || cell.fixed || cell.value != null) return;

        const list = centered ? cell.centeredCandidates : cell.ordinaryCandidates;
        const i = list.indexOf(candidate);
        if (i !== -1) list.splice(i, 1);
        this.updateCell(cell);
    }

    toggleCandidate(idx, candidate, centered = false) {
        const cell = this.getCell(idx);
        if (!cell || cell.fixed) return;
        const list = centered ? cell.centeredCandidates : cell.ordinaryCandidates;
        const i = list.indexOf(candidate);
        i !== -1 ? list.splice(i, 1) : list.push(candidate);
        list.sort((a, b) => a - b);
        if (!centered) cell.value = null;
        this.updateCell(cell);
    }

    setColor(idx, color) {
        const cell = this.getCell(idx);
        if (!cell || cell.colors.includes(color)) return;
        cell.colors.push(color);
        cell.colors.sort();
        this.updateBackground(cell);
    }

    unsetColor(idx, color) {
        const cell = this.getCell(idx);
        if (!cell) return;
        const i = cell.colors.indexOf(color);
        if (i !== -1) {
            cell.colors.splice(i, 1);
            cell.colors.sort();
            this.updateBackground(cell);
        }
    }

    toggleColor(idx, color, forceSet = false) {
        const cell = this.getCell(idx);
        if (!cell) return;
        const i = cell.colors.indexOf(color);
        if (i !== -1 && !forceSet) {
            cell.colors.splice(i, 1);
        } else if (i === -1) {
            cell.colors.push(color);
        }
        cell.colors.sort();
        this.updateBackground(cell);
    }

    _filterCells(region) {
        return region.items.filter(i => i instanceof CellIdx).map(i => this.getCell(i)).filter(Boolean);
    }

    setValues(region, value, fixed = false) {
        this._filterCells(region).forEach(c => this.setValue(c.idx, value, fixed));
    }

    unsetValues(region) {
        this._filterCells(region).forEach(c => this.setValue(c.idx, null, false));
    }

    toggleValues(region, value, fixed = false) {
        const cells = this._filterCells(region);

        const filtered = cells.filter(c => {
            if (fixed === true) return c.fixed;
            return !c.fixed;
        });

        const allHave = filtered.every(c => c.value === value && (value === null || c.fixed === fixed));

        filtered.forEach(c => {
            this.setValue(c.idx, allHave ? null : value, allHave ? false : fixed);
        });
    }


    setCandidates(region, candidate, centered = false) {
        this._filterCells(region).forEach(c => this.setCandidate(c.idx, candidate, centered));
    }

    unsetCandidates(region, candidate, centered = false) {
        this._filterCells(region).forEach(c => this.unsetCandidate(c.idx, candidate, centered));
    }

    toggleCandidates(region, candidate, centered = false) {
        const cells = this._filterCells(region);
        const relevantCells = cells.filter(c => c.value === null); // only empty cells
        const allHave = relevantCells.every(c =>
            (centered ? c.centeredCandidates : c.ordinaryCandidates).includes(candidate)
        );

        cells.forEach(c => {
            if (allHave) {
                this.unsetCandidate(c.idx, candidate, centered);
            } else {
                this.setCandidate(c.idx, candidate, centered);
            }
        });
    }

    setColors(region, color) {
        this._filterCells(region).forEach(c => this.setColor(c.idx, color));
    }

    unsetColors(region, color) {
        this._filterCells(region).forEach(c => this.unsetColor(c.idx, color));
    }

    toggleColors(region, color, forceSet = false) {
        if (forceSet) return this.setColors(region, color);
        const cells = this._filterCells(region);
        const allHave = cells.every(c => c.colors.includes(color));
        cells.forEach(c => {
            if (allHave) this.unsetColor(c.idx, color);
            else this.setColor(c.idx, color);
        });
    }

    clearRegion(region, force = false, canClearFixed = false) {
        const allCells = this._filterCells(region); // for checking
        const cells    = allCells.filter(cell => canClearFixed || !cell.fixed);

        if (cells.length === 0) return;

        if (force) {
            for (const cell of cells) {
                cell.clear();
                this.updateCell(cell);
            }
            return;
        }

        const anyHasValue = cells.some(c => c.value !== null); // check all, even fixed
        const anyHasCandidate = !anyHasValue && cells.some(c =>
            c.ordinaryCandidates.length > 0 || c.centeredCandidates.length > 0
        );

        if (anyHasValue) {
            cells.forEach(c => c.value = null);
        } else if (anyHasCandidate) {
            cells.forEach(c => {
                c.ordinaryCandidates = [];
                c.centeredCandidates = [];
            });
        } else {
            allCells.forEach(c => c.colors = []);
        }

        for (const cell of allCells) {
            this.updateCell(cell);
        }
    }


    getCell(idx) {
        return this.cells.find(cell => cell.idx.equals(idx));
    }

    resetContent() {
        for (const cell of this.cells) {
            cell.clear();
            this.updateCell(cell);
        }
    }

    setSolutionStyle(enabled = true) {
        this.useSolutionStyle = enabled;
        this.cells.forEach(c => this.updateCell(c));
    }

    toggleStyle() {
        this.setSolutionStyle(!this.useSolutionStyle);
    }

    show() {
        if (this.grid) this.grid.classList.remove("hidden");
    }

    hide() {
        if (this.grid) this.grid.classList.add("hidden");
    }

    toggleVisibility() {
        if (this.grid) this.grid.classList.toggle("hidden");
    }

    isVisible() {
        return this.grid && !this.grid.classList.contains("hidden");
    }

    saveFixedCells() {
        return this.cells
            .filter(c => c.hasValue() && c.fixed)
            .map(c => ({ r: c.idx.r, c: c.idx.c, value: c.value }));
    }

    loadFixedCells(data) {
        for (const { r, c, value } of data) {
            this.setValue(new CellIdx(r, c), value, true);
        }
    }
}
