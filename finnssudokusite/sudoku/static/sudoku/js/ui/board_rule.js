export class RuleTypeHandler {
    constructor(name, board) {
        this.name = name;
        this.label = name[0].toUpperCase() + name.slice(1); // e.g., "arrow" → "Arrow"
        this.board = board;
        this.rules = [];

        this.tag = "";
        this.selection_config = null;  // <--- define this per-rule to control selection
    }

    // --- Optional lifecycle hooks ---
    onRegister() {}
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
