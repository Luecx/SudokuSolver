import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class NumberedRoomsHandler extends RuleTypeHandler {
    constructor(board) {
        super("Numbered-Rooms", board);
        this.tag = "Numbered Rooms";
        this.can_create_rules = true;
    }

    defaultRules() {
        return [];
    }

    getGeneralRuleScheme() {
        return []; // no global settings
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.ORIENTED_ROWCOL,
                selectionMode: SelectionMode.MULTIPLE,
                label: "Arrow Direction"
            },
            {
                key: "digit",
                type: "number",
                min: 1,
                max: 9,
                default: 5,
                label: "Target Digit"
            }
        ];
    }

    getDescriptionHTML() {
        return `
    In <b>Numbered Rooms</b>, a clue is placed outside the grid and applies to a specific row or column. 
    The <b>first digit</b> in the indicated direction determines a position N, and the <b>Nth cell</b> in that direction must contain the given clue digit.<br><br>
    For example, if the outside clue shows a 4 and the first digit in the direction is a 3, then the <b>3rd cell</b> must be a 4.
    `;
    }

    getDescriptionPlayHTML() {
        return `
    A clue digit is placed outside the grid for a row or column. 
    The <b>first digit</b> seen from that side determines a position N, and the <b>Nth cell</b> must contain the clue digit.
    `;
    }


    render(rule, ctx) {
        const region = rule.fields.region;
        const digit = rule.fields.digit;

        if (!region || digit == null) return;

        const s = this.board.getCellSizeCTX();
        const offsetDist = s * 0.3;

        for (const item of region.items) {
            ctx.save();
            ctx.font = `${s * 0.35}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            let x, y;

            if (!isNaN(item.row) && item.row != null) {
                // Row hint — placed left or right of the grid
                const cell = this.board.getCellTopLeftCTX(item.row, item.reversed ? 8 : 0);
                y = cell.y + s / 2;
                x = item.reversed
                    ? cell.x + s + offsetDist   // right side of last cell
                    : cell.x - offsetDist;      // left side of first cell
            } else if (!isNaN(item.col) && item.col != null) {
                // Column hint — placed above or below the grid
                const cell = this.board.getCellTopLeftCTX(item.reversed ? 8 : 0, item.col);
                x = cell.x + s / 2;
                y = item.reversed
                    ? cell.y + s + offsetDist   // below last cell
                    : cell.y - offsetDist;      // above first cell
            } else {
                continue;
            }

            const text = digit.toString();
            const metrics = ctx.measureText(text);
            const w = metrics.width + 4;
            const h = s * 0.4;

            ctx.fillStyle = "white";
            ctx.fillRect(x - w / 2, y - h / 2, w, h);
            ctx.fillStyle = "#222";
            ctx.fillText(text, x, y);

            ctx.restore();
        }
    }

}
