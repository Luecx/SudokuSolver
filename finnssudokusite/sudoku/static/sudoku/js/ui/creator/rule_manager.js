// === File: CreatorRuleManager.js ===
import { BooleanOption } from "./option_bool.js";
import { NumberOption } from "./option_number.js";
import { StringOption } from "./option_string.js";
import { RegionSelectorOption } from "./option_region.js";
import { createSelectionConfig } from "../board/board_selectionConfig.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import { Region } from "../region/Region.js";

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

        this.board.onEvent("ev_rule_handler_disabled", handler => {
            const id = `rule-${handler.name.replace(/\s+/g, "-")}`;
            const wrapper = document.getElementById(id);
            if (wrapper) {
                wrapper.remove();
            }
            this.removeRule(handler.name); // <- remove from addedRules set + update dropdown
        });
    }

    _updateDropdown(query) {
        this.dropdownEl.innerHTML = "";
        const matches = Object.values(this.ruleHandlers).filter(handler =>
            handler.name.toLowerCase().includes(query.toLowerCase())
        );

        for (const handler of matches) {
            const ruleName = handler.name;
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";

            const label = document.createElement("span");
            label.textContent = ruleName;
            li.appendChild(label);

            if (this.addedRules.has(ruleName)) {
                const checkIcon = document.createElement("i");
                checkIcon.className = "fas fa-check"; // or "fa-solid fa-check" if you're using FA6
                checkIcon.style.color = "green";
                checkIcon.style.fontSize = "1rem"; // small checkmark
                checkIcon.style.marginLeft = "0.5rem"; // small space from label
                li.appendChild(checkIcon);

                li.classList.add("text-muted");
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

        // === Accordion Header ===
        const header = document.createElement("h2");
        header.className = "accordion-header d-flex justify-content-between align-items-center";

        // Left side (inside blue toggle button)
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "accordion-button collapsed py-2 d-flex align-items-center gap-2 flex-grow-1";
        toggleBtn.type = "button";
        toggleBtn.dataset.bsToggle = "collapse";
        toggleBtn.dataset.bsTarget = `#collapse-${id}`;

        const labelWrapper = document.createElement("div");
        labelWrapper.className = "d-flex align-items-center gap-2"; // group label + info tightly

        const label = document.createElement("span");
        label.className = "fw-bold";
        label.innerText = ruleName;
        labelWrapper.appendChild(label);

        const descriptionHTML = handler.getDescriptionHTML?.();
        if (descriptionHTML) {
            const infoIcon = document.createElement("i");
            infoIcon.className = "fa fa-info-circle text-muted";
            infoIcon.style.fontSize = "0.9rem";
            infoIcon.style.cursor = "pointer";
            infoIcon.setAttribute("data-bs-toggle", "tooltip");
            infoIcon.setAttribute("data-bs-html", "true");
            infoIcon.setAttribute("title", descriptionHTML);
            labelWrapper.appendChild(infoIcon);
        }

        toggleBtn.appendChild(labelWrapper); // attach wrapper into toggleBtn


        // Right side (outside blue button)
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "border-0 bg-transparent ms-2 d-flex align-items-center justify-content-center";
        removeBtn.style.width = "2rem";    // fixed width
        removeBtn.style.height = "2rem";   // fixed height
        removeBtn.style.padding = "0";
        removeBtn.style.margin = "0";
        removeBtn.style.alignSelf = "center"; // important for flex
        removeBtn.style.fontSize = "1.2rem";  // smaller icon size
        removeBtn.style.color = "red";        // icon color via button
        const icon = document.createElement("i");
        icon.className = "fas fa-times"; // or "fa-solid fa-xmark" if you use newer FA 6
        icon.style.pointerEvents = "none"; // so clicking is on button, not icon

        removeBtn.appendChild(icon);
        removeBtn.addEventListener("click", () => {
            handler.disable();
        });


        header.appendChild(toggleBtn);
        header.appendChild(removeBtn);

        // === Accordion Collapse ===
        const collapse = document.createElement("div");
        collapse.className = "accordion-collapse collapse";
        collapse.id = `collapse-${id}`;

        const body = document.createElement("div");
        body.className = "accordion-body d-flex flex-column gap-2";

        // General options
        const generalOptions = handler.getGeneralRuleScheme().map(desc =>
            this._createFieldComponent(desc, handler, null)
        );
        generalOptions.forEach(opt => body.appendChild(opt.element));

        // Instance list
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
                handler.rules.push(rule);
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

        // === Initialize Bootstrap Tooltip for info icon
        if (descriptionHTML) {
            new bootstrap.Tooltip(toggleBtn.querySelector("i"));
        }
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
            onChange: ({ value }) => {
                console.log("changed values");
                if (rule) {
                    handler.updateRuleField(rule, desc.key, value);
                } else {
                    handler.updateGlobalField(desc.key, value);
                }
            },
            onDone: ({ value })  => {
                if (rule) {
                    handler.updateRuleField(rule, desc.key, value);
                } else {
                    handler.updateGlobalField(desc.key, value);
                }
            }
        };

        switch (desc.type) {
            case "boolean":
                return new BooleanOption(shared);
            case "number":
                return new NumberOption({
                    ...shared,
                    min: desc.min ?? 0,
                    max: desc.max ?? 100,
                    step: desc.step ?? 1
                });
            case "string":
                return new StringOption(shared);
            case "region":
                return new RegionSelectorOption({
                    ...shared,
                    board: this.board,
                    config: createSelectionConfig({
                        target: desc.regionType,
                        mode: desc.selectionMode,
                    }),
                    onStart: () => {
                        const region = rule?.fields?.[desc.key];
                        console.log(region);
                        if (region instanceof Region) {
                            this.board.setSelectedRegion(region);
                        }
                    }
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
