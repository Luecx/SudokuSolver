import { RuleTypeHandler } from "./rule_handler.js";
import {attachChessSolverLogic} from "./rule_chess_solver.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class ChessRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Anti-Chess", board);
        this.tag = "anti_chess";
        this.can_create_rules = false;

        attachChessSolverLogic(this);
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
            In <b>Chess Sudoku</b>:
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
