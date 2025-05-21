import { CellIdx } from "../region/CellIdx.js";
import {Solution} from "../solution/solution.js";

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
                const cell = new Cell(r, c);
                this.cells.push(cell);
            }
        }
    }

    getFixedNumbers() {
        let solution = new Solution(this.board.gridSize);

        for (const cell of this.cells) {
            const idx   = cell.idx;
            const value = cell.value;
            const fixed = cell.fixed;
            if (fixed && value !== null) {
                solution.set(idx, value);
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
        if (!cell.element) return;

        const valueLayer = cell.valueLayer;
        const candidateLayer = cell.candidateLayer;
        const centeredCandidateLayer = cell.centeredCandidateLayer;

        // --- Hintergrund aktualisieren ---
        cell.element.style.background = this.computeBackground(cell.colors);
        cell.element.classList.toggle("multi-color-background", cell.colors.length > 1);

        // --- Reset Inhalt & Klassen ---
        valueLayer.textContent = "";
        valueLayer.classList.remove("fixed", "editable", "solution-style");
        candidateLayer.innerHTML = "";
        centeredCandidateLayer.textContent = "";
        centeredCandidateLayer.className = "centered-candidate-layer"; // reset size class

        const cellSize = this.board.getCellSize();

        // --- Zahlenwert ---
        if (cell.hasValue()) {
            valueLayer.textContent    = cell.value;
            valueLayer.style.fontSize = cellSize * 0.8 + "px"
            valueLayer.classList.add(cell.fixed ? "fixed" : "editable");
            if (!cell.fixed && this.useSolutionStyle) {
                valueLayer.classList.add("solution-style");
            }
        }

        // --- Kandidaten (3×3) ---
        const candidateOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const candidateColor = this.useSolutionStyle ? "red" : "#222";

        const candidateSize = (cellSize * 0.7) / 3;

        for (let n of candidateOrder) {
            const candidate = document.createElement("div");
            candidate.className = "candidate-cell";
            candidate.style.fontSize = `${candidateSize * 0.7}px`; // behalten für pixelpräzise Darstellung
            candidate.style.color = candidateColor;

            if (cell.ordinaryCandidates.includes(n)) {
                candidate.textContent = n;
            }

            candidateLayer.appendChild(candidate);
        }

        // --- Centered Candidates ---
        if (cell.centeredCandidates.length > 0) {
            const count = Math.min(cell.centeredCandidates.length, 9);
            centeredCandidateLayer.classList.add(`cc-size-${count}`);
            centeredCandidateLayer.textContent = cell.centeredCandidates.sort().join("");
        } else {
            centeredCandidateLayer.style.display = "none";
            return;
        }

        // Wieder anzeigen, falls vorher versteckt
        centeredCandidateLayer.style.display = "flex";
    }


    computeBackground(colors) {
        if (!colors || colors.length === 0) return "transparent";
        if (colors.length === 1) return colors[0];

        const slice = 360 / colors.length;
        const offset = 38; // Adjust this value to control starting angle
        return `conic-gradient(from ${offset}deg, ${colors.map((c, i) =>
            `${c} ${slice * i}deg ${slice * (i + 1)}deg`
        ).join(", ")})`;
    }


    // --- Single cell operations ---
    setValue(idx, value, fixed = false) {
        const cell = this.getCell(idx);
        if (!cell) return;
        cell.value = value;
        cell.fixed = fixed;
        cell.ordinaryCandidates = [];
        cell.centeredCandidates = [];
        this.updateCell(cell);
    }

    setCandidate(idx, candidate, centered = false) {
        const cell = this.getCell(idx);
        if (!cell) return;

        const list = centered ? cell.centeredCandidates : cell.ordinaryCandidates;
        if (!list.includes(candidate)) {
            list.push(candidate);
            list.sort((a, b) => a - b);
        }
        if (!centered) {
            cell.value = null;
        }
        this.updateCell(cell);
    }

    unsetCandidate(idx, candidate, centered = false) {
        const cell = this.getCell(idx);
        if (!cell) return;

        const list = centered ? cell.centeredCandidates : cell.ordinaryCandidates;
        const i = list.indexOf(candidate);
        if (i !== -1) {
            list.splice(i, 1);
            list.sort((a, b) => a - b);
        }
        this.updateCell(cell);
    }

    toggleCandidate(idx, candidate, centered = false) {
        const cell = this.getCell(idx);
        if (!cell) return;

        const list = centered ? cell.centeredCandidates : cell.ordinaryCandidates;
        const i = list.indexOf(candidate);

        if (i !== -1) {
            list.splice(i, 1);
        } else {
            list.push(candidate);
        }
        list.sort((a, b) => a - b);

        if (!centered) {
            cell.value = null;
        }
        this.updateCell(cell);
    }

    setColor(idx, color) {
        const cell = this.getCell(idx);
        if (!cell) return;

        if (!cell.colors.includes(color)) {
            cell.colors.push(color);
            cell.colors.sort();
        }
        this.updateCell(cell);
    }

    unsetColor(idx, color) {
        const cell = this.getCell(idx);
        if (!cell) return;

        const i = cell.colors.indexOf(color);
        if (i !== -1) {
            cell.colors.splice(i, 1);
            cell.colors.sort();
        }
        this.updateCell(cell);
    }

    toggleColor(idx, color, forceSet = false) {
        const cell = this.getCell(idx);
        if (!cell) return;

        const i = cell.colors.indexOf(color);
        if (i !== -1) {
            if (!forceSet) {
                cell.colors.splice(i, 1);
            }
        } else {
            cell.colors.push(color);
        }
        cell.colors.sort();
        this.updateCell(cell);
    }

    // --- Region-wide operations ---

    setValues(region, value, fixed = false) {
        console.log("setValues", region, value, fixed);
        region.forEach(idx => {
            if (idx instanceof CellIdx) {
                this.setValue(idx, value, fixed);
            }
        });
    }

    unsetValues(region) {
        console.log("unsetValues", region);
        region.forEach(idx => {
            if (idx instanceof CellIdx) {
                this.setValue(idx, null, false);
            }
        });
    }

    toggleValues(region, value, fixed = false) {
        console.log("", region, value, fixed);
        // smart‐toggle: if every cell already === value, clear all; else set all
        const cells = region.items.filter(idx => idx instanceof CellIdx).map(idx => this.getCell(idx)).filter(c => c);
        const allHave = cells.every(c => c.value === value && (value === null || c.fixed === fixed));

        cells.forEach(cell => {
            const idx = cell.idx;
            if (allHave) {
                this.setValue(idx, null, false);
            } else {
                this.setValue(idx, value, fixed);
            }
        });
    }

    setCandidates(region, candidate, centered = false) {
        region.forEach(idx => {
            if (idx instanceof CellIdx) {
                this.setCandidate(idx, candidate, centered);
            }
        });
    }

    unsetCandidates(region, candidate, centered = false) {
        region.forEach(idx => {
            if (idx instanceof CellIdx) {
                this.unsetCandidate(idx, candidate, centered);
            }
        });
    }

    toggleCandidates(region, candidate, centered = false) {
        // smart‐toggle across region
        const cells = region.items.filter(idx => idx instanceof CellIdx).map(idx => this.getCell(idx)).filter(c => c);
        const allHave = cells.every(c => {
            const list = centered ? c.centeredCandidates : c.ordinaryCandidates;
            return list.includes(candidate);
        });

        cells.forEach(cell => {
            const idx = cell.idx;
            if (allHave) {
                this.unsetCandidate(idx, candidate, centered);
            } else {
                this.setCandidate(idx, candidate, centered);
            }
        });
    }

    setColors(region, color) {
        region.forEach(idx => {
            if (idx instanceof CellIdx) {
                this.setColor(idx, color);
            }
        });
    }

    unsetColors(region, color) {
        region.forEach(idx => {
            if (idx instanceof CellIdx) {
                this.unsetColor(idx, color);
            }
        });
    }

    toggleColors(region, color, forceSet = false) {
        if (forceSet) {
            this.setColors(region, color);
            return;
        }

        const cells = region.items.filter(idx => idx instanceof CellIdx).map(idx => this.getCell(idx)).filter(c => c);
        const allHave = cells.every(c => c.colors.includes(color));

        cells.forEach(cell => {
            const idx = cell.idx;
            if (allHave) {
                this.unsetColor(idx, color);
            } else {
                this.setColor(idx, color);
            }
        });
    }


    getCell(cellIdx) {
        return this.cells.find(cell => cell.idx.equals(cellIdx));
    }

    resetContent() {
        for (const cell of this.cells) {
            cell.clear();
            this.updateCell(cell);
        }
    }

    setSolutionStyle(enabled = true) {
        this.useSolutionStyle = enabled;
        for (const cell of this.cells) {
            this.updateCell(cell);
        }
    }

    toggleStyle() {
        this.setSolutionStyle(!this.useSolutionStyle);
    }

    show() {
        if (this.grid) {
            this.grid.classList.remove("hidden");
        }
    }

    hide() {
        if (this.grid) {
            this.grid.classList.add("hidden");
        }
    }

    toggleVisibility() {
        if (this.grid) {
            this.grid.classList.toggle("hidden");
        }
    }

    isVisible() {
        return this.grid && !this.grid.classList.contains("hidden");
    }

    saveFixedCells() {
        return this.cells
            .filter(cell => cell.hasValue() && cell.fixed)
            .map(cell => ({
                r: cell.idx.r,
                c: cell.idx.c,
                value: cell.value
            }));
    }

    loadFixedCells(data) {
        for (const { r, c, value } of data) {
            console.log("loadFixedCells", r, c, value);
            let cell_idx = new CellIdx(r, c);
            this.setValue(cell_idx, value, true);
        }
    }
}
