import { booleanOption, numberOption, stringOption, regionSelector } from "../creator/rule_manager_options.js";

export class RuleTypeHandler {
    constructor(name, board) {

        // name and reference to the board to handle interactions
        this.name  = name;
        this.board = board;
        // list of created instances of rules
        this.rules = [];

        this.tag = "";
        this.selection_config = null;
    }

    // --- UI related fields ---
    // applicable to all rules of this type
    ui_generalRuleFields() {}
    ui_specificRuleFields() {}

    // --- Optional lifecycle hooks ---
    onStartCreating() {
        if (this.selection_config) {
            this.board.setSelection(this.selection_config);
            this.board.showSelectionBlue(this.selection_config.showVisual ?? true);
        }
    }
    onFinishedCreating() {}

    // --- Optional rendering ---
    renderAll(ctx) {
        this.rules.forEach(rule => this.render(rule, ctx));
    }
    render(rule, ctx) {}
    renderCreationOverlay(ctx) {}

    // --- Rule storage ---
    add(rule) {
        rule.id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        this.rules.push(rule);
    }
    remove(id) {
        this.rules = this.rules.filter(r => r.id !== id);
    }
    ruleToText(rule) {
        return JSON.stringify(rule);
    }
}
