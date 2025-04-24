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

        // UI block from handler
        const ui = handler.ui_generalRuleFields?.();

        // Create header
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

        // --- General rule options
        if (ui?.elements) {
            const generalOptions = document.createElement("div");
            generalOptions.className = "mb-3";
            ui.elements.forEach(el => generalOptions.appendChild(el));
            body.appendChild(generalOptions);
        }

        // --- Rule instance area
        const instanceList = document.createElement("div");
        instanceList.className = "rule-instance-list d-flex flex-wrap gap-2";

        // --- Add button
        const addCard = document.createElement("div");
        addCard.className = "rule-instance-add border rounded d-flex align-items-center justify-content-center";
        addCard.innerHTML = '<i class="fa fa-plus fs-4 text-muted"></i>';
        addCard.style.width = "60px";
        addCard.style.height = "60px";
        addCard.style.cursor = "pointer";
        addCard.addEventListener("click", () => {
            const newRule = handler.createInstance?.();
            if (newRule) {
                handler.add(newRule);
                this._addRuleInstance(handler, newRule, instanceList);
            }
        });

        instanceList.appendChild(addCard);
        body.appendChild(instanceList);

        collapse.appendChild(body);
        wrapper.appendChild(header);
        wrapper.appendChild(collapse);
        this.accordionEl.appendChild(wrapper);
    }


    _addRuleInstance(handler, rule, container) {
        const ruleId = rule.id || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        rule.id = ruleId;

        const ruleCard = document.createElement("div");
        ruleCard.className = "rule-instance-card border rounded p-2 position-relative d-flex align-items-center justify-content-between";
        ruleCard.style.minWidth = "120px";
        ruleCard.style.cursor = "pointer";

        // Left: rule label
        const label = document.createElement("span");
        label.className = "rule-instance-label fw-bold";
        label.innerText = `#${handler.rules.length}`;

        // Right: delete button
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-sm btn-outline-danger ms-2";
        removeBtn.innerHTML = `<i class="fa fa-times"></i>`;
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            ruleCard.remove();
            handler.remove(ruleId);
        });

        // Expandable details container
        const details = document.createElement("div");
        details.className = "rule-instance-details mt-2";
        details.style.display = "none";

        // Specific fields
        const ui = handler.ui_specificRuleFields?.(rule);
        if (ui?.elements && ui.elements.length > 0) {
            ui.elements.forEach(el => details.appendChild(el));
        }

        // Highlight + expand on click
        ruleCard.addEventListener("click", () => {
            const expanded = details.style.display === "block";

            // Collapse all others
            container.querySelectorAll(".rule-instance-card").forEach(card => {
                card.classList.remove("bg-primary", "text-white");
                card.querySelector(".rule-instance-details")?.style.setProperty("display", "none");
            });

            if (!expanded) {
                ruleCard.classList.add("bg-primary", "text-white");
                details.style.display = "block";
            }
        });

        // Compose the rule card
        ruleCard.appendChild(label);
        ruleCard.appendChild(removeBtn);
        ruleCard.appendChild(details);
        container.appendChild(ruleCard);
    }



    removeRule(ruleName) {
        this.addedRules.delete(ruleName);
        this._updateDropdown(this.inputEl.value.trim());
    }
}
