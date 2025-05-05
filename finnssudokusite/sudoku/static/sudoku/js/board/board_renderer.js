export class BoardRenderer {
    constructor(canvas, gridSize, paddingRatio) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.gridSize = gridSize;
        this.paddingRatio = paddingRatio;

        // Map: name → { fn, layer }
        this.drawLayers = new Map();
    }

    setup(container) {
        const size = Math.floor(Math.min(container.clientWidth, container.clientHeight));
        this.canvas.width = size;
        this.canvas.height = size;

        this.rawPadding = Math.round(size * this.paddingRatio);
        const boardSize = size - 2 * this.rawPadding;

        this.cellSize = Math.floor(boardSize / this.gridSize);
        this.usedSize = this.cellSize * this.gridSize;
        const leftover = boardSize - this.usedSize;
        this.gridOffset = this.rawPadding + Math.floor(leftover / 2);
    }

    addRenderCall(name, fn, layer = 0) {
        console.log("added render call", name, layer);
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
        const ctx = this.ctx;
        const offset = this.gridOffset;
        const size = this.gridSize;
        const cellSize = this.cellSize;

        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        for (let i = 0; i <= size; i++) {
            const pos = offset + i * cellSize;

            ctx.beginPath();
            ctx.moveTo(offset, pos);
            ctx.lineTo(offset + this.usedSize, pos);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(pos, offset);
            ctx.lineTo(pos, offset + this.usedSize);
            ctx.stroke();
        }
    }

    triggerRender() {
        requestAnimationFrame(() => this.render());
    }

    getCellSize() { return this.cellSize; }
    getPadding() { return this.rawPadding; }
    getContext() { return this.ctx; }

    getCellTopLeft(r, c) {
        return {
            x: this.gridOffset + c * this.cellSize,
            y: this.gridOffset + r * this.cellSize
        };
    }

    getUsedSize() {
        return this.usedSize;
    }

    getGridOffset() {
        return this.gridOffset;
    }

    getCellCorners(r, c) {
        const topLeft = this.getCellTopLeft(r, c);
        const cs = this.cellSize;
        return {
            topLeft,
            topRight: { x: topLeft.x + cs, y: topLeft.y },
            bottomLeft: { x: topLeft.x, y: topLeft.y + cs },
            bottomRight: { x: topLeft.x + cs, y: topLeft.y + cs }
        };
    }
}
