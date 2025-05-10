import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { attachIrregularSolverLogic} from "./rule_irregular_solver.js";

export class IrregularRegionsHandler extends RuleTypeHandler {
    constructor(board) {
        super("Irregular Regions", board);
        this.tag = "irregularregions";
        this.can_create_rules = false;

        this.regionKeys = [
            'region1', 
            'region2', 
            'region3', 
            'region4', 
            'region5', 
            'region6', 
            'region7', 
            'region8', 
            'region9'
        ];
        
        attachIrregularSolverLogic(this);
    }

    defaultRules() {
        return [];
    }

    getRuleWarnings(region) {
        let warnings = [];

       if (!region) {
            warnings.push("Irregular region is empty");
            return warnings;
        }
        
        if (region.items.length !== 9) {
            warnings.push(`Region must have 9 cells`);
        }

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
            In <b>Irregular Region Sudoku</b> standard Sudoku rules apply. Additionally, the grid is divided into irregularly shaped regions 
            instead of standard 3x3 boxes. Each of these irregular regions must also contain all digits from 1 to 9 exactly once.
        `;
    }

    renderAll(ctx) {
        if (!this.enabled) return;
        this.render(ctx);
    }

    render(ctx) {
        ctx.save();

        const regionColors = [
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

        // draw all regions
        for (let i = 0; i < this.regionKeys.length; i++) {
            const key = this.regionKeys[i];
            this.drawRegions(ctx, this.fields[key], regionColors[i]);
        }
        
        // Check for collisions directly in render method
        const collidingCells = this.findCollidingCells();
        
        // draw red X on colliding cells
        for (const collision of collidingCells) {
            this.drawCollisionX(ctx, collision.cell);
        }

        ctx.restore();   
    }

    // helper functions

    findCollidingCells() {
        const cellCounts = new Map();

        for (const key of this.regionKeys) {
            const region = this.fields?.[key];
            if (!region) continue;
            
            for (const item of region.items) {
                const cellKey = `${item.r},${item.c}`;
                if (!cellCounts.has(cellKey)) {
                    cellCounts.set(cellKey, { count: 1, cell: item, regions: [key] });
                } else {
                    const entry = cellCounts.get(cellKey);
                    entry.count += 1;
                    entry.regions.push(key);
                }
            }
        }
        
        const collidingCells = [];
        for (const [cellKey, entry] of cellCounts.entries()) {
            if (entry.count > 1) {
                collidingCells.push({
                    cell: entry.cell,
                    key: cellKey,
                    regions: entry.regions
                });
            }
        }
        
        return collidingCells;
    }

    drawRegions(ctx, region, color)
    {
        if(region == null) return;

        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, 0);

        ctx.fillStyle = color;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();

        for (const loop of loops) {
            loop.forEach((pt, i) => {
                const topLeft = this.board.getCellTopLeft(pt.x, pt.y);
                const x = topLeft.x;
                const y = topLeft.y;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
        }

        ctx.fill();
    }

    drawCollisionX(ctx, cell) {
        const { r, c } = cell;
        const topLeft = this.board.getCellTopLeft(r, c);
        const cellSize = this.board.getCellSize();
        
        const x = topLeft.x;
        const y = topLeft.y;
        
        ctx.save();
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        ctx.moveTo(x + cellSize * 0.2, y + cellSize * 0.2);
        ctx.lineTo(x + cellSize * 0.8, y + cellSize * 0.8);
        ctx.moveTo(x + cellSize * 0.8, y + cellSize * 0.2);
        ctx.lineTo(x + cellSize * 0.2, y + cellSize * 0.8);
        
        ctx.stroke();
        ctx.restore();
    }
}