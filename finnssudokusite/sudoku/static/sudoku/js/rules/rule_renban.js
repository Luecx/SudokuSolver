import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import {attachRenbanSolverLogic} from "./rule_renban_solver.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class RenbanHandler extends RuleTypeHandler {
    constructor(board) {
        super("Renban", board);
        this.tag = "renban";
        this.can_create_rules = true;

        attachRenbanSolverLogic(this);
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
                selectionMode: SelectionMode.MULTIPLE,
                label: "Renban Path"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        Along a <b>renban line</b>, the digits form a consecutive sequence, in any order.
        `;
    }

    getDescriptionPlayHTML() {
        return "In a <b>Renban Sudoku</b>, the digits on each <b>purple renban line</b> must form a consecutive set, in any order.";
    }

    render(rule, ctx) {
        if (!this.board) return;

        const path = rule.fields.path;
        if (!path || path.items.length < 2) return;

        const s = this.board.getCellSize();
        const half = s / 2;

        ctx.save();
        ctx.strokeStyle = "rgba(150, 0, 150, 0.2)"; // Purple-ish, semi-transparent
        ctx.lineWidth = s * 0.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const start = this.board.getCellTopLeft(path.items[0].r, path.items[0].c);
        ctx.beginPath();
        ctx.moveTo(start.x + half, start.y + half);

        for (let i = 1; i < path.items.length; i++) {
            const { r, c } = path.items[i];
            const pt = this.board.getCellTopLeft(r, c);
            ctx.lineTo(pt.x + half, pt.y + half);
        }

        ctx.stroke();
        ctx.restore();
    }
}
