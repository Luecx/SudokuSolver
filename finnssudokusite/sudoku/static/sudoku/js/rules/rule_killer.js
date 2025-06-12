import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class KillerHandler extends RuleTypeHandler {
    constructor(board) {
        super("Killer", board);
        this.tag = "Killer";
        this.can_create_rules = true;
    }

    defaultRules() {
        return [];
    }

    getRuleWarnings(rule) {
        let warnings = [];
        const cage_region = rule.fields.region;

        if (!cage_region || cage_region.size() === 0) {
            warnings.push(gettext("Cage region is empty"));
            return warnings;
        }

        const cage_sum = rule.fields.sum;

        if (cage_sum > 9 * cage_region.size()) {
            warnings.push(gettext("Cage sum is too large"));
        }

        if (cage_sum < cage_region.size()) {
            warnings.push(gettext("Cage sum is too small"));
        }

        if (isNaN(cage_sum)) {
            warnings.push(gettext("Cage sum is not a number"));
        }

        if (cage_sum % 1 !== 0) {
            warnings.push(gettext("Cage sum is not an integer"));
        }

        if (cage_sum <= 0) {
            warnings.push(gettext("Cage sum is not a positive number"));
        }

        if (cage_region.connectedRegions().length > 1) {
            warnings.push(gettext("Cage has more than 1 region"));
        }

        // check for overlapping cages
        for (const otherRule of this.rules) {
            const otherRegion = otherRule.fields?.region;
            if (!otherRegion || otherRegion.size() === 0) continue;
            if (otherRule === rule) continue; // skip self

            // check if any cell in current cage exists in other cage
            const hasOverlap = [...cage_region.values()].some(cell =>
                [...otherRegion.values()].some(otherCell =>
                    cell.r === otherCell.r && cell.c === otherCell.c
                )
            );

            if (hasOverlap) {
                warnings.push(gettext("Cage overlaps with another cage"));
                break; // only show warning once
            }
        }

        return warnings;
    }

    getGeneralRuleScheme() {
        return [
            {
                key: "NumberCanRepeat",
                type: "boolean",
                label: gettext("Numbers can repeat within a cage"),
                default: false
            }
        ];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: gettext("Cage Region")
            },
            {
                key: "sum",
                type: "number",
                min: 1,
                max: 999,
                default: 10,
                label: gettext("Cage Sum")
            }
        ];
    }

    getDescriptionHTML() {
        return `
            ${gettext("Inside <b>cages</b>, the sum of the numbers must equal the specified value in the top left corner of the cage.")} 
        `;
    }

    getDescriptionPlayHTML() {
        let desc = gettext("In a <b>Killer Sudoku</b>, digits inside a cage must sum to the value shown in the top-left corner of the cage.");
        if (this.fields?.NumberCanRepeat) {
            desc += " " + gettext("In this puzzle, <b>digits may repeat</b> within a cage if they appear in different cells.");
        } else {
            desc += " " + gettext("Digits <b>must not repeat</b> within a cage.");
        }
        return desc;
    }

    render(rule, ctx) {
        const region = rule.fields.region;

        if (!rule || !region || region.size() === 0) return;

        const s = this.board.getCellSizeCTX();
        const insetPx = 5;
        const inset = insetPx / s;

        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, inset);

        ctx.save();
        ctx.strokeStyle = "rgb(136,136,136)";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.setLineDash([10, 10]);

        for (const loop of loops) {
            ctx.beginPath();
            loop.forEach((pt, i) => {
                const topLeft = this.board.getCellTopLeftCTX(pt.x, pt.y);
                const x = topLeft.x;
                const y = topLeft.y;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }

        const firstPoint = [...region.values()].reduce(
            (a, b) => (b.r < a.r || (b.r === a.r && b.c < a.c)) ? b : a
        );

        const topLeft = this.board.getCellTopLeftCTX(firstPoint.r, firstPoint.c);
        const boxWidth = s * 0.20;
        const boxHeight = s * 0.20;
        const paddingX = s * 0.03;
        const paddingY = s * 0.05;

        const rectX = topLeft.x + paddingX;
        const rectY = topLeft.y + paddingY;

        ctx.fillStyle = "white";
        ctx.fillRect(rectX, rectY, boxWidth, boxHeight);

        const targetSum = rule.fields.sum;
        ctx.fillStyle = "black";
        ctx.font = `${s * 0.16}px sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(targetSum.toString(), rectX + s * 0.02, rectY + s * 0.01);

        ctx.restore();
    }
}
