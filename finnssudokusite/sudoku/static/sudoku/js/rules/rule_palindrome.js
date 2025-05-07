import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule.js";
import {attachPalindromeSolverLogic} from "./rule_palindrome_solver.js";

export class PalindromeHandler extends RuleTypeHandler {
    constructor(board) {
        super("Palindrome", board);
        this.tag = "palindrome";
        this.can_create_rules = true;

        attachPalindromeSolverLogic(this);
    }

    defaultRules() {
        return [];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getWarnings(rule) {

    }

    getSpecificRuleScheme() {
        return [
            {
                key: "path",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Palindrome Path"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        Along a <b>palindrome line</b>, the digits must read the same forward and backward.
        `;
    }

    render(rule, ctx) {
        if (!this.board) return;

        const path = rule.fields.path;
        if (!path || path.items.length < 2) return; // Need at least 2 cells to draw

        const s = this.board.getCellSize();
        const half = s / 2;

        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 150, 0.2)"; // Bluish, semi-transparent
        ctx.lineWidth = s * 0.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const { x, y } = this.board.getCellTopLeft(path.items[0].r, path.items[0].c);
        ctx.beginPath();
        ctx.moveTo(x + half, y + half);

        for (let i = 1; i < path.items.length; i++) {
            const { r, c } = path.items[i];
            const pt = this.board.getCellTopLeft(r, c);
            ctx.lineTo(pt.x + half, pt.y + half);
        }

        ctx.stroke();
        ctx.restore();
    }
}