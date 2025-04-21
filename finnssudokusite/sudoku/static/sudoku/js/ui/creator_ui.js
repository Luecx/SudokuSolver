import RuleType from './rule_types.js';

export function setupCreatorUI(Board) {
    const handlers = Board.getAllHandlers();

    buildAccordion();
    attachHeaderListeners();
    wrapBoardRender();

    // ─── 1) BUILD DOM ──────────────────────────────────────────────────────────
    function buildAccordion() {
        const accordion = document.getElementById("ruleAccordion");

        handlers.forEach(handler => {
            const id = capitalize(handler.name);
            accordion.insertAdjacentHTML("beforeend", `
        <div class="accordion-item mb-2">
          <h2 class="accordion-header px-3 d-flex align-items-center" id="heading${id}">
            <span id="check${id}" class="me-2 text-success" style="width:1.2em;"></span>
            <button
              class="accordion-button collapsed flex-grow-1 py-1"
              type="button"
              aria-controls="collapse${id}"
              aria-expanded="false"
              data-handler-name="${handler.name}"
            >
              ${handler.label}
            </button>
          </h2>
          <div
            id="collapse${id}"
            class="accordion-collapse collapse"
            aria-labelledby="heading${id}"
          >
            <div class="accordion-body p-2">
              <ul id="list${id}" class="list-group list-group-flush"></ul>
            </div>
          </div>
        </div>
      `);

            // init collapse (no auto-toggle)
            const collapseEl = document.getElementById(`collapse${id}`);
            new bootstrap.Collapse(collapseEl, { toggle: false });

            // initial list render
            renderList(handler, document.getElementById(`list${id}`));
        });
    }

    // ─── 2) HEADER CLICK LOGIC ─────────────────────────────────────────────────
    function attachHeaderListeners() {
        document
            .querySelectorAll(".accordion-button[data-handler-name]")
            .forEach(btn => btn.addEventListener("click", onHeaderClick));
    }

    function onHeaderClick(evt) {
        const btn   = evt.currentTarget;
        const name  = btn.dataset.handlerName;
        const id    = capitalize(name);
        const colEl = document.getElementById("collapse" + id);
        const inst  = bootstrap.Collapse.getOrCreateInstance(colEl);
        const open  = colEl.classList.contains("show");

        // if opening a different panel, stop the old handler
        if (!open &&
            Board.getCurrentHandlerName() &&
            Board.getCurrentHandlerName() !== name
        ) {
            Board.stopHandler();
            Board.render();  // will re-sync green checks, but won't hide panels
        }

        // close any other open panel
        handlers.forEach(h => {
            const otherId  = capitalize(h.name);
            const otherEl  = document.getElementById("collapse" + otherId);
            const otherBtn = document.querySelector(
                `.accordion-button[data-handler-name="${h.name}"]`
            );
            if (otherEl.classList.contains("show") && otherId !== id) {
                bootstrap.Collapse.getInstance(otherEl).hide();
                otherBtn.classList.add("collapsed");
                otherBtn.setAttribute("aria-expanded", "false");
            }
        });

        // toggle this one
        if (open) {
            inst.hide();
            btn.classList.add("collapsed");
            btn.setAttribute("aria-expanded", "false");
        } else {
            inst.show();
            btn.classList.remove("collapsed");
            btn.setAttribute("aria-expanded", "true");
        }
    }

    // ─── 3) RENDER WRAP ───────────────────────────────────────────────────────
    function wrapBoardRender() {
        const orig = Board.render.bind(Board);
        Board.render = () => {
            handlers.forEach(h => {
                const ul = document.getElementById("list" + capitalize(h.name));
                if (ul) renderList(h, ul);
            });
            orig();
            updateButtons();
        };
        updateButtons();
    }

    // ─── 4) LIST POPULATION ───────────────────────────────────────────────────
    function renderList(handler, ul) {
        ul.innerHTML = "";
        const id       = capitalize(handler.name);
        const isActive = Board.getCurrentHandlerName() === handler.name;
        const rulesLen = handler.rules.length;
        const type     = handler.rule_type;

        // “+” or “Stop” entry inside the list
        if (type === RuleType.SINGLE_CLICK_SINGLE) {
            if (!rulesLen) {
                ul.appendChild(createAddEntry(isActive, () => {
                    Board.startHandler(handler.name);
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

        // existing rules
        handler.rules.forEach(rule => {
            const li = document.createElement("li");
            li.className = "list-group-item rule-entry";

            const span = document.createElement("span");
            span.textContent = handler.ruleToText(rule);

            const rm = document.createElement("button");
            rm.className = "btn btn-sm btn-remove";
            rm.innerHTML = '<i class="fa fa-trash"></i>';
            rm.onclick = () => {
                handler.remove(rule.id);
                Board.render();
            };

            li.append(span, rm);
            ul.appendChild(li);
        });

        // green check
        const check = document.getElementById("check" + id);
        if (check) {
            check.innerHTML = rulesLen ? '<i class="fa fa-check-circle"></i>' : '';
        }
    }

    function createAddEntry(isActive, onClick) {
        const li = document.createElement("li");
        li.className = "add-entry";
        li.onclick   = e => {
            e.stopPropagation(); // never bubble to header
            onClick();
        };

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

    // ─── 5) SYNC UI STATE ─────────────────────────────────────────────────────
    function updateButtons() {
        handlers.forEach(h => {
            const id        = capitalize(h.name);
            const heading   = document.getElementById("heading" + id);
            const collapse  = document.getElementById("collapse" + id);
            const headerBtn = document.querySelector(
                `.accordion-button[data-handler-name="${h.name}"]`
            );
            const inst      = bootstrap.Collapse.getInstance(collapse);
            const isActive  = Board.getCurrentHandlerName() === h.name;

            // highlight header
            heading.classList.toggle("active-header", isActive);

            if (isActive) {
                // ensure its panel is open
                inst.show();
                headerBtn.classList.remove("collapsed");
                headerBtn.setAttribute("aria-expanded", "true");
            }
            // **we do NOT hide() here**—that only happens on header clicks
        });
    }

    // ─── UTIL ─────────────────────────────────────────────────────────────────
    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}
