import {SolverRule} from "../../solver/solverRule.js";

export class RuleTypeHandler extends SolverRule{
    constructor(name, board) {
        super();
        this.name = name;
        this.board = board;
        this.rules = [];
        this.fields = {};
        this.tag = "";
        this.enabled = false;

        this.can_create_rules = true;

        this.board.addRenderCall(this.name, this.renderAll.bind(this), 0);

        this.board.onEvent("ev_rule_added"   , () => this.board.triggerRender());
        this.board.onEvent("ev_rule_removed" , () => this.board.triggerRender());
        this.board.onEvent("ev_rule_changed" , () => this.board.triggerRender());
        this.board.onEvent("ev_rule_reset"   , () => this.board.triggerRender());

        this.reset(); // initialize with default state
    }

    // ===== Declarative Schemes (override in subclass) =====
    getGeneralRuleScheme() { return []; }
    getSpecificRuleScheme() { return []; }
    defaultRules() { return []; }

    // ===== Description (override in subclass) =====
    getDescriptionHTML() {
        return "";
    }

    // ===== Initialization Helpers =====
    initializeGlobalFields() {
        this.fields = {};
        for (const desc of this.getGeneralRuleScheme()) {
            this.fields[desc.key] = desc.default ?? null;
        }
    }
    initializeRuleFields(rule) {
        if (!rule.fields) rule.fields = {};
        for (const desc of this.getSpecificRuleScheme()) {
            if (!(desc.key in rule.fields)) {
                rule.fields[desc.key] = desc.default ?? null;
            }
        }
    }

    // ===== Reset (Entire Handler) =====
    reset() {
        this.initializeGlobalFields();
        this.board.emitEvent("ev_rule_reset", this);
        this.rules = this.defaultRules();
        this.rules.forEach(rule => this.initializeRuleFields(rule));
        this.rules.forEach(rule => this.board.emitEvent("ev_rule_added", [this, rule]))
        this.board.triggerRender();
    }

    // ===== Reset (Single Rule) =====
    resetRule(rule) {
        this.initializeRuleFields(rule);
        this.board.emitEvent("ev_rule_reset", this, rule);
        this.board.triggerRender();
    }

    // ===== State =====
    enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.board.emitEvent("ev_rule_handler_enabled", this);
            this.reset();
            this.board.triggerRender();
        }
    }

    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.rules = [];
            this.fields = {};
            this.board.emitEvent("ev_rule_handler_disabled", this);
            this.board.triggerRender();
        }
    }

    // ===== Permissions =====
    canAddRule() {
        return this.enabled && this.can_create_rules;
    }

    canDeleteRule(rule) {
        return this.enabled && this.can_create_rules;
    }

    canInteract() {
        return this.enabled;
    }

    // ===== Rendering =====
    renderAll(ctx) {
        if (!this.enabled) return;
        for (const rule of this.rules) {
            this.render(rule, ctx);
        }
    }

    render(rule, ctx) {
        // override in subclass
    }

    // ===== Rule Access =====
    getRules() {
        return [...this.rules];
    }

    getRuleById(id) {
        return this.rules.find(rule => rule.id === id);
    }

    // ===== Rule Modification =====
    updateRuleField(ruleOrId, key, value) {
        const rule = typeof ruleOrId === "string"
            ? this.getRuleById(ruleOrId)
            : ruleOrId;

        if (!rule || !rule.fields || !(key in rule.fields)) return;

        rule.fields[key] = value;
        this.board.emitEvent("ev_rule_changed", [this, rule, key, value]);
        this.board.triggerRender();
    }

    updateGlobalField(key, value) {
        if (!(key in this.fields)) return;

        this.fields[key] = value;
        this.board.emitEvent("ev_rule_changed", [this, null, key, value]);
        this.board.triggerRender();
    }

    removeRuleById(id) {
        const rule = this.getRuleById(id);
        if (!rule) return;

        this.rules = this.rules.filter(r => r !== rule);
        this.board.emitEvent("ev_rule_removed", [this, rule]);
        this.board.triggerRender();
    }

    // ===== Rule Warnings =====
    getRuleWarnings(rule) {
        return [];
    }

    getWarnings() {
        const warnings = [];
        for (const rule of this.rules) {
            const ruleWarnings = this.getRuleWarnings(rule);
            if (ruleWarnings.length > 0) {
                warnings.push({ rule, warnings: ruleWarnings });
            }
        }
        return warnings;
    }
}
