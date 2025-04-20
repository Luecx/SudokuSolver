export class RuleTypeHandler {
    constructor(name) {
        this.name = name;
        this.rules = [];
        this.label = name;
        this.showInCreatorUI = true;
    }

    onRegister() {}
    onStartCreating() {}
    onFinishedCreating() {}

    renderAll(ctx) {
        this.rules.forEach(rule => this.render(rule, ctx));
    }

    render(rule, ctx) {}
    renderCreationOverlay(ctx) {}

    add(rule) {
        rule.id = Date.now();
        this.rules.push(rule);
    }

    remove(id) {
        this.rules = this.rules.filter(r => r.id !== id);
    }
}
