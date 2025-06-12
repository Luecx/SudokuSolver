import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class ChevronHandler extends RuleTypeHandler {
    constructor(board) {
        super("Chevron", board);
        this.tag = "Chevron";
        this.can_create_rules = false;
    }

    defaultRules() {
        return [
            { label: "Up Chevron", symbol: "up", fields: {} },
            { label: "Down Chevron", symbol: "down", fields: {} },
            { label: "Right Chevron", symbol: "right", fields: {} },
            { label: "Left Chevron", symbol: "left", fields: {} },
        ];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.EDGES,
                selectionMode: SelectionMode.MULTIPLE,
                label: gettext("Chevron Symbol"),
            }
        ];
    }

    getDescriptionHTML() {
        return `<p>${gettext("Chevrons point to the cell with the larger number.")}</p>`;
    }

    getDescriptionPlayHTML() {
        return gettext("In a <b>Chevron Sudoku</b>, each chevron points toward the cell with the <b>higher digit</b>.");
    }

    render(rule, ctx) {
        const region = rule.fields.region;
        if (!region) return;

        const s = this.board.getCellSizeCTX();

        for (const edge of region.items) {
            const { r1, c1, r2, c2 } = edge;
            const a = this.board.getCellTopLeftCTX(r1, c1);
            const b = this.board.getCellTopLeftCTX(r2, c2);

            const cx = (a.x + b.x + s) / 2;
            const cy = (a.y + b.y + s) / 2;

            ctx.save();
            ctx.font = `${Math.floor(s * 0.4)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            this.drawChevron(ctx, cx, cy, rule.symbol);
            ctx.restore();
        }
    }

    drawChevron(ctx, x, y, direction = 'down') {
        const size = 28;

        ctx.translate(x, y);
        ctx.scale(size / 24, size / 24);
        ctx.translate(-12, -12); // center the symbol

        ctx.beginPath();

        if (direction === 'down') {
            ctx.moveTo(5.293, 8.293);
            ctx.lineTo(12, 15);
            ctx.lineTo(18.707, 8.293);
            ctx.lineTo(20.121, 9.707);
            ctx.lineTo(12, 17.828);
            ctx.lineTo(3.879, 9.707);
        }
        else if (direction === 'up') {
            ctx.moveTo(5.293, 15.707);
            ctx.lineTo(12, 9);
            ctx.lineTo(18.707, 15.707);
            ctx.lineTo(20.121, 14.293);
            ctx.lineTo(12, 6.172);
            ctx.lineTo(3.879, 14.293);
        }
        else if (direction === 'right') {
            ctx.moveTo(8.293, 5.293);
            ctx.lineTo(15, 12);
            ctx.lineTo(8.293, 18.707);
            ctx.lineTo(9.707, 20.121);
            ctx.lineTo(17.828, 12);
            ctx.lineTo(9.707, 3.879);
        }
        else if (direction === 'left') {
            ctx.moveTo(15.707, 5.293);
            ctx.lineTo(9, 12);
            ctx.lineTo(15.707, 18.707);
            ctx.lineTo(14.293, 20.121);
            ctx.lineTo(6.172, 12);
            ctx.lineTo(14.293, 3.879);
        }

        ctx.closePath();
        ctx.fill();
    }
}
