import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { Region } from "../region/Region.js";
import { attachArrowSolverLogic } from "./rule_arrow_solver.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class ArrowHandler extends RuleTypeHandler {
    constructor(board) {
        super("Arrow", board);
        this.tag = "Arrow";
        this.can_create_rules = true;

        attachArrowSolverLogic(this);
    }

    defaultRules() {
        return [];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [
            { key: "base", type: "region", regionType: RegionType.CELLS, selectionMode: SelectionMode.MULTIPLE, label: "Arrow Base Cells" },
            { key: "path", type: "region", regionType: RegionType.CELLS, selectionMode: SelectionMode.MULTIPLE, label: "Arrow Path Cells" },
        ];
    }

    getRuleWarnings(rule) {
        let warnings = [];
        const base = rule.fields.base;
        const path = rule.fields.path;

        if (base && path && base.intersection(path).size > 0) {
            warnings.push("Base and path cells overlap.");
        }
        if (!base || base.size() === 0) {
            warnings.push("Base cells are empty.");
        }
        if (!path || path.size() === 0) {
            warnings.push("Path cells are empty.");
        }
        if (base && base.size() > 2) {
            warnings.push("Base cells should be 1 or 2.");
        }
        if (base && base.size() === 2) {
            const cells = base.items;
            if (cells[0].r !== cells[1].r && cells[0].c !== cells[1].c) {
                warnings.push("Base cells must be adjacent and in the same row or column.");
            }
        }

        return warnings;
    }

    getDescriptionHTML() {
        return `
        In an Arrow Sudoku, the digits along the path of the arrow sum to the digit in the circle at the base.
        `;
    }

    getDescriptionPlayHTML() {
        let desc = "In an <b>Arrow Sudoku</b>, the digits along the arrow path must sum to the value in the circle at the base.";
        for (const rule of this.rules) {
            const base = rule.fields.base;
            if (base?.size() === 2) {
                desc += " If the base has two cells, the <b>left or top cell is the tens digit</b> and the <b>right or bottom is the ones digit</b>.";
                break;
            }
        }
        return desc;
    }

    render(rule, ctx) {
        if (!this.board) return;

        const s = this.board.getCellSizeCTX();
        this._setupStyle(ctx, s);

        const base = rule.fields.base;
        const path = rule.fields.path;

        const baseCenters = this._renderBase(ctx, base);

        let pathInfo;
        let directionFromBase = null;

        if (baseCenters.length === 1) {
            directionFromBase = baseCenters[0];
        } else if (baseCenters.length === 2) {
            directionFromBase = {
                x: 0.5 * (baseCenters[0].x + baseCenters[1].x),
                y: 0.5 * (baseCenters[0].y + baseCenters[1].y),
            };
        }

        pathInfo = this._renderPath(ctx, path, directionFromBase);

        if (baseCenters.length > 0 && pathInfo.start) {
            this._connectBaseToPath(ctx, baseCenters, pathInfo.start, s);
        }
        if (pathInfo.prev && pathInfo.end) {
            this._drawArrowhead(ctx, pathInfo.prev, pathInfo.end, s);
        }
    }

    _setupStyle(ctx, cellSizeCtx) {
        ctx.save();
        ctx.lineWidth = cellSizeCtx / 40;
        ctx.strokeStyle = "rgba(100, 100, 100, 0.4)";
        ctx.fillStyle = "transparent";
        ctx.lineJoin = "round";
    }

    _renderBase(ctx, base) {
        const s = this.board.getCellSizeCTX();
        const half = s / 2;
        const radius = s * 0.45;
        const baseCenters = [];

        if (!base || base.items.length === 0) return baseCenters;

        for (const { r, c } of base.items) {
            const { x, y } = this.board.getCellTopLeftCTX(r, c);
            baseCenters.push({ x: x + half, y: y + half });
        }

        if (base.items.length === 1) {
            const { x, y } = this.board.getCellTopLeftCTX(base.items[0].r, base.items[0].c);
            ctx.beginPath();
            ctx.arc(x + half, y + half, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (base.items.length === 2) {
            const p1 = this.board.getCellTopLeftCTX(base.items[0].r, base.items[0].c);
            const p2 = this.board.getCellTopLeftCTX(base.items[1].r, base.items[1].c);

            const center1 = { x: p1.x + half, y: p1.y + half };
            const center2 = { x: p2.x + half, y: p2.y + half };

            const dx = center2.x - center1.x;
            const dy = center2.y - center1.y;
            const angle = Math.atan2(dy, dx);
            const length = Math.sqrt(dx * dx + dy * dy);

            ctx.translate(center1.x, center1.y);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, -radius);
            ctx.lineTo(length, -radius);
            ctx.arc(length, 0, radius, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(0, radius);
            ctx.arc(0, 0, radius, Math.PI / 2, -Math.PI / 2);
            ctx.closePath();
            ctx.stroke();

            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        return baseCenters;
    }

    _renderPath(ctx, path, fallbackDirection = null) {
        if (!path || path.items.length === 0) return { start: null, end: null, prev: null };

        const s = this.board.getCellSizeCTX();
        const half = s / 2;

        const { x, y } = this.board.getCellTopLeftCTX(path.items[0].r, path.items[0].c);
        const start = { x: x + half, y: y + half };

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);

        let prev = start;
        let end = start;

        if (path.items.length === 1 && fallbackDirection) {
            prev = fallbackDirection;
        } else {
            for (let i = 1; i < path.items.length; i++) {
                const { r, c } = path.items[i];
                const pt = this.board.getCellTopLeftCTX(r, c);
                const mid = { x: pt.x + half, y: pt.y + half };
                ctx.lineTo(mid.x, mid.y);
                prev = end;
                end = mid;
            }
        }
        ctx.stroke();

        return { start, end, prev };
    }

    _connectBaseToPath(ctx, baseCenters, pathStart, cellSize) {
        const radius = cellSize * 0.45;

        let closestPoint = null;

        if (baseCenters.length === 1) {
            const center = baseCenters[0];
            const dx = pathStart.x - center.x;
            const dy = pathStart.y - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                const ux = dx / dist;
                const uy = dy / dist;
                closestPoint = { x: center.x + ux * radius, y: center.y + uy * radius };
            } else {
                closestPoint = center;
            }
        } else if (baseCenters.length === 2) {
            const [p1, p2] = baseCenters;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / length;
            const uy = dy / length;

            const vx = pathStart.x - p1.x;
            const vy = pathStart.y - p1.y;
            const proj = vx * ux + vy * uy;

            if (proj < 0) {
                const dist = Math.sqrt(vx * vx + vy * vy);
                const dirX = vx / dist;
                const dirY = vy / dist;
                closestPoint = { x: p1.x + dirX * radius, y: p1.y + dirY * radius };
            } else if (proj > length) {
                const wx = pathStart.x - p2.x;
                const wy = pathStart.y - p2.y;
                const dist = Math.sqrt(wx * wx + wy * wy);
                const dirX = wx / dist;
                const dirY = wy / dist;
                closestPoint = { x: p2.x + dirX * radius, y: p2.y + dirY * radius };
            } else {
                const perpX = -uy;
                const perpY = ux;
                const sideOffset = (vx * perpX + vy * perpY > 0) ? 1 : -1;
                closestPoint = {
                    x: p1.x + ux * proj + perpX * radius * sideOffset,
                    y: p1.y + uy * proj + perpY * radius * sideOffset
                };
            }
        }

        if (closestPoint) {
            ctx.beginPath();
            ctx.moveTo(closestPoint.x, closestPoint.y);
            ctx.lineTo(pathStart.x, pathStart.y);
            ctx.stroke();
        }
    }

    _drawArrowhead(ctx, prev, end, cellSize) {
        const size = cellSize * 0.15;

        const dx = end.x - prev.x;
        const dy = end.y - prev.y;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - size * Math.cos(angle - Math.PI / 6),
            end.y - size * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - size * Math.cos(angle + Math.PI / 6),
            end.y - size * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }
}
