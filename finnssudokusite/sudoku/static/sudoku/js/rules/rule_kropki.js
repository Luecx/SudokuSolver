import { RegionType } from "../region/RegionType.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import { RuleTypeHandler } from "./rule_handler.js";

export class KropkiHandler extends RuleTypeHandler {
    constructor(board) {
        super("Kropki", board, 10);
        this.tag = "Kropki";
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
                default: false,
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
                selectionMode: SelectionMode.MULTIPLE,
                label: "Kropki Dot Edges"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        <ul>
            <li>A <b>white dot</b> between two cells means the numbers are consecutive (for example, 3 and 4).</li>
            <li>A <b>black dot</b> means one number is exactly double the other (for example, 2 and 4).</li>
        </ul>
        If the option <b>All Dots Given</b> is enabled, then every adjacent pair of cells that satisfies one of these conditions will have a dot. 
        This means that if there is no dot between two adjacent cells, then neither condition (consecutive nor double) applies.
        If <b>All Dots Given</b> is not enabled, dots may only be placed selectively, and missing dots do not imply anything.
    `;
    }

    getDescriptionPlayHTML() {
        let desc = "In a <b>Kropki Sudoku</b>, a <b>white dot</b> means two digits are consecutive, and a <b>black dot</b> means one digit is double the other.";
        if (this.fields?.allDotsGiven) {
            desc += " All valid pairs are marked, so if there's no dot between two adjacent cells, neither condition applies.";
        } else {
            desc += " Only some dots are given; the absence of a dot does not imply anything.";
        }
        return desc;
    }



    render(rule, ctx) {
        const region = rule.fields.region;

        if (region === null || region === undefined) return;

        const s = this.board.getCellSizeCTX();
        const radius = s * 0.12;

        for (const edge of region.items) {
            const { r1, c1, r2, c2 } = edge;
            const a = this.board.getCellTopLeftCTX(r1, c1);
            const b = this.board.getCellTopLeftCTX(r2, c2);

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
