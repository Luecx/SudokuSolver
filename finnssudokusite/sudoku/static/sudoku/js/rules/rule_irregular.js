import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { attachIrregularSolverLogic} from "./rule_irregular_solver.js";

function getRandomColor() {
    const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16);
    return `#${hex.padStart(6, '0')}`;
}

export class IrregularHandler extends RuleTypeHandler {
    constructor(board) {
        super("Irregular", board);
        this.tag = "irregular";
        this.can_create_rules = true;

        this.ruleCounter = 0;

        this.colors =  [
            '#FF0000', // Red
            '#00FF00', // Green
            '#0000FF', // Blue
            '#FFFF00', // Yellow
            '#FF00FF', // Magenta
            '#00FFFF', // Cyan
            '#FFA500', // Orange
            '#800080', // Purple
            '#008000'  // Dark Green
        ];

        attachIrregularSolverLogic(this);
    }

    defaultRules() {
        return [];
    }

    getRuleWarnings(rule) {
        let warnings = [];
        let region = rule.fields.region;

        if (!region) {
            warnings.push("Irregular region is empty");
            return warnings;
        }

        if (region.size() != 9) {
            warnings.push("Irregular region must contain 9 cells");
        }

        if (this.rules.length != 9) {
            warnings.push("Irregular Rule must contain 9 regions");
        }

        // Check for collisions with other regions
        const currentCells = new Set(region.items.map(item => item.toString()));
        let hasCollision = false;
        
        for (const otherRule of this.rules) {
            if (otherRule === rule) continue; // skip current rule
            
            const otherRegion = otherRule.fields?.region;
            if (!otherRegion) continue;
            
            for (const item of otherRegion.items) {
                if (currentCells.has(item.toString())) {
                    hasCollision = true;
                    break;
                }
            }
            
            if (hasCollision) break;
        }
        
        if (hasCollision) {
            warnings.push("Region collision detected");
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
                selectionMode: "MULTIPLE",
                label: "Cage Region"
            },
            {
                key: "colorIndex",
                type: "x" // do this for now so the type is not recognized
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
        if (!rule || !region) return;

        // Initialize color based on rule creation order
        if (!rule.fields.colorIndex) {
            rule.fields.colorIndex = this.ruleCounter++;
        }

        // Cycle through colors if we exceed the palette
        const colorIndex = rule.fields.colorIndex % this.colors.length;
        const color = this.colors[colorIndex];

        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, 0);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

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

        ctx.restore();
    }
}