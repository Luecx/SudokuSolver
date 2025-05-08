
import { Region } from "../region/Region.js";
import { RegionType } from "../region/RegionType.js";
import { SolverBoard } from "../solver/solverBoard.js";

export class RuleTypeHandler {
    constructor(name, board) {
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

    /**
     * Called when a number is set on the board.
     * @param {SolverBoard} board - Current solver board state.
     * @param {SolverCell} changedCell - The cell that was updated.
     * @returns {boolean} - True if this rule made further changes to the board.
     */
    numberChanged(board, changedCell) {
        throw new Error('numberChanged() must be implemented');
    }

    /**
     * Called after numbers are placed to allow the rule to prune or alter candidates.
     * @param {SolverBoard} board - Current solver board state.
     * @returns {boolean} - True if any candidates were changed by this rule.
     */
    candidatesChanged(board) {
        throw new Error('candidatesChanged() must be implemented');
    }

    /**
     * Called to validate that the current board state is plausible under this rule.
     * @param {SolverBoard} board - Current solver board state.
     * @returns {boolean} - True if the board satisfies the rule so far.
     */
    checkPlausibility(board) {
        throw new Error('checkPlausibility() must be implemented');
    }

    /**
     * Returns a region of all cell indices that are relevant to this rule,
     * including all internal `this.fields` and, if applicable, any subrules in `this.rules`.
     *
     * This is used to determine which cells the rule is monitoring,
     * primarily for GUI highlighting or analysis.
     *
     * @param {SolverBoard} board - The board context (not required but sometimes useful).
     * @returns {Region} - A Region of type CELLS containing all relevant cell indices.
     */
    attachedCells(board) {
        let result = new Region(RegionType.CELLS);

        /**
         * Adds all attached cells from a field (if it's a Region).
         * @param {*} field
         */
        const addField = (field) => {
            if (field instanceof Region) {
                try {
                    result = result.union(field.attachedCells(board.size));
                } catch (e) {
                    console.warn(`Skipping region: ${e.message}`);
                }
            }
        };

        // Merge subrule regions
        if (Array.isArray(this.rules)) {
            for (const rule of this.rules) {
                for (const field of Object.values(rule.fields || {})) {
                    addField(field);
                }
            }
        }

        // Merge own region fields
        for (const field of Object.values(this.fields || {})) {
            addField(field);
        }

        return result;
    }
}
