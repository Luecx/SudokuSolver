import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class PalindromeHandler extends RuleTypeHandler {
    constructor(board) {
        super("Palindrome", board);
        this.tag = "Palindrome";
        this.can_create_rules = true;
    }

    defaultRules() {
        return [];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getWarnings(rule) {
        // No warnings currently implemented
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "path",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: gettext("Palindrome Path")
            }
        ];
    }

    getDescriptionHTML() {
        return `
            ${gettext("Along a <b>palindrome line</b>, the digits must read the same forward and backward.")}
        `;
    }

    getDescriptionPlayHTML() {
        return gettext("In a <b>Palindrome Sudoku</b>, digits along each <b>blue palindrome line</b> must read the same forward and backward.");
    }

    render(rule, ctx) {
        if (!this.board) return;

        const path = rule.fields.path;
        if (!path || path.items.length < 2) return;

        const s = this.board.getCellSizeCTX();
        const half = s / 2;

        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 150, 0.2)";
        ctx.lineWidth = s * 0.2;
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
        ctx.restore();
    }
}
