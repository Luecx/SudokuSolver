import { RuleTypeHandler } from "./rule_handler.js";
import {attachAntiChessSolverLogic} from "./rule_anti_chess_solver.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class AntiChessRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Anti-Chess", board);
        this.tag = "antichess";
        this.can_create_rules = false;

        attachAntiChessSolverLogic(this);
    }

    defaultRules() {
        return []; // << now completely empty
    }

    getGeneralRuleScheme() {
        return [
            {
                key: "antiKing",
                type: "boolean",
                label: `Anti-King Squares`,
                default: true
            },
            {
                key: "antiKnight",
                type: "boolean",
                label: `Anti-Knight Squares`,
                default: true
            }
        ];
    }

    getSpecificRuleScheme() {
        return []; // no per-rule options
    }

    getDescriptionHTML() {
        return `
            In <b>Anti-Chess Sudoku</b>:
            <ul>
                <li>Cells a knight's move apart cannot contain the same number.</li>
                <li>Cells a king's move apart cannot contain the same number.</li>
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


    render(ctx) {
        // nothing to do here
    }
}
