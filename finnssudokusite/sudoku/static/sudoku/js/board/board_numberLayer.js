import { NO_NUMBER } from "../number/number.js";
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

        this.colorMap = [
            "rgba(230,  25,  75, 0.2)", "rgba( 60, 180,  75, 0.2)", "rgba(255, 225,  25, 0.2)",
            "rgba( 67,  99, 216, 0.2)", "rgba(245, 130,  49, 0.2)", "rgba(145,  30, 180, 0.2)",
            "rgba( 70, 240, 240, 0.2)", "rgba(240,  50, 230, 0.2)", "rgba(188, 246,  12, 0.2)",
        ];
    }

    hasValue() {
        return this.value !== null;
    }

    hasCandidates() {
        return this.ordinaryCandidates.length > 0 || this.centeredCandidates.length > 0;
    }

    hasColors() {
        return this.colors.length > 0;
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

    allCellsFilled() {
        return this.cells.every(cell => {
            return cell.hasValue();
        });
    }

    loadState(state) {
        for (const cellState of state) {
            // Extract r and c from the compressed string format "r0;c0;..."
            const splitted = cellState.split(';');
            const r = parseInt(splitted[0].slice(1));
            const c = parseInt(splitted[1].slice(1));

            const cell = this.cells.find(cell => cell.idx.r === r && cell.idx.c === c);
            if (cell) {
                cell.fromCompressedString(cellState);
                this.updateCell(cell);
            }
        }

        this.board.historyManager.saveInitialState();
    }

    getState() {
        let state = [];
        for (const cell of this.cells) {
            // only store cells that have a value, candidates or colors and are not fixed
            if (!(cell.hasValue() || cell.hasCandidates() || cell.hasColors()))
                continue;
            state.push(cell.compressedString());
        }
        return state;
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
        return this.cells.reduce((s, c) => {
            if (c.fixed && c.value != null) s.set(c.idx, c.value);
            return s;
        }, new Solution(this.board.gridSize));
    }

    getUserNumbers() {
        return this.cells.reduce((s, c) => {
            if (!c.fixed && c.value != null) s.set(c.idx, c.value);
            return s;
        }, new Solution(this.board.gridSize));
    }

    getAllNumbers() {
        return this.cells.reduce((s, c) => {
            if (c.value != null) s.set(c.idx, c.value);
            return s;
        }, new Solution(this.board.gridSize));
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
        const candidateColor = this.useSolutionStyle ? "red" : "#111111";
        const cellSize = this.board.getCellSize();
        const candidateSize = (cellSize * 0.7) / 3;

        for (let n of candidateOrder) {
            const candidate = document.createElement("div");
            candidate.className = "candidate-cell";
            candidate.style.fontSize = `${candidateSize * 0.8}px`;
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
        layer.style.display = "none";
        layer.className = "centered-candidate-layer";

        const count = cell.centeredCandidates.length;
        if (count === 0) return;

        // Define scale factors (relative to cell size)
        const sizeMap = {
            1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0,
            5: 0.9,
            6: 0.8,
            7: 0.7,
            8: 0.6,
            9: 0.5
        };

        const cellSize = this.board.getCellSize() * 0.3;
        const scale = sizeMap[Math.min(count, 9)] ?? 0.75;
        const fontSize = cellSize * scale;

        layer.style.fontSize = `${fontSize}px`;
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
            if (fixed === true) return true;
            return !c.fixed;
        });

        const allHave = filtered.every(c => c.value === value && (value === null || c.fixed === fixed));

        filtered.forEach(c => {
            this.setValue(c.idx, allHave ? null : value, fixed);
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
        this.board.historyManager.saveInitialState();
    }

    getCellsByValue(value) {
        return this.cells.filter(c => c.value === value && c.value !== null)
            .map(c => c.idx);
    }
}
