export class BoardRenderer {
    constructor(canvas, gridSize, paddingRatio) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.gridSize = gridSize;
        this.paddingRatio = paddingRatio;

        // Map: name → { fn, layer }
        this.drawLayers = new Map();
        this.dpr = window.devicePixelRatio || 1;
    }

    setup(container) {
        const size = Math.floor(Math.min(container.clientWidth, container.clientHeight));
        const dpr = this.dpr;

        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = size + "px";
        this.canvas.style.height = size + "px";

        // this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale all drawing

        this.rawPadding = Math.round(size * this.paddingRatio);
        const boardSize = size - 2 * this.rawPadding;

        this.cellSizeCSS = Math.floor(boardSize / this.gridSize);
        this.cellSizeCTX = this.cellSizeCSS * dpr;
        this.dpr = dpr;
        this.usedSize = this.cellSizeCSS * this.gridSize;
        this.usedSizeCTX = this.usedSize * dpr;
        const leftover = boardSize - this.usedSize;
        this.gridOffset = this.rawPadding + Math.floor(leftover / 2);
        this.gridOffsetCTX = this.gridOffset * dpr;
    }


    addRenderCall(name, fn, layer = 0) {
        this.drawLayers.set(name, { fn, layer }); // Add or replace
    }

    removeRenderCall(name) {
        this.drawLayers.delete(name);
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();

        this._drawGrid();

        const drawEntries = Array.from(this.drawLayers.values());
        drawEntries.sort((a, b) => a.layer - b.layer); // Sort by layer

        for (const { fn } of drawEntries) {
            fn(ctx);
        }

        ctx.restore();
    }

    _drawGrid() {
        const ctx       = this.ctx;
        const offset    = this.gridOffsetCTX;
        const size      = this.gridSize;
        const cellSize  = this.cellSizeCTX;

        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        for (let i = 0; i <= size; i++) {
            const pos = offset + i * cellSize;

            ctx.beginPath();
            ctx.moveTo(offset, pos);
            ctx.lineTo(offset + this.usedSizeCTX, pos);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(pos, offset);
            ctx.lineTo(pos, offset + this.usedSizeCTX);
            ctx.stroke();
        }

        // bold outline
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(offset, offset, this.usedSizeCTX, this.usedSizeCTX);
    }

    triggerRender() {
        requestAnimationFrame(() => this.render());
    }

    getCellSize() { return this.cellSizeCSS; }
    getCellSizeCTX() { return this.cellSizeCTX; }
    getPadding() { return this.rawPadding; }
    getContext() { return this.ctx; }

    getCellTopLeft(r, c) {
        return {
            x: this.gridOffset + c * this.cellSizeCSS,
            y: this.gridOffset + r * this.cellSizeCSS
        };
    }
    getCellTopLeftCTX(r, c) {
        return {
            x: this.gridOffsetCTX + c * this.cellSizeCTX,
            y: this.gridOffsetCTX + r * this.cellSizeCTX
        };
    }

    getUsedSize() {
        return this.usedSize;
    }

    getGridOffset() {
        return this.gridOffset;
    }

    getDPR() {
        return this.dpr;
    }
}
