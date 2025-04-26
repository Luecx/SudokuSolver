import {KropkiHandler} from "./rule_kropki.js";

// Add any new rule handlers here
export function createAllRuleHandlers(board) {
    return [
        new KropkiHandler(board),
        // new StandardHandler(board),
        // new DiagonalHandler(board)
        // Add more as needed
    ];
}
