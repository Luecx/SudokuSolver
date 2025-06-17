import { BooleanOption } from "./option_bool.js";
import { NumberOption } from "./option_number.js";
import { StringOption } from "./option_string.js";
import { ListOption } from "./option_list.js";
import { RegionSelectorOption } from "./option_region.js";
import { createSelectionConfig } from "../board/board_selectionConfig.js";
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
        this.activeRegionSelector = null;
        this.ruleWarnings = new Map();   // rule.id -> warning string (or null)
        this.handlerWarnings = new Map(); // handler.name -> warning string (or null)

        this._setupInputFiltering();
        this._attachGlobalListeners();
        this._setupBoardListeners();
    }

    anyWarnings() {
        return this.ruleWarnings.size > 0 || this.handlerWarnings.size > 0;
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
            const container = this._getInstanceList(handler);
            if (!container) return;
            const ui = handler.getSpecificRuleScheme().map(desc => this._createFieldComponent(desc, handler, rule));
            this._createRuleCard(handler, rule, ui, container, handler.can_create_rules);
            this._refreshWarnings(); // <-- Refresh warnings when new rule is added
        });

        this.board.onEvent("ev_rule_reset", handler => {
            const container = this._getInstanceList(handler);
            if (!container) return;
            container.innerHTML = "";
            this._refreshWarnings();
        });

        this.board.onEvent("ev_rule_removed", ([handler, rule]) => {
            const card = document.getElementById(`rule-${handler.name}-${rule.id}`);
            if (card) card.remove();
            this._refreshWarnings();
        });

        this.board.onEvent("ev_rule_handler_disabled", handler => {
            const id = `rule-${handler.name.replace(/\s+/g, "-")}`;
            const wrapper = document.getElementById(id);
            if (wrapper) wrapper.remove();
            this.removeRule(handler.name);
            this._refreshWarnings();
        });
    }

    _refreshWarnings() {
        this.ruleWarnings.clear();
        this.handlerWarnings.clear();

        for (const handler of Object.values(this.ruleHandlers)) {
            // Only process if handler is enabled
            if (!this.addedRules.has(handler.name)) continue;

            const warnings = handler.getWarnings?.() || [];
            for (const { rule, warnings: ruleWarnings } of warnings) {
                if (ruleWarnings.length <= 0) continue;
                
                if (!rule)
                    this.handlerWarnings.set(handler.name, ruleWarnings.join("; "));
                else 
                    this.ruleWarnings.set(rule.id, ruleWarnings.join("; "));
            }

            if(handler.rules.some(rule => this.ruleWarnings.has(rule.id)))
                this.handlerWarnings.set(handler.name, gettext("Some rules have warnings"));
        }

        for (const handler of Object.values(this.ruleHandlers)) {
            if (!this.addedRules.has(handler.name)) continue;
            this._updateHandlerWarningIcon(handler);
            for (const rule of handler.rules) {
                this._updateRuleWarningIcon(handler, rule);
            }
        }
    }


    _updateRuleWarningIcon(handler, rule) {
        const warning = this.ruleWarnings.get(rule.id) || null;
        const card = document.getElementById(`rule-${handler.name}-${rule.id}`);
        if (!card) return;

        let icon = card.querySelector(".rule-warning-icon");
        if (!warning && icon) {
            icon.remove();
            return;
        }
        if (warning && !icon) {
            icon = document.createElement("i");
            icon.className = "fa fa-exclamation-triangle text-warning rule-warning-icon ms-2";
            icon.style.cursor = "pointer";
            icon.setAttribute("data-bs-toggle", "tooltip");
            icon.setAttribute("title", warning);
            const labelWrapper = card.querySelector("strong")?.parentNode;
            if (labelWrapper) {
                labelWrapper.appendChild(icon);
                new bootstrap.Tooltip(icon);
            }
        }
        if (warning && icon) {
            icon.setAttribute("title", warning);
            icon.setAttribute("data-bs-original-title", warning);
        }
    }

    _updateHandlerWarningIcon(handler) {
        const warning = this.handlerWarnings.get(handler.name) || null;
        const wrapper = document.getElementById(`rule-${handler.name.replace(/\s+/g, "-")}`);
        const header = wrapper?.querySelector(".accordion-header");
        if (!header) return;

        let icon = header.querySelector(".handler-warning-icon");
        if (!warning && icon) {
            icon.remove();
            return;
        }

        if (warning && !icon) {
            icon = document.createElement("i");
            icon.className = "fa fa-exclamation-triangle text-warning handler-warning-icon ms-2";
            icon.style.cursor = "pointer";
            icon.setAttribute("data-bs-toggle", "tooltip");
            icon.setAttribute("title", warning);
            const labelWrapper = header.querySelector(".accordion-button .fw-bold")?.parentNode;
            if (labelWrapper) {
                labelWrapper.appendChild(icon);
                new bootstrap.Tooltip(icon);
            }
        }
        if (warning && icon) {
            icon.setAttribute("title", warning);
            icon.setAttribute("data-bs-original-title", warning);
        }
    }

    _updateDropdown(query) {
        this.dropdownEl.innerHTML = "";
        const matches = Object.values(this.ruleHandlers)
            .filter(handler =>
                handler.name.toLowerCase().includes(query.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));

        for (const handler of matches) {
            const ruleName = handler.name;
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";

            const label = document.createElement("span");
            label.textContent = ruleName;
            li.appendChild(label);

            if (this.addedRules.has(ruleName)) {
                const checkIcon = document.createElement("i");
                checkIcon.className = "fas fa-check";
                checkIcon.style.color = "green";
                checkIcon.style.fontSize = "1rem";
                checkIcon.style.marginLeft = "0.5rem";
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

        const header = document.createElement("h2");
        header.className = "accordion-header d-flex justify-content-between align-items-center";
        header.id = `heading-${id}`;

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "accordion-button py-2 d-flex align-items-center gap-2 flex-grow-1";
        toggleBtn.type = "button";
        toggleBtn.dataset.bsToggle = "collapse";
        toggleBtn.dataset.bsTarget = `#collapse-${id}`;
        toggleBtn.setAttribute("aria-expanded", "true"); // Initially expanded
        toggleBtn.setAttribute("aria-controls", `collapse-${id}`);

        const labelWrapper = document.createElement("div");
        labelWrapper.className = "d-flex align-items-center gap-2";

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

        toggleBtn.appendChild(labelWrapper);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn btn-danger btn-spezial ms-3 d-flex align-items-center justify-content-center";
        removeBtn.innerHTML = `<i class="fa fa-times"></i>`;
        removeBtn.addEventListener("click", () => {
            handler.disable();
        });

        header.appendChild(toggleBtn);
        header.appendChild(removeBtn);

        const collapse = document.createElement("div");
        collapse.className = "accordion-collapse collapse show"; // 'show' makes it initially visible
        collapse.id = `collapse-${id}`;
        collapse.setAttribute("aria-labelledby", `heading-${id}`);
        collapse.dataset.bsParent = "#accordionContainer"; // this makes other items collapse when one is opened

        const body = document.createElement("div");
        body.className = "accordion-body d-flex flex-column gap-2";

        const generalOptions = handler.getGeneralRuleScheme().map(desc =>
            this._createFieldComponent(desc, handler, null)
        );
        generalOptions.forEach(opt => body.appendChild(opt.element));

        const instanceList = document.createElement("div");
        instanceList.className = "rule-instance-list d-flex flex-column gap-2";

        if (handler.canAddRule()) {
            const addCard = document.createElement("button");
            addCard.className = "btn btn-outline-primary w-100 my-2";
            addCard.innerHTML = `<i class="fa fa-plus me-1"></i> Add Instance`;
            addCard.addEventListener("click", () => {
                const rule = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}` };
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

        if (descriptionHTML) {
            new bootstrap.Tooltip(toggleBtn.querySelector("i"));
        }

        // collapse all other accordion items when new rule is added
        const allCollapses = this.accordionEl.querySelectorAll('.accordion-collapse');
        allCollapses.forEach(item => {
            if (item.id !== `collapse-${id}`) {
                bootstrap.Collapse.getOrCreateInstance(item).hide();
            }
        });
    }

    _getInstanceList(handler) {
        const id = `rule-${handler.name.replace(/\s+/g, "-")}`;
        return document.querySelector(`#${id} .rule-instance-list`);
    }

    _clearActiveRegionSelector(selector) {
        if (this.activeRegionSelector === selector) {
            if (this.activeRegionSelector.stop) {
                this.activeRegionSelector.stop();
            }
            this.activeRegionSelector = null;
        }
    }

    _createFieldComponent(desc, handler, rule) {
        const shared = {
            label: desc.label,
            defaultValue: rule?.fields?.[desc.key] ?? handler.fields?.[desc.key],
            onChange: ({ value }) => {
                if (rule) {
                    handler.updateRuleField(rule, desc.key, value);
                    this._refreshWarnings();
                } else {
                    handler.updateGlobalField(desc.key, value);
                    this._refreshWarnings();
                }
            },
            onDone: ({ value })  => {
                if (rule) {
                    handler.updateRuleField(rule, desc.key, value);
                    this._refreshWarnings();
                } else {
                    handler.updateGlobalField(desc.key, value);
                    this._refreshWarnings();
                }
            }
        };

        switch (desc.type) {
            case "boolean":
                return new BooleanOption(shared);
            case "list":
                return new ListOption({
                    ...shared,
                    max_num_count: desc.max_num_count || 4,
                    min: desc.min ?? 0,
                    max: desc.max ?? 9
                });
            case "number":
                return new NumberOption({
                    ...shared,
                    min: desc.min ?? 0,
                    max: desc.max ?? 100,
                    step: desc.step ?? 1
                });
            case "string":
                return new StringOption(shared);
            case "region": {
                const selector = new RegionSelectorOption({
                    ...shared,
                    board: this.board,
                    config: createSelectionConfig({
                        target: desc.regionType,
                        mode: desc.selectionMode,
                    }),
                    onStartPreSelecting: () => {
                        if (this.activeRegionSelector && this.activeRegionSelector.stop) {
                            this.activeRegionSelector.stop();
                        }
                        this.activeRegionSelector = selector;
                    },
                    onStartPostSelecting: () => {
                        const region = rule?.fields?.[desc.key];
                        if (region instanceof Region) {
                            this.board.setSelectedRegion(region.copy());
                        }
                    },
                    onDone: () => {
                        this._clearActiveRegionSelector(selector);
                    }
                });

                const observer = new MutationObserver((mutations, observerInstance) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.removedNodes) {
                            if (!node.contains(selector.element)) continue;

                            if (this.activeRegionSelector === selector) {
                                selector.stop();
                                this.activeRegionSelector = null;
                            }
                            observerInstance.disconnect();
                        }
                    }
                });
                observer.observe(this.accordionEl, { childList: true, subtree: true });

                return selector;
            }

            default:
                console.warn("Unknown option type:", desc);
                return null;
        }
    }

    _createRuleCard(handler, rule, fields, container, allowRemove = true) {
        const card = document.createElement("div");
        card.className = "rule-instance-card border rounded p-2";
        card.id = `rule-${handler.name}-${rule.id}`;

        const header = document.createElement("div");
        header.className = "d-flex justify-content-between align-items-center";
        header.style.cursor = "pointer";

        const labelWrapper = document.createElement("div");
        labelWrapper.className = "d-flex align-items-center gap-2";

        const arrowIcon = document.createElement("i");
        arrowIcon.className = "fas fa-fw transition-icon";
        arrowIcon.classList.add(handler.can_create_rules ? "fa-chevron-down" : "fa-chevron-right");
        arrowIcon.style.width = "1rem"; // Optional manual width for perfect alignment

        const iconWrapper = document.createElement("span");
        iconWrapper.style.display = "inline-flex";
        iconWrapper.style.width = "1.2rem";  // Adjust as needed
        iconWrapper.style.justifyContent = "center";
        iconWrapper.appendChild(arrowIcon);
        labelWrapper.appendChild(iconWrapper);

        const label = document.createElement("strong");
        label.textContent = rule.label || `Rule #${handler.rules.length}`;
        labelWrapper.appendChild(label);

        header.appendChild(labelWrapper);

        if (allowRemove) {
            const removeBtn = document.createElement("button");
            removeBtn.className = "btn btn-sm btn-outline-danger";
            removeBtn.innerHTML = `<i class="fa fa-times"></i>`;
            removeBtn.addEventListener("click", () => {
                handler.removeRuleById(rule.id);
            });
            header.appendChild(removeBtn);
        }

        // Collapsible content with animation
        const content = document.createElement("div");
        content.className = "rule-collapse-content";
        content.style.overflow = "hidden";
        content.style.maxHeight = "0";
        content.style.transition = "max-height 0.3s ease";

        fields.forEach(opt => {
            if (opt) content.appendChild(opt.element);
        });

        if (handler.can_create_rules) {
            setTimeout(() => {
                content.style.maxHeight = content.scrollHeight + "px";
            }, 10);

            this._collapseOtherCards(container, card);
        }

        // Toggle logic
        header.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;

            const isOpen = content.style.maxHeight !== "0px";
            if (isOpen) {
                content.style.maxHeight = "0";
                arrowIcon.classList.replace("fa-chevron-down", "fa-chevron-right");
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                arrowIcon.classList.replace("fa-chevron-right", "fa-chevron-down");

                if (!handler.can_create_rules)
                    return;

                this._collapseOtherCards(container, card);
            }
        });

        // Optional: recalculate maxHeight on window resize
        window.addEventListener("resize", () => {
            if (content.style.maxHeight !== "0px") {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });

        card.appendChild(header);
        card.appendChild(content);
        container.appendChild(card);
    }

    _collapseOtherCards(container, card) {
        const allCards = container.querySelectorAll(".rule-instance-card ");
        allCards.forEach(otherCard => {
            if (otherCard === card) return; // dont' collapse this card

            const otherContent = otherCard.querySelector(".rule-collapse-content");
            if (otherContent) {
                otherContent.style.maxHeight = "0";
                const otherArrowIcon = otherCard.querySelector(".fas");
                if (otherArrowIcon)
                    otherArrowIcon.classList.replace("fa-chevron-down", "fa-chevron-right");
            }
        });
    }

    removeRule(ruleName) {
        this.addedRules.delete(ruleName);
        this._updateDropdown(this.inputEl.value.trim());
    }
}
