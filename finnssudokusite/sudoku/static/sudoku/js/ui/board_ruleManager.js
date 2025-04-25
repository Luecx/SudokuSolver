import { createAllRuleHandlers } from "./rules/rules.js";
import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType}     from "./region/RegionType.js";
export class RuleManager {
    constructor() {
        this.handlers = {};
        this.currentHandler = null;
    }

    registerDefaults(board) {
        this.board = board;
        const rules = createAllRuleHandlers(board);
        rules.forEach(handler => this.registerHandler(handler));
    }

    registerHandler(handler) {
        this.handlers[handler.name] = handler;
        handler.onRegister?.();
    }

    startHandler(name) {
        this.stopHandler();
        this.currentHandler = this.handlers[name];

        this.currentHandler?.onStartCreating?.();

        // 👇 NEW: tell the board what this handler wants to select
        if (this.board && this.currentHandler?.selection) {
            this.board.setSelection(this.currentHandler.selection);
            this.board.showSelectionBlue(true); // or false, depending on handler
        }
    }


    stopHandler() {
        this.currentHandler?.onFinishedCreating?.();
        this.currentHandler = null;

        if (this.board) {
            this.board.setSelection({ target: 'none', mode: 'single' }); // disable everything
            this.board.showSelectionBlue(false);
        }
    }


    getAllHandlers() {
        return Object.values(this.handlers);
    }

    getCurrentHandler() {
        return this.currentHandler;
    }

    serializeRules() {
        const clean = obj =>
            Array.isArray(obj) ? obj.map(clean) :
                (obj && typeof obj === 'object') ? Object.fromEntries(Object.entries(obj).filter(([k]) => k !== 'id').map(([k,v]) => [k, clean(v)])) :
                    obj;

        return JSON.stringify(this.getAllHandlers()
            .filter(h => h.rules?.length)
            .map(h => ({ type: h.name, rules: h.rules.map(clean) })), null, 2);
    }

    deserializeRules(json) {
        const data = typeof json === "string" ? JSON.parse(json) : json;
        for (const { type, rules } of data) {
            const handler = this.handlers[type];
            if (!handler) continue;
            rules.forEach(rule => handler.add(rule));
        }
    }

    getTags() {
        return this.getAllHandlers()
            .filter(h => h.rules?.length)
            .map(h => ({ name: h.tag }));
    }

    getEdgeHints() {
        return this.currentHandler?.getEdgeHints?.() || [];
    }

    getCornerHints() {
        return this.currentHandler?.getCornerHints?.() || [];
    }
}
