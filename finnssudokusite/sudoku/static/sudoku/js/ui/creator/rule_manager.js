// === File: CreatorRuleManager.js ===
import { BooleanOption } from "./option_bool.js";
import { NumberOption } from "./option_number.js";
import { StringOption } from "./option_string.js";
import { RegionSelectorOption } from "./option_region.js";
import { createSelectionConfig } from "../board/board_selectionConfig.js";
import { SelectionMode } from "../board/board_selectionEnums.js";

export class CreatorRuleManager {
    constructor(board) {
        this.board = board;
        this.inputEl = document.getElementById("ruleSearchInput");
        this.dropdownEl = document.getElementById("ruleDropdown");
        this.accordionEl = document.getElementById("accordionContainer");

        if (!this.inputEl || !this.dropdownEl || !this.accordionEl) {
            throw new Error("CreatorRuleManager: One or more required DOM elements are missing.");
        }

        this.ruleHandlers = this.board.getAllHandlers();
        this.addedRules = new Set();

        this._setupInputFiltering();
        this._attachGlobalListeners();
        this._setupBoardListeners();
    }

    _setupInputFiltering() {
        this.inputEl.addEventListener("focus", () => this._updateDropdown(""));
        this.inputEl.addEventListener("input", () => this._updateDropdown(this.inputEl.value.trim()));
    }

    _attachGlobalListeners() {
        document.addEventListener("click", (e) => {
            if (!this.inputEl.contains(e.target) && !this.dropdownEl.contains(e.target)) {
                this.dropdownEl.style.display = "none";
            }
        });
    }

    _setupBoardListeners() {
        this.board.onEvent("ev_rule_handler_enabled", handler => {
            if (!this.addedRules.has(handler.name)) {
                this._addRuleToAccordion(handler);
            }
        });

        this.board.onEvent("ev_rule_added", ([handler, rule]) => {
            const container = this._getInstanceList(handler); // <- must get the instance list div
            if (!container) return; // Safety check
            const ui = handler.getSpecificRuleScheme().map(desc => this._createFieldComponent(desc, handler, rule));
            this._createRuleCard(handler, rule, ui, container, handler.can_create_rules);
        });

        this.board.onEvent("ev_rule_reset", handler => {
            const container = this._getInstanceList(handler);
            if (!container) return;
            container.innerHTML = "";
        });

        this.board.onEvent("ev_rule_removed", ([handler, rule]) => {
            const card = document.getElementById(`rule-${handler.name}-${rule.id}`);
            if (card) card.remove();
        });
    }

    _updateDropdown(query) {
        this.dropdownEl.innerHTML = "";
        const matches = Object.values(this.ruleHandlers).filter(handler => handler.name.toLowerCase().includes(query.toLowerCase()));

        for (const handler of matches) {
            const ruleName = handler.name;
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.textContent = ruleName;

            if (this.addedRules.has(ruleName)) {
                li.classList.add("text-muted");
                li.innerHTML += '<span class="badge bg-success rounded-pill">✔</span>';
                li.style.pointerEvents = "none";
            } else {
                li.addEventListener("click", () => handler.enable());
            }

            this.dropdownEl.appendChild(li);
        }

        this.dropdownEl.style.display = matches.length ? "block" : "none";
    }

    _addRuleToAccordion(handler) {
        const ruleName = handler.name;
        const id = ruleName.replace(/\s+/g, "-");
        if (this.addedRules.has(ruleName)) return;
        this.addedRules.add(ruleName);
        this._updateDropdown(this.inputEl.value.trim());

        const wrapper = document.createElement("div");
        wrapper.className = "accordion-item";
        wrapper.id = `rule-${id}`;

        const header = document.createElement("h2");
        header.className = "accordion-header d-flex justify-content-between align-items-center";

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "accordion-button collapsed py-2 flex-grow-1";
        toggleBtn.type = "button";
        toggleBtn.dataset.bsToggle = "collapse";
        toggleBtn.dataset.bsTarget = `#collapse-${id}`;
        toggleBtn.innerText = ruleName;

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-sm btn-danger ms-2";
        removeBtn.innerHTML = `<i class="fa fa-times"></i>`;
        removeBtn.addEventListener("click", () => {
            wrapper.remove();
            this.removeRule(ruleName);
        });

        header.appendChild(toggleBtn);
        header.appendChild(removeBtn);

        const collapse = document.createElement("div");
        collapse.className = "accordion-collapse collapse";
        collapse.id = `collapse-${id}`;

        const body = document.createElement("div");
        body.className = "accordion-body";

        const generalOptions = handler.getGeneralRuleScheme().map(desc =>
            this._createFieldComponent(desc, handler, null)
        );
        generalOptions.forEach(opt => body.appendChild(opt.element));

        const instanceList = document.createElement("div");
        instanceList.className = "rule-instance-list d-flex flex-column gap-2";

        if (handler.canAddRule()) {
            const addCard = document.createElement("button");
            addCard.className = "btn btn-outline-primary w-100 my-2";
            addCard.innerHTML = `<i class="fa fa-plus me-1"></i> Add Rule`;
            addCard.addEventListener("click", () => {
                const rule = {
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
                };
                handler.rules.push(rule); // proper way: manually add to rules
                handler.initializeRuleFields(rule);
                handler.board.emitEvent("ev_rule_added", [handler, rule]);
                handler.board.triggerRender();
            });
            body.appendChild(addCard);
        }

        body.appendChild(instanceList);
        collapse.appendChild(body);
        wrapper.appendChild(header);
        wrapper.appendChild(collapse);
        this.accordionEl.appendChild(wrapper);
    }

    _getInstanceList(handler) {
        const id = `rule-${handler.name.replace(/\s+/g, "-")}`;
        return document.querySelector(`#${id} .rule-instance-list`);
    }

    _createFieldComponent(desc, handler, rule) {
        const shared = {
            label: desc.label,
            id: `${handler.name}-${rule?.id ?? "global"}-${desc.key}`,
            defaultValue: rule?.fields?.[desc.key] ?? handler.fields?.[desc.key],
            onDone: ({ value }) => {
                if (rule) handler.updateRuleField(rule, desc.key, value);
                else handler.updateGlobalField(desc.key, value);
            }
        };

        console.log(desc);
        switch (desc.type) {

            case "boolean": return new BooleanOption(shared);
            case "number": return new NumberOption({ ...shared, min: desc.min ?? 0, max: desc.max ?? 100, step: desc.step ?? 1 });
            case "string": return new StringOption(shared);
            case "region":
                return new RegionSelectorOption({
                    ...shared,
                    board: this.board,
                    config: createSelectionConfig({
                        target: desc.regionType,
                        mode: desc.selectionMode,
                        onItemsChanged: (items) => {
                            if (rule) handler.updateRuleField(rule, desc.key, items);
                            else handler.updateGlobalField(desc.key, items);
                        }
                    })
                });


            default:
                console.warn("Unknown option type:", desc);
                return null;
        }
    }

    _createRuleCard(handler, rule, fields, container, allowRemove = true) {
        const card = document.createElement("div");
        card.className = "rule-instance-card border rounded p-3 bg-light position-relative";
        card.id = `rule-${handler.name}-${rule.id}`;

        const header = document.createElement("div");
        header.className = "d-flex justify-content-between align-items-center mb-2";

        const label = document.createElement("strong");
        label.textContent = rule.label || `Rule #${handler.rules.length}`;

        header.appendChild(label);

        if (allowRemove) {
            const removeBtn = document.createElement("button");
            removeBtn.className = "btn btn-sm btn-outline-danger";
            removeBtn.innerHTML = `<i class="fa fa-times"></i>`;
            removeBtn.addEventListener("click", () => {
                handler.removeRuleById(rule.id);
            });
            header.appendChild(removeBtn);
        }

        card.appendChild(header);
        fields.forEach(opt => {
            if (opt) card.appendChild(opt.element);
        });
        container.appendChild(card);
    }

    removeRule(ruleName) {
        this.addedRules.delete(ruleName);
        this._updateDropdown(this.inputEl.value.trim());
    }
}
