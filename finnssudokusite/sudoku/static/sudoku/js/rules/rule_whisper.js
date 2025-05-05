import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule.js";

export class WhisperHandler extends RuleTypeHandler {
    constructor(board) {
        super("Whisper", board);
        this.tag = "whisper";
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
                selectionMode: "MULTIPLE",
                label: "Whisper Line Path"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        Along a <b>whisper line</b>, adjacent digits must differ by at least 5.
        `;
    }

    render(rule, ctx) {
        if (!this.board) return;

        const path = rule.fields.path;
        if (!path || path.items.length < 2) return;

        const s = this.board.getCellSize();
        const half = s / 2;

        ctx.save();
        ctx.strokeStyle = "rgba(0, 150, 150, 0.2)"; // Teal-ish, semi-transparent
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
