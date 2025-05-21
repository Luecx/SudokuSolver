import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { RegionType } from "../region/RegionType.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class AntiChessRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Anti-Chess", board);
        this.tag = "Anti-Chess";
        this.can_create_rules = false;
    }

    defaultRules() {
        return [
            { label: "Anti-Knight", fields: {} },
            { label: "Anti-King", fields: {} }
        ]; 
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [
           {
                key: "enabled",
                type: "boolean",
                label: `Enabled`,
                default: true
            },
            {
                key: "region",
                type: "region",
                regionType: RegionType.CELLS,
                selectionMode: SelectionMode.MULTIPLE,
                label: "Cage Region"
            },
            {
                key: "NumberCanRepeat",
                type: "boolean",
                label: `Numbers can repeat within a cage`,
                default: true
            },
            {
                key: "sums",
                type: "string",
                default: "",
                label: "Forbidden Cage Sums (comma-separated)"
            }
        ]; 
    }

    getRuleWarnings(rule) {
        const warnings = [];
        const sums = rule.fields?.sums;

        if (sums == null || sums === '')
            return warnings;

        const trimmed = sums.trim();
        if (trimmed === '') {
            warnings.push("'sums' cannot be empty");
            return warnings;
        }

        if (!trimmed.includes(',')) {
            if (isNaN(Number(trimmed)))
                warnings.push(`'${trimmed}' is not a valid number`);
            return warnings;
        }

        const parts = trimmed.split(',');
        if (parts.length > 18)
            warnings.push(`Too many numbers: maximum allowed is ${18}`);
        
        const invalidParts = parts.filter(part => {
            const num = part.trim();
            return num === '' || isNaN(Number(num));
        });

        if (invalidParts.length > 0)
            warnings.push(`Invalid numbers: ${invalidParts.join(', ')}`);

        return warnings;
    }

    getDescriptionHTML() {
        return `
            <b>Anti-Chess Sudoku</b>:
            <ul>
                <li>Cells a knight's move away cannot contain the same digit.</li>
                <li>Cells a king's move away cannot contain the same digit.</li>
                <li>Within defined cages:
                    <ul>
                        <li>Digits within must not sum to the given value(s).</li>
                        <li>The knight's and king's move restrictions apply.</li>
                        <li>Knight's and king's cages can coexist.</li>
                    </ul>
                </li>
                <li>Blue cages are knight's cages.</li>
                <li>Green cages are king's cages.</li>
                <li>If no cage is defined, the knight's and king's move restrictions apply to the entire board.</li>
            </ul>
        `;
    }

    getDescriptionPlayHTML() {
        let desc = "In an <b>Anti-Chess Sudoku</b>,";
        const king = this.fields?.antiKing;
        const knight = this.fields?.antiKnight;

        if (king && knight) {
            desc += " no two identical digits may be a king's move or a knight's move apart.";
        } else if (king) {
            desc += " no two identical digits may be a king's move apart.";
        } else if (knight) {
            desc += " no two identical digits may be a knight's move apart.";
        } else {
            desc += " chess constraints are disabled.";
        }

        return desc;
    }


    render(rule, ctx) {
        const region = rule.fields.region;
        
        if (!rule || !region || region.size() === 0) return;
                
        const s = this.board.getCellSize();
        const insetPx = 5;
        const inset = insetPx / s;
            
        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, inset);
            
        ctx.save();
        ctx.strokeStyle = rule.label == "Anti-Knight" ? "rgb(158, 107, 73)" : "rgb(125, 196, 62)";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";  // Ensures smooth connection of line segments
        ctx.lineCap = "round";   // Ensures smooth caps at the ends
            
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

        // Position top left

        const forbiddenSums = this.getForbiddenSums(rule);
        const totalNumbers = forbiddenSums.length;
        if (!forbiddenSums || totalNumbers === 0) {
            ctx.restore();
            return;
        }

        const firstPoint = [...region.values()].reduce((a, b) => (b.r < a.r || (b.r === a.r && b.c < a.c)) ? b : a);
        const topLeft = this.board.getCellTopLeftCTX(firstPoint.r, firstPoint.c);
            
        const boxWidth = s * 0.22 * totalNumbers;
        const boxHeight = s * 0.25;

        const rectX = topLeft.x + s * 0.03;
        const rectY = topLeft.y + s * 0.05;

        // Draw white rectangle background
        ctx.fillStyle = "white";
        ctx.fillRect(rectX, rectY, boxWidth, boxHeight);

        const forbiddenSumsText = forbiddenSums.join(", ");
        const textX =  rectX + s * 0.02;
        const textY = rectY + s * 0.03;

        ctx.setLineDash([]); // reset dashed lines before strikethrough
        ctx.fillStyle = "#B92B2B";
        ctx.font = `${s * 0.24}px Tahoma, Geneva, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        ctx.fillText(forbiddenSumsText, textX, textY);

        // Get text metrics before drawing text
        const textMetrics = ctx.measureText(forbiddenSumsText);
        // calculate a vertical position
        const middleY = textY + (textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent) / 1.75;

        ctx.strokeStyle = "rgb(61, 50, 42, 0.5)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(textX, middleY);
        ctx.lineTo(textX + textMetrics.width, middleY);
        ctx.stroke();
        
        ctx.restore();
    }

    // helper function
    getForbiddenSums(rule) {
        if (!rule?.fields) return [];

        const sumsInput = rule.fields.sums;
        
        if (sumsInput == null) return [];
        if (sumsInput.trim() === '') return [];

        return sumsInput
            .split(',')
            .map(part => {
                const trimmed = part.trim();
                return trimmed === '' ? NaN : Number(trimmed);
            })
            .filter(num => {
                return !isNaN(num) && Number.isInteger(num);
            })
            .slice(0, 18); // take only the first 18 numbers
    }

}
