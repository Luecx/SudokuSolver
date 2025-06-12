import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class WildApples extends RuleTypeHandler {
    constructor(board) {
        super("Wild Apples", board);
        this.tag = "Wild-Apples";
        this.can_create_rules = false;
    }

    defaultRules() {
        return [{ label: "Wild Apples", fields: {} }];
    }

    getGeneralRuleScheme() { return []; }

    getSpecificRuleScheme() {
        return [{
            key: "region",
            type: "region",
            regionType: RegionType.EDGES,
            selectionMode: SelectionMode.MULTIPLE,
            label: gettext("Wild Apple Symbol")
        }];
    }

    getDescriptionHTML() {
        return gettext(`<p>Digits separated by a red dot are non-consecutive and contain one even digit and one odd digit. All dots are given!</p>`);
    }

    getDescriptionPlayHTML() {
        return gettext("Digits separated by a <b>red dot</b> are <b>non-consecutive</b> and contain one <b>even digit</b> and one <b>odd digit</b>. All dots are given!");
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
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.16, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    }
}