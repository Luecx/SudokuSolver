import {RuleTypeHandler} from "../board_rule.js";
import {RuleType} from "../board_ruleTypes.js";
export function setupParityLine(board) {
    const handler = new RuleTypeHandler("parity", board);
    handler.label = "Parity Line";
    handler.tag  =  "Parity";

    let currentLine = [];

    handler.rule_type = RuleType.MULTI_CLICK_MANY;

    handler.onStartCreating = () => {
        // board.saveInteractionState();
        // board.enableClickable();
        // board.enableSelectable();
        // board.enableDraggable();
        currentLine = [];
    };

    function maybeAddCell(cell) {
        const r = parseInt(cell.r);
        const c = parseInt(cell.c);
        const exists = currentLine.some(pt => pt.r === r && pt.c === c);

        if (!exists) {
            currentLine.push({ r, c });
            board.render();
        }
    }

    handler.onCellClick = (cell) => {
        maybeAddCell(cell);
    };

    handler.onCellDragNewCell = (cell) => {
        maybeAddCell(cell);
    };

    handler.onFinishedCreating = () => {
        if (currentLine.length > 1) {
            handler.add({ type: "parity", cells: [...currentLine] });
        }
        currentLine = [];
        board.restoreInteractionState();
        board.render();
    };

    handler.ruleToText = (rule) =>
        "Parity Line: " + rule.cells.map(pt => `(${pt.r},${pt.c})`).join(" → ");

    handler.renderAll = (ctx) => {
        const cellSize = board.getCellSize();
        ctx.save();

        const drawLine = (cells, style) => {
            if (!cells || cells.length < 2) return;

            ctx.lineWidth = style.lineWidth || 2;
            ctx.strokeStyle = style.strokeStyle || "green";
            ctx.globalAlpha = style.alpha ?? 1;
            ctx.lineCap = style.cap || "butt";
            if (style.dashed) ctx.setLineDash([4, 4]);

            ctx.beginPath();
            for (let i = 0; i < cells.length; i++) {
                const pt = board.getCellTopLeft(cells[i].r, cells[i].c);
                const cx = pt.x + cellSize / 2;
                const cy = pt.y + cellSize / 2;
                if (i === 0) ctx.moveTo(cx, cy);
                else ctx.lineTo(cx, cy);
            }
            ctx.stroke();

            ctx.setLineDash([]); // Reset dash
            ctx.globalAlpha = 1;
        };

        for (const rule of handler.rules) {
            drawLine(rule.cells, {
                lineWidth: 12,
                strokeStyle: "rgba(0, 100, 0, 1)",
                alpha: 0.35,
                cap: "round"
            });
        }

        if (currentLine.length >= 1) {
            drawLine(currentLine, {
                lineWidth: 2,
                strokeStyle: "green",
                dashed: true
            });
        }

        ctx.restore();
    };

    return handler;
}
