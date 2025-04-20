import RuleType from './rule_types.js';

export function setupCreatorUI(Board) {
    const handlers = Board.getAllHandlers();
    const accordion = document.getElementById("ruleAccordion");

    handlers.forEach(handler => {
        const id = capitalize(handler.name);

        accordion.insertAdjacentHTML("beforeend", `
            <div class="accordion-item mb-2">
                <h2 class="accordion-header px-3 d-flex align-items-center" id="heading${id}">
                    <span id="check${id}" class="me-2 text-success" style="width:1.2em"></span>
                    <button class="accordion-button collapsed flex-grow-1 py-1"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapse${id}"
                            aria-expanded="false"
                            aria-controls="collapse${id}"
                            data-handler-name="${handler.name}">
                        ${handler.label}
                    </button>
                </h2>
                <div id="collapse${id}"
                     class="accordion-collapse collapse"
                     data-bs-parent="#ruleAccordion"
                     aria-labelledby="heading${id}">
                    <div class="accordion-body p-2">
                        <ul id="list${id}" class="list-group list-group-flush"></ul>
                    </div>
                </div>
            </div>
        `);

        const collapseEl = document.getElementById(`collapse${id}`);
        if (collapseEl) new bootstrap.Collapse(collapseEl, { toggle: false });

        renderList(handler, document.getElementById(`list${id}`));
    });

    document.querySelectorAll(".accordion-button").forEach(btn => {
        btn.addEventListener("click", () => {
            const name = btn.dataset.handlerName;
            if (Board.getCurrentHandlerName() && Board.getCurrentHandlerName() !== name) {
                Board.stopHandler();
                Board.render();
            }
        });
    });

    const originalRender = Board.render;
    Board.render = () => {
        handlers.forEach(handler => {
            const ul = document.getElementById("list" + capitalize(handler.name));
            if (ul) renderList(handler, ul);
        });
        originalRender();
        updateButtons();
    };

    updateButtons();

    function renderList(handler, ul) {
        ul.innerHTML = "";
        const id = capitalize(handler.name);
        const isActive = Board.getCurrentHandlerName() === handler.name;
        const rulesLen = handler.rules.length;
        const type = handler.rule_type;

        if (type === RuleType.SINGLE_CLICK_SINGLE) {
            if (!rulesLen) {
                ul.appendChild(createAddEntry(isActive, () => {
                    Board.startHandler(handler.name);
                    Board.stopHandler();
                    Board.render();
                }));
            }
        } else {
            ul.appendChild(createAddEntry(isActive, () => {
                if (Board.getCurrentHandlerName() !== handler.name) {
                    Board.stopHandler();
                    Board.startHandler(handler.name);
                } else {
                    Board.stopHandler();
                }
                Board.render();
            }));
        }

        handler.rules.forEach(rule => {
            const li = document.createElement("li");
            li.className = "list-group-item rule-entry";

            const label = document.createElement("span");
            label.textContent = handler.ruleToText(rule);

            const removeBtn = document.createElement("button");
            removeBtn.className = "btn btn-sm btn-remove";
            removeBtn.innerHTML = '<i class="fa fa-trash"></i>';
            removeBtn.onclick = () => {
                handler.remove(rule.id);
                Board.render();
            };

            li.append(label, removeBtn);
            ul.appendChild(li);
        });

        const check = document.getElementById("check" + id);
        if (check) {
            check.innerHTML = rulesLen ? '<i class="fa fa-check-circle"></i>' : '';
        }
    }

    function createAddEntry(isActive, onClick) {
        const li = document.createElement("li");
        li.className = "add-entry";
        li.onclick = onClick;

        if (isActive) {
            li.classList.add("warning");
            li.textContent = "Stop";
        } else {
            const icon = document.createElement("i");
            icon.className = "fa fa-plus";
            li.appendChild(icon);
        }

        return li;
    }

    function updateButtons() {
        handlers.forEach(handler => {
            const id = capitalize(handler.name);
            const heading = document.getElementById("heading" + id);
            const isActive = Board.getCurrentHandlerName() === handler.name;

            if (heading) heading.classList.toggle("active-header", isActive);

            const collapseEl = document.getElementById("collapse" + id);
            if (collapseEl) {
                const inst = bootstrap.Collapse.getInstance(collapseEl);
                if (isActive) inst.show();
            }
        });
    }

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}
