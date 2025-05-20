import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class ParityHandler extends RuleTypeHandler {
    constructor(board) {
        super("Parity", board);
        this.tag = "Parity";
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
                key: "path",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: "Parity Line Path"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        Along a <b>parity line</b>, adjacent cells must have different parity (one odd, one even).
        `;
    }

    getDescriptionPlayHTML() {
        return "In a <b>Parity Sudoku</b>, adjacent digits along each <b>green parity line</b> must alternate between odd and even.";
    }

    render(rule, ctx) {
        if (!this.board) return;

        const path = rule.fields.path;
        if (!path || path.items.length < 2) return; // Need at least 2 cells to draw

        const s = this.board.getCellSizeCTX();
        const half = s / 2;

        ctx.save();
        ctx.strokeStyle = "rgba(0, 150, 0, 0.2)"; // Greenish, semi-transparent
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
        ctx.restore();
    }
}
