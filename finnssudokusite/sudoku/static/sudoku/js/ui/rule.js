// import rule types
import RuleType from './rule_types.js';  // oder: import { RuleType } ...

export class RuleTypeHandler {
    constructor(name, board) {
        this.name  = name;
        this.rules = [];
        this.label = name[0].toUpperCase() + name.slice(1); // e.g., "arrow" → "Arrow"
        this.board = board;  // Each handler is tied to a specific board instance
        this.rule_type = RuleType.SINGLE_CLICK_SINGLE;
    }

    // Optional lifecycle hooks
    onRegister() {}
    onStartCreating() {}
    onCellClick(cell) {}
    onCellDrag(cells) {}
    onCellDragNewCell(cell) {}

    onFinishedCreating() {}

    // Converts a rule to a text label (can be overridden)
    ruleToText(rule) {
        return JSON.stringify(rule);
    }

    // Optional bulk render (can be overridden)
    renderAll(ctx) {
        this.rules.forEach(rule => this.render(rule, ctx));
    }

    // Optional per-rule rendering
    render(rule, ctx) {}

    // Optional overlay during creation
    renderCreationOverlay(ctx) {}

    // Add a rule with auto-generated ID
    add(rule) {
        rule.id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        this.rules.push(rule);
    }

    // Remove by ID
    remove(id) {
        this.rules = this.rules.filter(r => r.id !== id);
    }
}
