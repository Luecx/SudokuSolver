import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class MagicSquareHandler extends RuleTypeHandler {
    constructor(board) {
        super("Magic Square", board);
        this.tag = "Magic-Square";
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
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: gettext("Magic Square (3×3)")
            }
        ];
    }

    getDescriptionPlayHTML() {
        return gettext("In a <b>Magic Square Sudoku</b>, every <b>gray 3×3 square</b> must have all its rows, columns, and diagonals sum to the same total.");
    }

    getRuleWarnings(rule) {
        let warnings = [];

        const region = rule.fields.region;

        if (!region || region.items.length === 0) {
            warnings.push(gettext("Base cells are empty."));
            return warnings;
        }

        if (region.items.length !== 9) {
            warnings.push(gettext("Base cells must be a 3×3 square."));
            return warnings;
        }

        const rows = new Set();
        const cols = new Set();
        for (const { r, c } of region.items) {
            rows.add(r);
            cols.add(c);
        }

        if (rows.size !== 3 || cols.size !== 3) {
            warnings.push(gettext("Base cells must be a 3×3 square."));
        }

        return warnings;
    }

    getDescriptionHTML() {
        return `
            ${gettext("In a <b>Magic Square</b>, the <b>rows, columns and diagonals</b> in the 3×3 square must sum to the same value.")}
        `;
    }

    render(rule, ctx) {
        const region = rule.fields.region;
        if (!region || region.items.length === 0) return;

        const s = this.board.getCellSizeCTX();
        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));

        const rows = new Set();
        const cols = new Set();
        for (const { x, y } of cells) {
            rows.add(y);
            cols.add(x);
        }

        const is3x3 = region.items.length === 9 && rows.size === 3 && cols.size === 3;

        ctx.save();
        ctx.fillStyle = is3x3 ? "rgba(100, 100, 100, 0.1)" : "rgba(255, 0, 0, 0.1)";

        for (const cell of cells) {
            const topLeft = this.board.getCellTopLeftCTX(cell.y, cell.x);
            ctx.fillRect(topLeft.x, topLeft.y, s, s);
        }

        ctx.restore();
    }
}
