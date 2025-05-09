import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { attachIrregularSolverLogic} from "./rule_irregular_solver.js";

export class IrregularHandler extends RuleTypeHandler {
    constructor(board) {
        super("Irregular", board);
        this.tag = "irregular";
        this.can_create_rules = false;

        this.ruleCounter = 0;

        this.colors = [
            'rgba(255, 0, 0, 0.3)',
            'rgba(0, 255, 0, 0.3)',
            'rgba(0, 0, 255, 0.3)',
            'rgba(255, 255, 0, 0.3)',
            'rgba(255, 0, 255, 0.3)',
            'rgba(0, 255, 255, 0.3)',
            'rgba(255, 165, 0, 0.3)',
            'rgba(128, 0, 128, 0.3)',
            'rgba(0, 128, 0, 0.3)'
        ];

        console.log(this.fields);

     //   attachIrregularSolverLogic(this);
    }

    defaultRules() {
        return [];
    }

    getRuleWarnings(rule) {
        console.log("test");
      
        let warnings = [];
  /*
         if (!region) {
            warnings.push("Irregular region is empty");
            return warnings;
        }

        if (region.size() != 9) {
            warnings.push("Irregular region must contain 9 cells");
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
*/
        return warnings;
    }

    getGeneralRuleScheme() {
        return [
            {
                key: "region1",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 1"
            },
            {
                key: "region2",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 2"
            },
            {
                key: "region3",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 3"
            },
            {
                key: "region4",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 4"
            },
            {
                key: "region5",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 5"
            },
            {
                key: "region6",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 6"
            },
            {
                key: "region7",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 7"
            },
            {
                key: "region8",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 8"
            },
            {
                key: "region9",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Region 9"
            }
        ];
    }

    getSpecificRuleScheme() {
        return [ ];
    }

    getDescriptionHTML() {
        return `
        Inside <b>cages</b>, the sum of the numbers must equal the specified value.
        `;
    }

    render(rule, ctx) {
        console.log("Rendering irregular rule");
        /*
        const region = rule.fields.region;
        if (!rule || !region) return;

        if (!rule.fields.colorIndex) {
            rule.fields.colorIndex = this.ruleCounter++;
        }

        const colorIndex = rule.fields.colorIndex % this.colors.length;
        const color = this.colors[colorIndex];

        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, 0);

        ctx.save();
        ctx.fillStyle = color;
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
            ctx.fill();
        }

        ctx.restore();*/
    }
}