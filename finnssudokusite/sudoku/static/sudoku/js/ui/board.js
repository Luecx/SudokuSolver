import { getDefaultRuleHandlers } from "./rules.js";

export function createBoard(container, canvas, grid) {
    const gridSize = 9;
    const paddingRatio = 0.04;

    let ctx = canvas.getContext("2d");
    let hintLayer = null;

    let clickableEnabled = true;
    let selectableEnabled = true;
    let draggableEnabled = false;

    let savedInteractionState = null;

    const handlers = {};
    let currentHandler = null;

    let edgeHints = [];
    let cornerHints = [];
    let edgeHintClick = null;
    let cornerHintClick = null;

    let cellSize = 0;
    let usedSize = 0;
    let rawPadding = 0;
    let leftover = 0;
    let gridOffset = 0;

    let isDragging = false;
    let dragPath = [];
    let lastDragCell = null;

    const board = {
        initBoard,
        getCellTopLeft,
        getCellCorners,
        getAllHandlers,
        getPadding: () => rawPadding,
        getCellSize: () => cellSize,
        getCanvasContext: () => ctx,
        registerHandler,
        startHandler,
        stopHandler,
        getCurrentHandlerName: () => currentHandler?.name || null,

        enableClickable,
        disableClickable,
        enableSelectable,
        disableSelectable,
        enableDraggable,
        disableDraggable,
        saveInteractionState,
        restoreInteractionState,

        isClickableEnabled: () => clickableEnabled,
        isSelectableEnabled: () => selectableEnabled,
        isDraggableEnabled: () => draggableEnabled,
        isDragging: () => isDragging,
        getDraggingPath: () => [...dragPath],

        showEdgeHints,
        hideEdgeHints,
        showCornerHints,
        hideCornerHints,
        render
    };

    function initBoard() {
        grid.classList.add("board");

        hintLayer = document.createElement("div");
        hintLayer.style.position = "absolute";
        hintLayer.style.top = "0";
        hintLayer.style.left = "0";
        hintLayer.style.width = "100%";
        hintLayer.style.height = "100%";
        hintLayer.style.zIndex = "2";
        hintLayer.style.pointerEvents = "none";
        container.appendChild(hintLayer);

        const ruleHandlers = getDefaultRuleHandlers(board);
        ruleHandlers.forEach(registerHandler);

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
    }

    function generateCells() {
        grid.innerHTML = "";

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
        updateCellClass();

        grid.addEventListener("click", (e) => {
            const cell = e.target.closest(".cell.clickable");
            if (!cell || !clickableEnabled) return;
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            currentHandler?.onCellClick?.({r, c});
            render();
        });

        grid.addEventListener("mousedown", (e) => {
            if (!draggableEnabled || !selectableEnabled) return;
            const cell = e.target.closest(".cell");
            if (!cell) return;
            e.preventDefault();

            isDragging = true;
            dragPath = [];

            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            lastDragCell = `${r},${c}`;
            currentHandler?.onCellDragNewCell?.({r,c});
            dragPath.push({ r, c });
            render();
        });

        grid.addEventListener("mousemove", (e) => {
            if (!isDragging || !draggableEnabled || !selectableEnabled) return;
            const cell = e.target.closest(".cell");
            if (!cell) return;

            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            const key = `${r},${c}`;

            if (key !== lastDragCell) {
                lastDragCell = key;

                const alreadyInPath = dragPath.some(pt => pt.r === r && pt.c === c);
                if (!alreadyInPath) {
                    const newCell = { r, c };
                    dragPath.push(newCell);
                    currentHandler?.onCellDragNewCell?.(newCell); // ✅ trigger here
                    render();
                }
            }
        });


        window.addEventListener("mouseup", () => {
            if (!isDragging || !draggableEnabled) return;

            isDragging = false;
            lastDragCell = null;

            if (currentHandler?.onDragCreating && dragPath.length > 0) {
                currentHandler.onCellDrag([...dragPath]);
            }

            dragPath = [];
            render();
        });
    }

    function resizeCanvas() {
        const size = Math.floor(Math.min(container.clientWidth, container.clientHeight));
        canvas.width = size;
        canvas.height = size;

        rawPadding = Math.round(size * paddingRatio);
        const boardSize = size - 2 * rawPadding;

        cellSize = Math.floor(boardSize / gridSize);
        usedSize = cellSize * gridSize;
        leftover = boardSize - usedSize;
        gridOffset = rawPadding + Math.floor(leftover / 2);

        grid.style.width = `${usedSize}px`;
        grid.style.height = `${usedSize}px`;
        grid.style.top = `${gridOffset}px`;
        grid.style.left = `${gridOffset}px`;

        generateCells();
        updateHintDots();
        render();
    }

    function render() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        for (let i = 0; i <= 9; i += 9) {
            const pos = gridOffset + i * cellSize;
            ctx.beginPath();
            ctx.moveTo(gridOffset, pos);
            ctx.lineTo(gridOffset + usedSize, pos);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, gridOffset);
            ctx.lineTo(pos, gridOffset + usedSize);
            ctx.stroke();
        }

        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;
        for (let i = 1; i < 9; i++) {
            const pos = gridOffset + i * cellSize;
            ctx.beginPath();
            ctx.moveTo(gridOffset, pos);
            ctx.lineTo(gridOffset + usedSize, pos);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, gridOffset);
            ctx.lineTo(pos, gridOffset + usedSize);
            ctx.stroke();
        }

        ctx.restore();

        for (const handler of Object.values(handlers)) {
            handler.renderAll?.(ctx);
        }

        currentHandler?.renderCreationOverlay?.(ctx);
    }

    function getCellTopLeft(r, c) {
        return {
            x: gridOffset + c * cellSize,
            y: gridOffset + r * cellSize
        };
    }

    function getCellCorners(r, c) {
        const tl = getCellTopLeft(r, c);
        return {
            topLeft: { x: tl.x, y: tl.y },
            topRight: { x: tl.x + cellSize, y: tl.y },
            bottomLeft: { x: tl.x, y: tl.y + cellSize },
            bottomRight: { x: tl.x + cellSize, y: tl.y + cellSize }
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

    function enableClickable() {
        clickableEnabled = true;
        updateCellClass();
    }

    function disableClickable() {
        clickableEnabled = false;
        updateCellClass();
    }

    function enableSelectable() {
        selectableEnabled = true;
        updateCellClass();
    }

    function disableSelectable() {
        selectableEnabled = false;
        updateCellClass();
    }

    function enableDraggable() {
        draggableEnabled = true;
    }

    function disableDraggable() {
        draggableEnabled = false;
    }

    function saveInteractionState() {
        savedInteractionState = {
            clickable: clickableEnabled,
            selectable: selectableEnabled,
            draggable: draggableEnabled,
        };
    }

    function restoreInteractionState() {
        if (!savedInteractionState) return;
        clickableEnabled = savedInteractionState.clickable;
        selectableEnabled = savedInteractionState.selectable;
        draggableEnabled = savedInteractionState.draggable;
        updateCellClass();
    }

    function updateCellClass() {
        grid.querySelectorAll(".cell").forEach(cell => {
            cell.classList.toggle("clickable", clickableEnabled);
            cell.classList.toggle("selectable", selectableEnabled);
        });
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
        hintLayer.innerHTML = "";

        for (const [a, b] of edgeHints) {
            const ax = getCellTopLeft(a.r, a.c);
            const bx = getCellTopLeft(b.r, b.c);
            const cx = (ax.x + bx.x + cellSize) / 2;
            const cy = (ax.y + bx.y + cellSize) / 2;

            const dot = document.createElement("div");
            dot.className = "hint-dot";
            dot.style.left = `${cx}px`;
            dot.style.top = `${cy}px`;
            dot.onclick = () => edgeHintClick?.(a.r, a.c, b.r, b.c);
            hintLayer.appendChild(dot);
        }

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

    function getAllHandlers() {
        return Object.values(handlers);
    }

    return board;
}