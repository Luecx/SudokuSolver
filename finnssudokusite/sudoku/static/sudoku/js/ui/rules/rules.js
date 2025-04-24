import {RuleKropkiWhiteHandler} from "./rule_kropki_white.js";

// Add any new rule handlers here
export function createAllRuleHandlers(board) {
    return [
        new RuleKropkiWhiteHandler(board)
        // Add more as needed
    ];
}
