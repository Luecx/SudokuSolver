import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class DiagonalSumHandler extends RuleTypeHandler {
    constructor(board) {
        super("Diagonal Sum", board);
        this.tag = "DiagonalSum";
        this.can_create_rules = true;
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
                regionType: RegionType.DIAGONAL,
                selectionMode: SelectionMode.MULTIPLE,
                label: "Diagonal"
            },
            {
                key: "sum",
                type: "number",
                min: 1,
                max: 81,
                default: 21,
                label: "Diagonal Sum"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        In a Diagonal Sum constraint, the digits along a specific diagonal must add up to a specified total.
        Diagonals can be in either the ↘︎ or ↙︎ direction.
        `;
    }

    getDescriptionPlayHTML() {
        return `In a <b>Diagonal Sum</b> puzzle, the marked diagonal must sum to the given total. `;
    }

    render(rule, ctx) {
        const region = rule.fields.region;
        const sum = rule.fields.sum;

        if (!region || sum == null) return;

        const size = this.board.getGridSize();
        const s = this.board.getCellSizeCTX();
        const arrowLength = s * 0.4;

        ctx.save();
        ctx.font = `${s * 0.3}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#333";
        ctx.fillStyle = "#333";

        for (const diag of region.items) {

            let target_x = 0
            let target_y = 0
            let dir      = ''

            if (diag.type === 'main') {

                if (diag.index <= 0) {
                    let tl = this.board.getCellTopLeftCTX(-diag.index, 0)
                    target_x = tl.x
                    target_y = tl.y
                    dir = "botright"
                } else {
                    let tl = this.board.getCellTopLeftCTX(size - diag.index, size)
                    target_x = tl.x
                    target_y = tl.y
                    dir = "topleft"
                }
            }
            else {
                if (diag.index < 0) {
                    let tl = this.board.getCellTopLeftCTX(0, size + diag.index,)
                    target_x = tl.x
                    target_y = tl.y
                    dir = "botleft"
                } else {
                    let tl = this.board.getCellTopLeftCTX(size, diag.index)
                    target_x = tl.x
                    target_y = tl.y
                    dir = "topright"
                }
            }

            let dx = 0, dy = 0;
            switch (dir) {
                case "botright": dx = 1; dy = 1; break;
                case "topleft":  dx = -1; dy = -1; break;
                case "botleft":  dx = -1; dy = 1; break;
                case "topright": dx = 1; dy = -1; break;
            }

            const base_x = target_x - dx * arrowLength;
            const base_y = target_y - dy * arrowLength;

            ctx.fillStyle = "black";
            // Draw arrow shaft
            ctx.beginPath();
            ctx.moveTo(base_x, base_y);
            ctx.lineTo(target_x, target_y);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(dy, dx);
            const headLength = s * 0.2;
            const leftAngle = angle + Math.PI / 6;
            const rightAngle = angle - Math.PI / 6;

            const leftX = target_x - headLength * Math.cos(leftAngle);
            const leftY = target_y - headLength * Math.sin(leftAngle);
            const rightX = target_x - headLength * Math.cos(rightAngle);
            const rightY = target_y - headLength * Math.sin(rightAngle);

            ctx.beginPath();
            ctx.moveTo(target_x, target_y);
            ctx.lineTo(leftX, leftY);
            ctx.lineTo(rightX, rightY);
            ctx.closePath();
            ctx.fill();

            // fill the arrow backgroiund

            // Draw the sum label above the arrow base
            const label_x = base_x - dx * s * 0.15;
            const label_y = base_y - dy * s * 0.15;

            const text = sum.toString();

            ctx.fillStyle = "#333";
            ctx.fillText(text, label_x, label_y);
        }

        ctx.restore();
    }

}
