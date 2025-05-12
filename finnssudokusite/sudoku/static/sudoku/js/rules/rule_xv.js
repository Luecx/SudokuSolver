import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import {attachXVRuleSolverLogic} from "./rule_xv_solver.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class XVRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("XV", board);
        this.tag = "XV";
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
                selectionMode: SelectionMode.MULTIPLE,
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

    getDescriptionPlayHTML() {
        let desc = "In an <b>XV Sudoku</b>, an <b>X</b> between two cells means they sum to <b>10</b>, and a <b>V</b> means they sum to <b>5</b>.";

        if (this.fields?.allDotsGiven) {
            desc += " All valid X and V pairs are shown — if there's no symbol, the sum is neither 5 nor 10.";
        } else {
            desc += " Symbols may be placed selectively — a missing symbol does not imply anything.";
        }

        return desc;
    }


    render(rule, ctx) {
        const region = rule.fields.region;

        if (!region) return;

        const s = this.board.getCellSizeCTX();

        for (const edge of region.items) {
            const { r1, c1, r2, c2 } = edge;
            const a = this.board.getCellTopLeftCTX(r1, c1);
            const b = this.board.getCellTopLeftCTX(r2, c2);

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
