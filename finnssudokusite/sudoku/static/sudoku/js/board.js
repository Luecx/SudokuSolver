export const Board = (() => {
    const gridSize = 9;
    const paddingRatio = 0.1;

    let canvas, ctx, container, grid, hintLayer;
    let gridEnabled = true;
    const handlers = {};
    let currentHandler = null;

    let edgeHints = [];
    let cornerHints = [];
    let edgeHintClick = null;
    let cornerHintClick = null;

    function initBoard() {
        container = document.querySelector(".board-container");
        canvas = document.getElementById("board-canvas");
        ctx = canvas.getContext("2d");
        grid = document.getElementById("sudoku-board");

        // Optional: if #sudoku-board has no class
        grid.classList.add("board");

        // DOM layer for hints
        hintLayer = document.createElement("div");
        hintLayer.style.position = "absolute";
        hintLayer.style.top = "0";
        hintLayer.style.left = "0";
        hintLayer.style.width = "100%";
        hintLayer.style.height = "100%";
        hintLayer.style.zIndex = "2";
        hintLayer.style.pointerEvents = "none";
        container.appendChild(hintLayer);

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        generateCells();
    }

    function generateCells() {
        grid.innerHTML = "";
        const cellSize = getCellSize();

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;

                grid.appendChild(cell);
            }
        }

        grid.addEventListener("click", (e) => {
            if (!gridEnabled) return;
            const cell = e.target.closest(".cell");
            if (!cell) return;
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            click(r, c);
        });
    }

    function resizeCanvas() {
        const size = Math.floor(Math.min(container.clientWidth, container.clientHeight));
        canvas.width = size;
        canvas.height = size;

        const padding = getPadding();
        const boardSize = size - 2 * padding;
        grid.style.width = `${boardSize}px`;
        grid.style.height = `${boardSize}px`;
        grid.style.top = `${padding}px`;
        grid.style.left = `${padding}px`;

        updateHintDots();
        render();
    }

    function click(r, c) {
        if (currentHandler?.onClickCreating) {
            currentHandler.onClickCreating(r, c);
            render();
        }
    }

    function render() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const handler of Object.values(handlers)) {
            handler.renderAll?.(ctx);
        }

        currentHandler?.renderCreationOverlay?.(ctx);
    }

    function getPadding() {
        return Math.round(canvas.width * paddingRatio);
    }

    function getCellSize() {
        return Math.floor((canvas.width * (1 - 2 * paddingRatio)) / gridSize);
    }

    function getCellTopLeft(r, c) {
        const step = getCellSize();
        const pad = getPadding();
        return { x: Math.round(pad + c * step), y: Math.round(pad + r * step) };
    }

    function getCellCorners(r, c) {
        const tl = getCellTopLeft(r, c);
        const s = getCellSize();
        return {
            topLeft: { x: tl.x, y: tl.y },
            topRight: { x: tl.x + s, y: tl.y },
            bottomLeft: { x: tl.x, y: tl.y + s },
            bottomRight: { x: tl.x + s, y: tl.y + s }
        };
    }

    function registerHandler(handler) {
        handlers[handler.name] = handler;
        handler.onRegister?.();
    }

    function startHandler(name) {
        stopHandler();
        currentHandler = handlers[name];
        currentHandler?.onStartCreating?.();
        render();
    }

    function stopHandler() {
        currentHandler?.onFinishedCreating?.();
        currentHandler = null;
        render();
    }

    function getCurrentHandlerName() {
        return currentHandler?.name || null;
    }

    function disableMainGrid() {
        gridEnabled = false;
        updateGridClass();
    }

    function enableMainGrid() {
        gridEnabled = true;
        updateGridClass();
    }

    function updateGridClass() {
        if (!grid) return;
        grid.classList.toggle("disabled", !gridEnabled);
        grid.querySelectorAll(".cell").forEach(cell =>
            cell.classList.toggle("disabled", !gridEnabled)
        );
    }

    function showEdgeHints(pairs, onClick) {
        edgeHints = pairs;
        edgeHintClick = onClick;
        updateHintDots();
    }

    function hideEdgeHints() {
        edgeHints = [];
        edgeHintClick = null;
        updateHintDots();
    }

    function showCornerHints(list, onClick) {
        cornerHints = list;
        cornerHintClick = onClick;
        updateHintDots();
    }

    function hideCornerHints() {
        cornerHints = [];
        cornerHintClick = null;
        updateHintDots();
    }

    function updateHintDots() {
        if (!hintLayer) return;
        hintLayer.innerHTML = "";
        const s = getCellSize();

        // Edge hints
        for (const [a, b] of edgeHints) {
            const ax = getCellTopLeft(a.r, a.c);
            const bx = getCellTopLeft(b.r, b.c);
            const cx = (ax.x + bx.x) / 2 + s / 2;
            const cy = (ax.y + bx.y) / 2 + s / 2;

            const dot = document.createElement("div");
            dot.className = "hint-dot";
            dot.style.left = `${cx}px`;
            dot.style.top = `${cy}px`;
            dot.onclick = () => edgeHintClick?.(a.r, a.c, b.r, b.c);
            hintLayer.appendChild(dot);
        }

        // Corner hints
        for (const { r, c } of cornerHints) {
            const tl = getCellTopLeft(r, c);
            const cx = tl.x;
            const cy = tl.y;

            const dot = document.createElement("div");
            dot.className = "hint-dot";
            dot.style.left = `${cx}px`;
            dot.style.top = `${cy}px`;
            dot.onclick = () => cornerHintClick?.(r, c);
            hintLayer.appendChild(dot);
        }
    }

    return {
        initBoard,
        getCellTopLeft,
        getCellCorners,
        getPadding,
        getCellSize,
        getCanvasContext: () => ctx,
        registerHandler,
        startHandler,
        stopHandler,
        getCurrentHandlerName,
        disableMainGrid,
        enableMainGrid,
        showEdgeHints,
        hideEdgeHints,
        showCornerHints,
        hideCornerHints,
        render
    };
})();
