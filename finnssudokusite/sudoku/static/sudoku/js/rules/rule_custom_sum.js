import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class CustomSumHandler extends RuleTypeHandler {
    constructor(board) {
        super("Custom Sum", board);
        this.tag = "Custom-Sum";
        this.can_create_rules = true;
        this.sumColors = new Map();
        this.usedColors = new Set();
    }

    defaultRules() {
        return [];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: "Line Path"
            },
            {
                key: "color",
                type: "hidden",
                label: "Line Color",
                default: ""
            },
            {
                key: "sum",
                type: "number",
                label: "Sum along the line",
                default: 10,
                min: 1,
                max: 999,
            }
        ];
    }

    getDescriptionHTML() {
        return `The values inside the cells that allign with the line must sum up to the target sum.`;
    }

    getDescriptionPlayHTML() {
        return `In <b>Custom Sum Sudoku</b> the numbers in cells crossed by a line must add up to 
                the <b>target sum</b> shown on that line. Lines of the <b>same color</b> share the same target sum.`;
    }

    render(rule, ctx) {
        if (!this.board) return;

        const path = rule.fields.region;
        if (!path || path.items.length < 2) return; // Need at least 2 cells to draw

        const s = this.board.getCellSizeCTX();
        const half = s / 2;

        const sum = rule.fields.sum;

        // get or create color for this sum
        if (!this.sumColors.has(sum)) {
            const newColor = this.getRandomColor();
            this.sumColors.set(sum, newColor);
        }

        // update the rule's color if it doesn't match the sum's assigned color
        if (rule.fields.color !== this.sumColors.get(sum)) {
            rule.fields.color = this.sumColors.get(sum);
        }

        ctx.save();
        ctx.strokeStyle = rule.fields.color;
        ctx.lineWidth = s * 0.2; // 20% of cell size
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const { x, y } = this.board.getCellTopLeftCTX(path.items[0].r, path.items[0].c);
        ctx.beginPath();
        ctx.moveTo(x + half, y + half);

        for (let i = 1; i < path.items.length; i++) {
            const { r, c } = path.items[i];
            const pt = this.board.getCellTopLeftCTX(r, c);
            ctx.lineTo(pt.x + half, pt.y + half);
        }

        ctx.stroke();

        // calculate the middle point of the line
        const middleIndex = Math.floor(path.items.length / 2);
        let middlePoint;

        if (path.items.length % 2 === 0) {
            // even number of cells - average between two middle points
            const point1 = path.items[middleIndex - 1];
            const point2 = path.items[middleIndex];
            
            const pt1 = this.board.getCellTopLeftCTX(point1.r, point1.c);
            const pt2 = this.board.getCellTopLeftCTX(point2.r, point2.c);
            
            middlePoint = {
                x: (pt1.x + pt2.x) / 2 + half,
                y: (pt1.y + pt2.y) / 2 + half
            };
        } else {
            // odd number of cells - use the middle cell
            const point = path.items[middleIndex];
            const pt = this.board.getCellTopLeftCTX(point.r, point.c);
            middlePoint = { x: pt.x + half, y: pt.y + half };
        }

        // draw sum text
        ctx.fillStyle = "black";
        ctx.font = `${s * 0.18}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sum.toString(), middlePoint.x, middlePoint.y);

        ctx.restore();
    }

    getRandomColor() {
        let color;
        do {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            color = `rgba(${r}, ${g}, ${b}, 0.3)`;
        } while (this.usedColors.has(color));

        this.usedColors.add(color);
        return color;
    }
}