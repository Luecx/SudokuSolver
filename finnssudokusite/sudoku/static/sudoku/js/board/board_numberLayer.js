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

        this.colorMap = [
            "rgba(230,  25,  75, 0.5)", "rgba( 60, 180,  75, 0.5)", "rgba(255, 225,  25, 0.5)", 
            "rgba( 67,  99, 216, 0.5)", "rgba(245, 130,  49, 0.5)", "rgba(145,  30, 180, 0.5)",
            "rgba( 70, 240, 240, 0.5)", "rgba(240,  50, 230, 0.5)", "rgba(188, 246,  12, 0.5)",
        ];
    }

    hasValue() {
        return this.value !== null;
    }

    /*
     *  Compression right now isnt really for board sizes greater 9
     */

    // returns the value, colors and candidates as a compressed string
    compressedString() {
        const val = this.value ? this.value : null;

        // compress candidates array ([1,2,3,5,6] -> "1-356")
        const compressArray = (arr) => {
            if (!arr.length) return '';
            let compressed = '';
            let start = arr[0], prev = arr[0];
            
            for (let i = 1; i <= arr.length; i++) {
                const current = arr[i];
                if (current === prev + 1) {
                    prev = current;
                } else {
                    // Only use range notation if range is at least 3 numbers
                    if (prev - start >= 2)
                        compressed += `${start}-${prev}`;
                    else if (prev === start)
                        compressed += start;
                    else
                        compressed += `${start}${prev}`; // Adjacent pairs like 2,3 become "23" not "2-3"
                    
                    start = prev = current;
                }
            }
            return compressed;
        };

        const ord = compressArray(this.ordinaryCandidates.sort((a, b) => a - b));        
        const cen = compressArray(this.centeredCandidates.sort((a, b) => a - b));
        // colors represented as indices
        const colors = compressArray(
            this.colors.map(c => this.colorMap.indexOf(c) + 1).sort((a, b) => a - b)
        );

        let compressed = `r${this.idx.r};c${this.idx.c}`;

        if (val)
            compressed += `;n${val}`;
        if (ord)
            compressed += `;o${ord}`;
        if (cen)
            compressed += `;z${cen}`; // z = zentriert
        if (colors)
            compressed += `;f${colors}`; // f = farbe

        // format: "c,ord,cen,colors"
        return compressed;
    }

    fromCompressedString(str) {
        if (!str) return;

        const splitted = str.split(";");

        const extract = (prefix) => {
            const part = splitted.find(s => s[0] === prefix);
            return part ? part.slice(1) : null;
        };

        const expandCompressedArray = (compressed) => {
            if (!compressed) return [];
            let result = [];
            let i = 0;
            while (i < compressed.length) {
                const c = compressed[i];
                if (/^\d$/.test(c)) {
                    result.push(parseInt(c, 10));
                } else if (c === "-") {
                    const last = result[result.length - 1];
                    const next = parseInt(compressed[i + 1], 10);
                    for (let j = last + 1; j <= next; j++) result.push(j);
                    i++;
                }
                i++;
            }
            return result.sort((a, b) => a - b);
        };

        this.idx.r = parseInt(extract("r"), 10);
        this.idx.c = parseInt(extract("c"), 10);

        const value = extract("n");
        if (value) 
            this.value = parseInt(value, 10);
        
        const ord = extract("o");
        const cen = extract("z");
        const colors = extract("f");

        this.ordinaryCandidates = expandCompressedArray(ord);
        this.centeredCandidates = expandCompressedArray(cen);

        if (colors) {
            const colorIndices = expandCompressedArray(colors);
            this.colors = colorIndices.map(i => this.colorMap[i - 1]);
        } else {
            this.colors = [];
        }
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

    isSolved() {
        return this.cells.every(cell => {
            return cell.hasValue();
        });
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

    loadState(state) {
        for (let i = 0; i < state.length; i++) 
        {
            this.cells[i].fromCompressedString(state[i]);
            this.updateCell(this.cells[i]);
        }
    }

    getState() {
        let state = [];
        for (const cell of this.cells) 
            state.push(cell.compressedString());
        return state;
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