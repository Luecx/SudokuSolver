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

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [
            {
                key: "NumberCanRepeat",
                type: "boolean",
                label: `Number scan repeat within a cage`,
                default: false
            },
            {
                key: "path",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: "MULTIPLE",
                label: "Cage Path"
            },
            {
                key: "index",
                type: "number",
                min: 1,
                max: 999,
                default: 10,
                label: "Cage Index"
            }
        ];
    }

    getDescriptionHTML() {
        return `
        Along a <b>parity line</b>, adjacent cells must have different parity (one odd, one even).
        `;
    }

    render(rule, ctx) {    
        const path = rule.fields.path;
        if (!path) return;
        
        const s = this.board.getCellSize();
        const insetPx = 3;
        const inset = insetPx / s;
    
        const cells = path.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, inset);
    
        ctx.save();
        ctx.strokeStyle = "rgb(136,136,136)";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";  // Ensures smooth connection of line segments
        ctx.lineCap = "round";   // Ensures smooth caps at the ends
    
        // Dash pattern: [1px line, 5px space]
        ctx.setLineDash([1, 5]);  
    
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
        const firstPoint = loops[0][0];
        const topLeft = this.board.getCellTopLeft(firstPoint.x, firstPoint.y);
        const x = topLeft.x + s * 0.05;  // s * 0.05 padding
        const y = topLeft.y + s * 0.2;  // s * 0.2 padding

        // Draw index
        const index = rule.fields.index;
        ctx.fillStyle = "black"; 
        ctx.fillText(index.toString(), x, y);

        ctx.restore();
    }
    
}
