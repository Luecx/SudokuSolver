import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import {attachXVRuleSolverLogic} from "./rule_xv_solver.js";

export class XVRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("XV Rule", board);
        this.tag = "xv";
        this.can_create_rules = false;

        attachXVRuleSolverLogic(this);
    }

    defaultRules() {
        return [
            { label: "X Rule", symbol: "X", fields: {} },
            { label: "V Rule", symbol: "V", fields: {} }
        ];
    }

    getGeneralRuleScheme() {
        return [
            {
                key: "allDotsGiven",
                type: "boolean",
                default: false,
                label: "All symbols given"
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
                label: "XV Symbol Edges"
            }
        ];
    }

    getDescriptionHTML() {
        return `
            <ul>
                <li><b>X</b>: The two cells sum to <b>10</b>.</li>
                <li><b>V</b>: The two cells sum to <b>5</b>.</li>
            </ul>
            If the option <b>All Symbols Given</b> is enabled, every adjacent pair that sums to 5 or 10 must have a corresponding symbol.
            If <b>All Symbols Given</b> is not enabled, symbols may only appear selectively, and missing symbols do not necessarily imply anything.
        `;
    }

    render(rule, ctx) {
        const region = rule.fields.region;

        if (!region) return;

        const s = this.board.getCellSize();

        for (const edge of region.items) {
            const { r1, c1, r2, c2 } = edge;
            const a = this.board.getCellTopLeft(r1, c1);
            const b = this.board.getCellTopLeft(r2, c2);

            const cx = (a.x + b.x + s) / 2;
            const cy = (a.y + b.y + s) / 2;

            ctx.save();
            ctx.font = `${Math.floor(s * 0.4)}px Arial`; // Better font size
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            ctx.fillText(rule.symbol, cx, cy);
            ctx.restore();
        }
    }
}
