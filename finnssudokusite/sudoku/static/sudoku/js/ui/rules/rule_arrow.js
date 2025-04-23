import {RuleTypeHandler} from "../board_rule.js";
import {RuleType} from "../board_ruleTypes.js";

export function setupArrowRule(board) {
    const handler = new RuleTypeHandler("arrow", board);
    handler.label = "Arrow";
    handler.tag  =  "Arrow";
    handler.rule_type = RuleType.MULTI_CLICK_MANY;

    let currentArrow = null;

    handler.onStartCreating = () => {
        // board.saveInteractionState();
        // board.enableClickable();
        // board.enableSelectable();
        // board.enableDraggable();
        currentArrow = { cells: [] };
    };

    function maybeAddCell(cell) {
        const r = parseInt(cell.r);
        const c = parseInt(cell.c);
        const exists = currentArrow.cells.some(pt => pt.r === r && pt.c === c);

        if (!exists) {
            currentArrow.cells.push({ r, c });
            board.render();
        }
    }

    handler.onCellClick = (cell) => {
        if (!currentArrow) return;
        maybeAddCell(cell);
    };

    handler.onCellDragNewCell = (cell) => {
        if (!currentArrow) return;
        maybeAddCell(cell);
    };

    handler.onFinishedCreating = () => {
        if (currentArrow?.cells.length >= 2) {
            handler.add({ type: "arrow", cells: [...currentArrow.cells] });
            board.render();
        }
        currentArrow = null;
        board.restoreInteractionState();
    };

    handler.ruleToText = (rule) => {
        if (!rule.cells || rule.cells.length < 2) return "Arrow (incomplete)";
        return rule.cells.map(pt => `(${pt.r},${pt.c})`).join(" → ");
    };

    handler.renderAll = (ctx) => {
        const drawArrow = (cells, color, dashed) => {
            if (!cells || cells.length === 0) return;

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            const cellSize = board.getCellSize();
            const r = cellSize * 0.4;

            const base = board.getCellTopLeft(cells[0].r, cells[0].c);
            const baseX = base.x + cellSize / 2;
            const baseY = base.y + cellSize / 2;

            // Draw base circle
            ctx.beginPath();
            ctx.arc(baseX, baseY, r, 0, Math.PI * 2);
            ctx.stroke();

            // Draw path and arrowhead if 2+ points
            if (cells.length >= 2) {
                if (dashed) ctx.setLineDash([4, 4]);

                const next = board.getCellTopLeft(cells[1].r, cells[1].c);
                const nextX = next.x + cellSize / 2;
                const nextY = next.y + cellSize / 2;
                const dx = nextX - baseX;
                const dy = nextY - baseY;
                const mag = Math.hypot(dx, dy);
                const offsetX = (dx / mag) * r;
                const offsetY = (dy / mag) * r;

                ctx.beginPath();
                ctx.moveTo(baseX + offsetX, baseY + offsetY);

                for (let i = 1; i < cells.length; i++) {
                    const pt = board.getCellTopLeft(cells[i].r, cells[i].c);
                    ctx.lineTo(pt.x + cellSize / 2, pt.y + cellSize / 2);
                }

                ctx.stroke();
                ctx.setLineDash([]);

                const last = board.getCellTopLeft(cells.at(-1).r, cells.at(-1).c);
                const prev = board.getCellTopLeft(cells.at(-2).r, cells.at(-2).c);
                drawArrowHead(ctx, prev, last, cellSize);
            }

            ctx.restore();
        };

        for (const rule of handler.rules) {
            drawArrow(rule.cells, "#aaa", false);
        }

        if (currentArrow?.cells.length >= 1) {
            drawArrow(currentArrow.cells, "#2196F3", true);
        }
    };

    function drawArrowHead(ctx, from, to, cellSize) {
        const size = cellSize * 0.3;
        const fx = from.x + cellSize / 2;
        const fy = from.y + cellSize / 2;
        const tx = to.x + cellSize / 2;
        const ty = to.y + cellSize / 2;

        const angle = Math.atan2(ty - fy, tx - fx);

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(
            tx - size * Math.cos(angle - 0.4),
            ty - size * Math.sin(angle - 0.4)
        );
        ctx.moveTo(tx, ty);
        ctx.lineTo(
            tx - size * Math.cos(angle + 0.4),
            ty - size * Math.sin(angle + 0.4)
        );
        ctx.stroke();
    }

    return handler;
}
