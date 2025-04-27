import {KropkiHandler} from "./rule_kropki.js";
import {XVRuleHandler} from "./rule_xv.js";
import {StandardRuleHandler} from "./rule_standard.js";
import {DiagonalRuleHandler} from "./rule_diagonal.js";
import {SandwichHandler} from "./rule_sandwich.js";
import {ArrowHandler} from "./rule_arrow.js";

// Add any new rule handlers here
export function createAllRuleHandlers(board) {
    return [
        new KropkiHandler(board),
        new XVRuleHandler(board),
        new StandardRuleHandler(board),
        new DiagonalRuleHandler(board),
        new SandwichHandler(board),
        new ArrowHandler(board)
        // Add more as needed
    ];
}
