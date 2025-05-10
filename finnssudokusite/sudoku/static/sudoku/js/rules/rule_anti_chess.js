import { RuleTypeHandler } from "./rule_handler.js";
import {attachAntiChessSolverLogic} from "./rule_anti_chess_solver.js";

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

    render(ctx) {
        // nothing to do here
    }
}
