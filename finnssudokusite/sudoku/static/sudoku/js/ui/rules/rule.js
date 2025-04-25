export class RuleTypeHandler {
    constructor(name, board) {
        this.name = name;
        this.board = board;
        this.rules = [];
        this.fields = {};
        this.tag = "";

        // Optional instance behavior config
        this.instanceConfig = {
            allowAddRemove: true,
            fixedInstances: [] // if set, creates predefined instances
        };

        this.board.addRenderCall(this.name, this.renderAll.bind(this));
    }

    ui_generalRuleFields() {
        return [];
    }

    ui_specificRuleFields(rule = null) {
        return [];
    }

    add(rule) {
        rule.id = rule.id || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        this.rules.push(rule);
    }

    remove(id) {
        this.rules = this.rules.filter(rule => rule.id !== id);
    }

    renderAll(ctx) {
        console.log("renderAll", this.rules);
        this.rules.forEach(rule => this.render(rule, ctx));
    }

    render(rule, ctx) {}

    onFinishedCreating() {}

    ruleToText(rule) {
        return JSON.stringify(rule);
    }
}
