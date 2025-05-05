import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule.js";
import {attachParitySolverLogic} from "./rule_parity_solver.js";

export class ParityHandler extends RuleTypeHandler {
    constructor(board) {
        super("Parity", board);
        this.tag = "parity";
        this.can_create_rules = true;

        attachParitySolverLogic(this);
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
                key: "path",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Parity Line Path"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        Along a <b>parity line</b>, adjacent cells must have different parity (one odd, one even).
        `;
    }

    render(rule, ctx) {
        if (!this.board) return;

        const path = rule.fields.path;
        if (!path || path.items.length < 2) return; // Need at least 2 cells to draw

        const s = this.board.getCellSize();
        const half = s / 2;

        ctx.save();
        ctx.strokeStyle = "rgba(0, 150, 0, 0.2)"; // Greenish, semi-transparent
        ctx.lineWidth = s * 0.2; // 20% of cell size
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
