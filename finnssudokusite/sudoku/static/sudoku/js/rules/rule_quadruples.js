import { RegionType } from "../region/RegionType.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import { RuleTypeHandler } from "./rule_handler.js";

export class QuadrupleRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Quadruple", board, 20);
        this.tag = "Quadruple";
        this.can_create_rules = true;
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.CORNERS,
                selectionMode: SelectionMode.MULTIPLE,
                label: gettext("Quadruple Corners")
            },
            {
                key: "values",
                type: "list",
                label: gettext("Digits"),
                default: [],
                max_num_count: 4,
                min: 1,
                max: this.board.getGridSize(),
            }
        ];
    }

    getRuleWarnings(rule) {
        const warnings = [];
        const digits = rule.fields.values || [];
        const maxDigit = this.board.getGridSize();

        if (!Array.isArray(digits)) return warnings;

        if (digits.length > 4) {
            warnings.push(gettext("Too many values: maximum is 4."));
        }

        for (const d of digits) {
            if (d < 1 || d > maxDigit) {
                warnings.push(gettext(`Digit ${d} is out of range (1–${maxDigit}).`));
                break;
            }
        }

        const seen = new Set();
        for (const d of digits) {
            if (seen.has(d)) {
                warnings.push(gettext(`Digit ${d} is duplicated.`));
                break;
            }
            seen.add(d);
        }

        return warnings;
    }

    getDescriptionHTML() {
        return `
        <p>${gettext("A <b>Quadruple</b> clue is a white circle placed in a corner. The digits shown inside must appear in the four cells that touch that corner.")}</p>`;
    }

    getDescriptionPlayHTML() {
        return gettext("A white circle in a corner lists digits that must appear in the 4 surrounding cells.");
    }

    render(rule, ctx) {
        const region = rule.fields.region;
        if (!region || !region.items || region.items.length === 0) return;

        const digits = (rule.fields.values || []).slice(0, 4).map(n => parseInt(n, 10)).filter(n => !isNaN(n));

        const cellSize = this.board.getCellSizeCTX();
        const radius = cellSize * 0.22;
        const fontSize = cellSize * 0.2;
        const gap = radius * 0.48;
        const gap4 = radius * 0.38;

        for (const corner of region.items) {
            const { r, c } = corner;
            const topLeft = this.board.getCellTopLeftCTX(r, c);
            const cx = topLeft.x;
            const cy = topLeft.y;

            ctx.save();
            ctx.translate(cx, cy);

            // Draw circle
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw digits
            ctx.fillStyle = "black";
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const n = digits.length;
            if (n === 1) {
                ctx.fillText(digits[0].toString(), 0, 0);
            } else if (n === 2) {
                ctx.fillText(digits[0].toString(), -gap * 0.7, 0);
                ctx.fillText(digits[1].toString(),  gap * 0.7, 0);
            } else if (n === 3) {
                ctx.fillText(digits[0].toString(), 0, -gap * 0.9);
                ctx.fillText(digits[1].toString(), -gap * 0.8, gap * 0.6);
                ctx.fillText(digits[2].toString(),  gap * 0.8, gap * 0.6);
            } else if (n === 4) {
                const positions = [
                    [-gap4, -gap4],
                    [ gap4, -gap4],
                    [-gap4,  gap4],
                    [ gap4,  gap4],
                ];
                for (let i = 0; i < 4; i++) {
                    const [dx, dy] = positions[i];
                    ctx.fillText(digits[i].toString(), dx, dy);
                }
            }

            ctx.restore();
        }
    }
}
