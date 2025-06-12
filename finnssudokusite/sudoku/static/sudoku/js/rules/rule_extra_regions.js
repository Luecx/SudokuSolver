import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class ExtraRegionsHandler extends RuleTypeHandler {
    constructor(board) {
        super("Extra-Regions", board);
        this.tag = "Extra-Regions";
        this.can_create_rules = true;
        this.usedColors = new Set();
    }

    defaultRules() {
        return [];
    }

    getRuleWarnings(rule) {
        let warnings = [];

        let region = rule.fields.region;
        if (!region) {
            warnings.push(gettext("Region is empty"));
            return warnings;
        }

        if (region.size() < 2 || region.size() > 9) {
            warnings.push(gettext("Region must have 2 to 9 cells"));
        }

        return warnings;
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: gettext("Region")
            },
            {
                key: "color",
                type: "string",
                defaultValue: "",
                label: gettext("Region Color (if not set, random color will be used)"),
            }
        ];
    }

    getDescriptionHTML() {
        return `
            ${gettext("Regions must follow these rules:")}
            <ul>
                <li>${gettext("Can be any shape and anywhere.")}</li>
                <li>${gettext("Must contain all numbers from 1 to 9 exactly once.")}</li>
                <li>${gettext("Have between 2 and 9 cells.")}</li>
                <li>${gettext("Can overlap with each other.")}</li>
            </ul>
        `;
    }

    getDescriptionPlayHTML() {
        return gettext("In <b>Extra-Regions</b> the regions must contain <b>all numbers</b> from 1 to 9 exactly <b>once</b>.");
    }

    render(rule, ctx) {
        const region = rule.fields.region;

        if (!rule || !region) return;

        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, 0);

        if (!rule.fields.color) rule.fields.color = this.getRandomColor();

        ctx.save();
        ctx.fillStyle = rule.fields.color;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();

        for (const loop of loops) {
            loop.forEach((pt, i) => {
                const topLeft = this.board.getCellTopLeftCTX(pt.x, pt.y);
                const x = topLeft.x;
                const y = topLeft.y;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
        }

        ctx.fill();
        ctx.restore();
    }

    getRandomColor() {
        let color;
        do {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            color = `rgba(${r}, ${g}, ${b}, 0.3)`;
        } while (this.usedColors.has(color));

        this.usedColors.add(color);
        return color;
    }
}
