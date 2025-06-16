import { RuleTypeHandler } from "./rule_handler.js";

export class DutchFlatRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Dutch-Flat", board);
        this.tag = "Dutch-Flat";
        this.can_create_rules = false;
    }

    defaultRules() {
        return [];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [];
    }

    getDescriptionHTML() {
        return `
            ${gettext("In <b>Dutch-Flat Sudoku</b>, each 5 must have a 1 directly above it and/or a 9 directly below it.")}
        `;
    }

    getDescriptionPlayHTML() {
        return gettext("In <b>Dutch-Flat Sudoku</b>, each 5 must have a 1 directly above it and/or a 9 directly below it.");
    }
}
