import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
export class ThermoHandler extends RuleTypeHandler {
    constructor(board) {
        super("Thermo", board);
        this.tag = "Thermo";
        this.can_create_rules = true;
    }

    defaultRules() { return []; }

    getGeneralRuleScheme() { return []; }

    getSpecificRuleScheme() {
        return [{
            key: "path",
            type: "region",
            regionType: RegionType.CELLS,
            selectionMode: SelectionMode.MULTIPLE,
            label: gettext("Thermometer Path")
        }];
    }

    getDescriptionHTML() {
        return gettext(`Along a <b>thermometer</b>, digits must increase from the bulb to the tip.`);
    }

    getDescriptionPlayHTML() {
        return gettext("In a <b>Thermometer Sudoku</b>, digits must <b>strictly increase</b> along each <b>gray thermometer</b> from the bulb to the tip.");
    }

    render(rule, ctx) {
        if (!this.board) return;
        const path = rule.fields.path;
        if (!path || path.items.length < 2) return;

        const s = this.board.getCellSizeCTX();
        const half = s / 2;
        const lineWidth = s * 0.15;
        const bulbRadius = lineWidth * 2;

        const points = path.items.map(({ r, c }) => {
            const { x, y } = this.board.getCellTopLeftCTX(r, c);
            return { x: x + half, y: y + half };
        });

        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, bulbRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, bulbRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
        ctx.fill();
        ctx.restore();
    }
}
