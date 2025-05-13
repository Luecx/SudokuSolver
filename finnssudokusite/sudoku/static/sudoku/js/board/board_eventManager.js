// board_eventManager.js

/**
 * EventManager for Board interactions.
 *
 *
 *
 * SELECTION
 *
 * ev_selection_started             - [ selectionConfig ]
 * ev_selection_ended               - [ selectionConfig, Region ]
 * ev_selected_region_changed       - [ Region ]
 * ev_selected_region_cleared       - [ Region ]
 * ev_selected_region_el_added      - [ Region, ElIdx ]
 * ev_selected_region_el_removed    - [ Region, ElIdx ]
 *
 *
 * RULES
 *
 * ev_rule_handler_enabled          - [ RuleHandler ]
 * ev_rule_handler_disabled         - [ RuleHandler ]
 * ev_rule_added                    - [ RuleHandler, Rule ]
 * ev_rule_removed                  - [ RuleHandler, Rule ]
 * ev_rule_changed                  - [ RuleHandler, Rule ]
 * ev_rule_reset                    - [ RuleHandler, Rule ]
 * ev_rule_validity_changed         - [ RuleHandler, Rule ]
 *
 * ev_number_changed                - [ Region ]
 * ev_color_changed                 - [ Region ]
 * ev_candidate_changed             - [ Region ]
 */
export class EventManager {
    constructor() {
        this.listeners = new Map(); // event name -> array of callbacks
    }

    /**
     * Registers a callback for a specific event.
     * @param {string} event
     * @param {(payload: any) => void} callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Removes a callback for a specific event.
     * @param {string} event
     * @param {(payload: any) => void} callback
     */
    off(event, callback) {
        const cbs = this.listeners.get(event);
        if (!cbs) return;
        this.listeners.set(event, cbs.filter(cb => cb !== callback));
    }

    /**
     * Emits an event and notifies all listeners.
     * @param {string} event
     * @param {any} payload
     */
    emit(event, payload = {}) {
        const cbs = this.listeners.get(event);
        if (!cbs) return;
        for (const cb of cbs) {
            cb(payload);
        }
    }

    /**
     * Removes all listeners.
     */
    clearAll() {
        this.listeners.clear();
    }
}
