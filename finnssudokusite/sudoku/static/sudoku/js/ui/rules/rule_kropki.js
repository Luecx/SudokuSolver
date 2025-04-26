import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule.js";
import { Region } from "../region/region.js";

export class KropkiHandler extends RuleTypeHandler {
    constructor(board) {
        super("Kropki", board);
        this.tag = "kropki";
        this.can_create_rules = false;
    }

    defaultRules() {
        return [
            { label: "White Kropki Dots", color: "white", fields: {} },
            { label: "Black Kropki Dots", color: "black", fields: {} }
        ];
    }

    getGeneralRuleScheme() {
        return [
            {
                key: "allDotsGiven",
                type: "boolean",
                default: true,
                label: "All dots given"
            }
        ];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.EDGES,
                selectionMode: "MULTIPLE",
                label: "Kropki Dot Edges"
            }
        ];
    }

    render(rule, ctx) {
        const region = rule.fields.region;

        if (region === null || region === undefined) return;

        const s = this.board.getCellSize();
        const radius = s * 0.12;

        for (const edge of region.items) {
            const { r1, c1, r2, c2 } = edge;
            const a = this.board.getCellTopLeft(r1, c1);
            const b = this.board.getCellTopLeft(r2, c2);

            const cx = (a.x + b.x + s) / 2;
            const cy = (a.y + b.y + s) / 2;

            ctx.save();
            ctx.fillStyle = rule.color;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

}
