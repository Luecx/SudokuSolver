import { RegionType } from "../region/RegionType.js";
import { RuleTypeHandler } from "./rule_handler.js";

// Helper function to draw chevrons
function drawChevron(ctx, x, y, direction = 'down') {
    const size = 28;

    ctx.save(); 
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    
    // Center the drawing 
    ctx.translate(-12, -12); // Shift back by half the icon size
    
    ctx.beginPath();
    
    if (direction === 'down') {
        ctx.moveTo(5.293, 8.293);
        ctx.lineTo(12, 15);
        ctx.lineTo(18.707, 8.293);
        ctx.lineTo(20.121, 9.707);
        ctx.lineTo(12, 17.828);
        ctx.lineTo(3.879, 9.707);
    } 
    else if (direction === 'up') {
        ctx.moveTo(5.293, 15.707);
        ctx.lineTo(12, 9);
        ctx.lineTo(18.707, 15.707);
        ctx.lineTo(20.121, 14.293);
        ctx.lineTo(12, 6.172);
        ctx.lineTo(3.879, 14.293);
    }
    else if (direction === 'left') {
        ctx.moveTo(8.293, 5.293);
        ctx.lineTo(15, 12);
        ctx.lineTo(8.293, 18.707);
        ctx.lineTo(9.707, 20.121);
        ctx.lineTo(17.828, 12);
        ctx.lineTo(9.707, 3.879);
    }
    else if (direction === 'right') {
        ctx.moveTo(15.707, 5.293);
        ctx.lineTo(9, 12);
        ctx.lineTo(15.707, 18.707);
        ctx.lineTo(14.293, 20.121);
        ctx.lineTo(6.172, 12);
        ctx.lineTo(14.293, 3.879);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export class ChevronHandler extends RuleTypeHandler {
    constructor(board, isHor
    ) {
        const orientation = isHor ? "Horizontal" : "Vertical";
        super(`${orientation} Chevron Rule`, board);
        this.tag = isHor ? "horchevron" : "verchevron";
        this.can_create_rules = false;
        this.isHor = isHor;
    }

    defaultRules() {
        const createRule = (direction) => ({ 
            label: `${direction} Rule`, 
            symbol: direction.toLowerCase(), 
            fields: {} 
        });
          
        return this.isHor 
            ? [createRule("Up"), createRule("Down")] 
            : [createRule("Right"), createRule("Left")];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {       
        return [
            {
                key: "region",
                type: "region",
                regionType: this.isHor ? RegionType.HOR_EDGES : RegionType.VER_EDGES,
                selectionMode: "MULTIPLE",
                label:  this.isHor ? "Horizontal Chevron Symbol" : "Vertical Chevron Symbol"
            }
        ];
    }

    getDescriptionHTML() {
        const directions = this.isHor 
        ? { first: "up", second: "down", top: "left", bottom: "right" }
        : { first: "right", second: "left", top: "top", bottom: "bottom" };

        return `
            <p>Chevrons indicate which cell must contain the larger number:</p>
            <ul class="chevron-rules">
                <li><i class="bi bi-chevron-${directions.first}"></i> 
                    The ${directions.top} number must be smaller than the ${directions.bottom} number
                </li>
                <li><i class="bi bi-chevron-${directions.second}"></i> 
                    The ${directions.bottom} number must be smaller than the ${directions.top} number
                </li>
            </ul>
            <p class="summary">The chevron always points toward the larger number.</p>
        `;
    }

    render(rule, ctx) {
        const region = rule.fields.region;
        if (!region) return;

        const s = this.board.getCellSize();

        for (const edge of region.items) {
            const { r1, c1, r2, c2 } = edge;
            const a = this.board.getCellTopLeft(r1, c1);
            const b = this.board.getCellTopLeft(r2, c2);

            const cx = (a.x + b.x + s) / 2;
            const cy = (a.y + b.y + s) / 2;

            ctx.save();
            ctx.font = `${Math.floor(s * 0.4)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            drawChevron(ctx, cx, cy, rule.symbol);
        }
    }
}

export class HorChevronHandler extends ChevronHandler {
    constructor(board) {
        super(board, true);
    }
}

export class VerChevronHandler extends ChevronHandler {
    constructor(board) {
        super(board, false);
    }
}
