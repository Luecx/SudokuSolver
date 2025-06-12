import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class SandwichHandler extends RuleTypeHandler {
    constructor(board) {
        super("Sandwich", board);
        this.tag = "Sandwich";
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
                regionType: RegionType.ROWCOL,
                selectionMode: SelectionMode.MULTIPLE,
                label: gettext("Row/Column")
            },
            {
                key: "sum",
                type: "number",
                min: 1,
                max: 35,
                default: 10,
                label: gettext("Sandwich Sum")
            }
        ];
    }

    getDescriptionHTML() {
        return `
        ${gettext("In a Sandwich Sudoku, the sum of the numbers between 1 and 9 (the \"bread\") in a given row or column must match the given total. Cells outside the sandwich or part of the \"bread\" itself do not count toward the sum.")}
        `;
    }

    getDescriptionPlayHTML() {
        return gettext("In a <b>Sandwich Sudoku</b>, the digits between <b>1</b> and <b>9</b> in a marked row or column must sum to the given total. The <b>1</b> and <b>9</b> act as the ends of the sandwich and are not included in the sum.");
    }

    render(rule, ctx) {
        const region = rule.fields.region;
        const sum = rule.fields.sum;
        if (!region || sum == null) return;

        const s = this.board.getCellSizeCTX();
        const offsetDist = s * 0.3;

        for (const item of region.items) {
            ctx.save();
            ctx.font = `${s * 0.35}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            let x, y;

            if (!isNaN(item.row)) {
                const cell = this.board.getCellTopLeftCTX(item.row, 0);
                x = cell.x - offsetDist;
                y = cell.y + s / 2;
            } else if (!isNaN(item.col)) {
                const cell = this.board.getCellTopLeftCTX(0, item.col);
                x = cell.x + s / 2;
                y = cell.y - offsetDist;
            } else continue;

            const text = sum.toString();
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;
            const textHeight = s * 0.4;

            ctx.fillStyle = "white";
            ctx.fillRect(x - textWidth / 2 - 2, y - textHeight / 2 - 2, textWidth + 4, textHeight + 4);

            ctx.fillStyle = "#333";
            ctx.fillText(text, x, y);
            ctx.restore();
        }
    }
}
