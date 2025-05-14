import { createAllRuleHandlers } from "../rules/rules.js";
import { SelectionMode } from "./board_selectionEnums.js";
import { RegionType}     from "../region/RegionType.js";
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
            .filter(h => h.enabled)
            .map(h => h.tag);
    }

    getEdgeHints() {
        return this.currentHandler?.getEdgeHints?.() || [];
    }

    getCornerHints() {
        return this.currentHandler?.getCornerHints?.() || [];
    }

    resetRules() {
        for (const handler of this.getAllHandlers()) {
            handler.disable();
        }
    }
    saveRules() {
        return this.getAllHandlers()
            .filter(h => h.enabled)
            .map(handler => ({
                type: handler.name,
                fields: { ...handler.fields }, // copy all global fields
                rules: handler.rules.map(rule => ({ ...rule })) // copy full rule object
            }));
    }

    loadRules(data) {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;

        for (const { type, fields, rules } of parsed) {
            const handler = this.handlers[type];
            if (!handler) {
                console.warn(`Unknown handler type: ${type}`);
                continue;
            }

            handler.enable();

            // Restore global fields
            if (fields) {
                for (const [key, value] of Object.entries(fields)) {
                    handler.updateGlobalField(key, value);
                }
            }

            // Restore full rules
            if (rules) {
                handler.rules = []; // Clear existing rules
                for (const rule of rules) {
                    const restoredRule = { ...rule };
                    handler.initializeRuleFields(restoredRule); // ensure all needed fields exist
                    handler.rules.push(restoredRule);
                }
            }
        }
    }


}
