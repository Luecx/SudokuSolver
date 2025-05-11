import { RuleTypeHandler } from "./rule_handler.js";
import { buildInsetPath } from "../util/inset_path.js";
import { RegionType } from "../region/RegionType.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import {attachAntiChessSolverLogic} from "./rule_anti_chess_solver.js";

export class AntiChessRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Anti-Chess", board);
        this.tag = "antichess";
        this.can_create_rules = false;

        attachAntiChessSolverLogic(this);
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
                default: false
            },
            {
                key: "sums",
                type: "number",
                default: "",
                label: "Forbidden Cage Sums (comma-separated)"
            }
        ]; 
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
        
        if (!rule || !region) return;
                
        const s = this.board.getCellSize();
        const insetPx = 5;
        const inset = insetPx / s;
            
        const cells = region.items.map(({ r, c }) => ({ x: c, y: r }));
        const loops = buildInsetPath(cells, inset);
            
        ctx.save();
        ctx.strokeStyle = rule.label == "Anti-Knight" ? "rgb(81, 157, 187)" : "rgb(125, 196, 62)";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";  // Ensures smooth connection of line segments
        ctx.lineCap = "round";   // Ensures smooth caps at the ends
            
        // Dash pattern: [5px line, 5px space]
        ctx.setLineDash([10, 10]);
            
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
