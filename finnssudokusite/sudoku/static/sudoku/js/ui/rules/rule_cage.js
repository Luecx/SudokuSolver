import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule.js";
import { buildInsetPath } from "../util/inset_path.js";


export class CageHandler extends RuleTypeHandler {
    constructor(board) {
        super("Cage", board);
        this.tag = "cage";
        this.can_create_rules = true;
    }

    defaultRules() {
        return [];
    }

    getRuleWarnings(rule) {
        let warnings = [];
        // if cage is empty or none,
        let cage_region = rule.fields.region;
        if (!cage_region) {
            warnings.push("Cage region is empty");
            return warnings;
        }
        if (cage_region.size() === 0) {
            warnings.push("Cage region is empty");
            return warnings;
        }
        // if cage sum is too large ( > 9 * number of cells in cage)
        let cage_sum = rule.fields.index;
        if (cage_sum > 9 * cage_region.size()) {
            warnings.push("Cage sum is too large");
        }
        // if cage sum is too small ( < number of cells in cage)
        if (cage_sum < cage_region.size()) {
            warnings.push("Cage sum is too small");
        }
        // if cage sum is not a number
        if (isNaN(cage_sum)) {
            warnings.push("Cage sum is not a number");
        }
        // if cage sum is not an integer
        if (cage_sum % 1 !== 0) {
            warnings.push("Cage sum is not an integer");
        }
        // if cage sum is not a positive number
        if (cage_sum <= 0) {
            warnings.push("Cage sum is not a positive number");
        }
        console.log(cage_region.connectedRegions());
        // if cage has more than 1 region
        if (cage_region.connectedRegions().length > 1) {
            warnings.push("Cage has more than 1 region");
        }
        return warnings;
    }

    getGeneralRuleScheme() {
        return [
            {
                key: "NumberCanRepeat",
                type: "boolean",
                label: `Numbers can repeat within a cage`,
                default: false
            },
        ];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "region",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Cage Region"
            },
            {
                key: "index",
                type: "number",
                min: 1,
                max: 999,
                default: 10,
                label: "Cage Sum"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        Inside <b>cages</b>, the sum of the numbers must equal the specified value.
        `;
    }

    render(rule, ctx) {    
        const region = rule.fields.region;

        if (!region) return;
        
        const s = this.board.getCellSize();
        const insetPx = 3;
        const inset = insetPx / s;
    
        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, inset);
    
        ctx.save();
        ctx.strokeStyle = "rgb(136,136,136)";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";  // Ensures smooth connection of line segments
        ctx.lineCap = "round";   // Ensures smooth caps at the ends
    
        // Dash pattern: [5px line, 5px space]
        ctx.setLineDash([5, 5]);
    
        for (const loop of loops) {
            ctx.beginPath();
            loop.forEach((pt, i) => {
                const topLeft = this.board.getCellTopLeft(pt.x, pt.y);
                const x = topLeft.x;
                const y = topLeft.y;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }
    
        // Draw the index inside the cage

        // Position top left
        const firstPoint = [...region.values()].reduce((a, b) => (b.r < a.r || (b.r === a.r && b.c < a.c)) ? b : a);
        const topLeft = this.board.getCellTopLeft(firstPoint.r, firstPoint.c);
        const x = topLeft.x + s * 0.09;  // s * 0.09 padding
        const y = topLeft.y + s * 0.17;  // s * 0.17 padding

        // Draw index
        const index = rule.fields.index;
        ctx.fillStyle = "black";
        ctx.fillText(index.toString(), x, y);

        ctx.restore();
    }
}
