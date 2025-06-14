// creator_rules.js

export class CreatorRules {
    constructor(parent) {
        this.parent = parent;
    }

    init() {
        this.registerBoardChangeListeners(); // activate rule-related listeners
        this.renderActiveTags();             // render initial active rule tags
    }

    registerBoardChangeListeners() {
        const events = [
            "ev_rule_handler_enabled",
            "ev_rule_handler_disabled",
            "ev_rule_added",
            "ev_rule_removed",
            "ev_rule_changed",
            "ev_rule_reset",
            "ev_rule_number_changed",
        ];
        events.forEach(event => {
            this.parent.board.onEvent(event, () => {
                this.parent.checkIfCanSubmit();
                this.renderActiveTags();
            });
        });
    }

    renderActiveTags() {
        const container = this.parent.get("active-tags-container");
        container.innerHTML = "";

        const handlers = this.parent.board.getAllHandlers();
        handlers.forEach(handler => {
            if (!handler.enabled || !handler.tag) return;
            const badge = document.createElement("span");
            badge.className = `badge me-1 mb-1 p-2 badge-${handler.tag}`;
            badge.textContent = handler.tag;
            container.appendChild(badge);
        });
    }
}
