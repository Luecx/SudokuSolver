export class CreatorRuleManager {
    constructor(board) {
        this.board = board;

        this.inputEl = document.getElementById("ruleSearchInput");
        this.dropdownEl = document.getElementById("ruleDropdown");
        this.accordionEl = document.getElementById("accordionContainer");

        if (!this.inputEl || !this.dropdownEl || !this.accordionEl) {
            throw new Error("CreatorRuleManager: One or more required DOM elements are missing.");
        }

        this.ruleHandlers = this.board.getAllHandlers(); // pull handlers from board
        this.addedRules = new Set();

        this._setupInputFiltering();
        this._attachGlobalListeners();

        console.log("CreatorRuleManager initialized", {
            board: this.board,
            handlers: this.ruleHandlers,
        });
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

    _updateDropdown(query) {
        this.dropdownEl.innerHTML = "";
        const matches = Object.values(this.ruleHandlers)
            .filter(handler => handler.name.toLowerCase().includes(query.toLowerCase()));

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
                li.addEventListener("click", () => this._addRuleToAccordion(handler));
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

        // General rule options
        const generalOptions = handler.ui_generalRuleFields?.();
        if (generalOptions && generalOptions.length > 0) {
            const generalBlock = document.createElement("div");
            generalBlock.className = "mb-3";
            generalOptions.forEach(opt => generalBlock.appendChild(opt.element));
            body.appendChild(generalBlock);
        }

        // Rule instance list
        const instanceList = document.createElement("div");
        instanceList.className = "rule-instance-list d-flex flex-column gap-2";

        // Handle fixed instances
        if (handler.instanceConfig?.fixedInstances?.length > 0) {
            handler.instanceConfig.fixedInstances.forEach(template => {
                const rule = {
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    ...template,
                    location: []
                };
                handler.add(rule);
                const ui = handler.ui_specificRuleFields(rule);
                this._createRuleCard(handler, rule, ui, instanceList, false);
            });
        }

        // Add new rule button (if allowed)
        if (handler.instanceConfig?.allowAddRemove !== false) {
            const addCard = document.createElement("button");
            addCard.className = "btn btn-outline-primary w-100";
            addCard.innerHTML = `<i class="fa fa-plus me-1"></i> Add Rule`;
            addCard.addEventListener("click", () => {
                const rule = {
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
                };
                const ui = handler.ui_specificRuleFields(rule);
                handler.add(rule);
                this._createRuleCard(handler, rule, ui, instanceList, true);
            });
            body.appendChild(addCard);
        }

        body.appendChild(instanceList);
        collapse.appendChild(body);
        wrapper.appendChild(header);
        wrapper.appendChild(collapse);
        this.accordionEl.appendChild(wrapper);
    }

    _createRuleCard(handler, rule, fields, container, allowRemove = true) {
        const card = document.createElement("div");
        card.className = "rule-instance-card border rounded p-3 bg-light position-relative";

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
                handler.remove(rule.id);
                card.remove();
            });
            header.appendChild(removeBtn);
        }

        card.appendChild(header);
        fields.forEach(opt => card.appendChild(opt.element));
        container.appendChild(card);
    }

    removeRule(ruleName) {
        this.addedRules.delete(ruleName);
        this._updateDropdown(this.inputEl.value.trim());
    }
}
