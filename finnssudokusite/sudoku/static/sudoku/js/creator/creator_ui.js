import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./creator_rule_manager.js";
import { getCSRFToken } from "../csrf/csrf.js";
import { InputKeyboard } from "../game/input_keyboard.js";
import { InputMode } from "../game/input_constants.js";
import { CellIdx } from "../region/CellIdx.js";

class Creator {
    constructor() {
        setTimeout(() => {
            const container = document.querySelector(".board-container");
            this.init(container);
        }, 250);
    }

    init(container) {
        if (!container) throw new Error("Creator: .board-container element not found in the DOM.");

        this.board = createBoard(container);
        this.board.initBoard();
        let json = '{"fixedCells":[],"rules":[{"type":"Standard Sudoku","fields":{},"rules":[]},{"type":"Arrow","fields":{},"rules":[{"id":"1746986002490-d9w1","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":2,"c":0},{"__type__":"CellIdx","r":2,"c":1}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":3,"c":0},{"__type__":"CellIdx","r":3,"c":1},{"__type__":"CellIdx","r":3,"c":2},{"__type__":"CellIdx","r":4,"c":3}]}}},{"id":"1746986015426-mxm9","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":2,"c":3},{"__type__":"CellIdx","r":2,"c":4}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":3,"c":4},{"__type__":"CellIdx","r":3,"c":3},{"__type__":"CellIdx","r":4,"c":2},{"__type__":"CellIdx","r":5,"c":2}]}}},{"id":"1746986061300-4jud","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":2,"c":5}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":3,"c":5},{"__type__":"CellIdx","r":4,"c":5},{"__type__":"CellIdx","r":5,"c":5}]}}},{"id":"1746986069450-tj4u","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":5,"c":6}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":6,"c":5},{"__type__":"CellIdx","r":7,"c":5}]}}},{"id":"1746986078355-w4om","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":5,"c":7},{"__type__":"CellIdx","r":5,"c":8}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":6,"c":7},{"__type__":"CellIdx","r":7,"c":8},{"__type__":"CellIdx","r":8,"c":8},{"__type__":"CellIdx","r":8,"c":7},{"__type__":"CellIdx","r":8,"c":6},{"__type__":"CellIdx","r":8,"c":5},{"__type__":"CellIdx","r":8,"c":4},{"__type__":"CellIdx","r":8,"c":3},{"__type__":"CellIdx","r":8,"c":2},{"__type__":"CellIdx","r":8,"c":1},{"__type__":"CellIdx","r":8,"c":0},{"__type__":"CellIdx","r":7,"c":0}]}}},{"id":"1746986092942-q8m4","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":6,"c":0}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":5,"c":1},{"__type__":"CellIdx","r":4,"c":1}]}}},{"id":"1746986101814-muua","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":7,"c":1}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":6,"c":2},{"__type__":"CellIdx","r":6,"c":3},{"__type__":"CellIdx","r":6,"c":4}]}}},{"id":"1746986114118-asc1","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":7,"c":4}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":7,"c":3},{"__type__":"CellIdx","r":7,"c":2}]}}},{"id":"1746986126099-4dpv","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":2,"c":6},{"__type__":"CellIdx","r":2,"c":7}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":2,"c":8},{"__type__":"CellIdx","r":1,"c":8}]}}},{"id":"1746986135239-k7t4","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":1,"c":6}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":0,"c":6},{"__type__":"CellIdx","r":0,"c":5}]}}},{"id":"1746986144984-0xxy","fields":{"base":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":1,"c":6}]},"path":{"__type__":"Region","type":"cells","items":[{"__type__":"CellIdx","r":1,"c":5},{"__type__":"CellIdx","r":1,"c":4},{"__type__":"CellIdx","r":1,"c":3}]}}}]}]}'
        this.board.loadBoard(json)
        this.keyboard = new InputKeyboard(this.board, [InputMode.NumberFixed]);
        this.rule_manager = new CreatorRuleManager(this.board);

        this.analysisUnlocked = false;
        this.completeAnalysisDone = false;
        this.selectedIndex = null;
        this.solutionsRef = [];
        this.showDefinite = true;
        this.showUncertain = true;

        this.initSaveButton();
        this.initAnalysisButtons();
        this.registerBoardChangeListeners();
        this.renderActiveTags();



    }

    get(id) {
        return document.getElementById(id);
    }

    initSaveButton() {
        const btn = this.get("submit-sudoku-btn");
        if (!btn) return;

        btn.addEventListener("click", async (e) => {
            e.preventDefault();

            const loadingBox = this.get("upload-loading-box");
            const loadingText = this.get("upload-progress-text");
            const progressBar = this.get("upload-progress-bar");

            console.log(loadingBox, loadingText, progressBar)

            if (!loadingBox || !loadingText || !progressBar) return;

            // Reset visual state
            progressBar.style.width = "0%";
            progressBar.style.backgroundColor = "gold";
            progressBar.textContent = "Uploading Sudoku...";
            loadingBox.style.display = "block";
            loadingText.textContent = "Encoding Sudoku as JSON...";

            const steps = [
                "Compressing clues...",
                "Assigning digital ink...",
                "Finalizing metadata...",
                "Uploading to server...",
            ];

            let serverSuccess = null;
            let serverDone = false;

            const payload = {
                title: document.querySelector("input[name='sudoku_name']").value || "Untitled Sudoku",
                board: this.board.saveBoard(),
            };

            // Start upload in parallel
            fetch("/save-sudoku/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify(payload),
            })
                .then(res => res.json())
                .then(data => {
                    serverSuccess = data.status === "success";
                })
                .catch(err => {
                    console.error("Save error:", err);
                    serverSuccess = false;
                })
                .finally(() => {
                    serverDone = true;
                });

            // Animate bar and text
            const duration = 2000;
            const start = performance.now();
            let progress = 0;

            const animate = (now) => {
                const elapsed = now - start;
                const timeProgress = Math.min(elapsed / duration, 1);

                // If server not done: clamp at 99%
                if (!serverDone && timeProgress >= 1) {
                    progress = 0.99;
                } else {
                    progress = timeProgress;
                }

                progressBar.style.width = `${progress * 100}%`;

                const stepIndex = Math.floor(progress * steps.length);
                if (stepIndex < steps.length) {
                    loadingText.textContent = steps[stepIndex];
                }

                if (progress < 1 || !serverDone) {
                    requestAnimationFrame(animate);
                } else {
                    // Animation done & server done
                    progressBar.style.width = "100%";
                    progressBar.style.backgroundColor = serverSuccess ? "green" : "red";
                    progressBar.textContent = serverSuccess
                        ? "Upload complete"
                        : "Upload failed";
                    loadingText.textContent = serverSuccess
                        ? "Your Sudoku was saved successfully."
                        : "An error occurred during upload.";
                }
            };

            requestAnimationFrame(animate);
        });


        const box = document.getElementById("upload-loading-box");
        if (box) box.style.display = "none";

        const nameInput = document.querySelector("input[name='sudoku_name']");
        if (nameInput) {
            nameInput.addEventListener("input", () => this.checkIfCanSubmit());
        }

        this.checkIfCanSubmit();
    }

    renderAlert(type, text, html) {
        const alertBox = this.get("alertBox");
        const color = {
            warning: "warning",
            success: "success",
            danger: "danger",
        }[type];

        alertBox.innerHTML = `
            <div class="alert alert-${color}" role="alert">
                <div class="progress mb-2" style="height: 28px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-${color}" style="width: 100%;">
                        <span id="loading-text">${text}</span>
                    </div>
                </div>
                <div id="alertContent">${html}</div>
            </div>
        `;
    }

    createSolutionItem(i, solverboard, solution) {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `Solution ${i + 1}`;
        li.addEventListener("click", () => {
            const solutionList = this.get("solutionList");
            if (this.selectedIndex === i) {
                li.classList.remove("active");
                this.selectedIndex = null;
                this.board.hideSolution();
            } else {
                solutionList.querySelectorAll(".list-group-item").forEach(el => el.classList.remove("active"));
                li.classList.add("active");
                this.selectedIndex = i;
                this.board.showSolution(solverboard, solution);
            }
        });
        return li;
    }

    displaySolutions(solverboard, solutions) {
        const solutionList = this.get("solutionList");
        solutionList.innerHTML = "";
        this.solutionsRef = solutions;
        solutions.forEach((s, i) => {
            solutionList.appendChild(this.createSolutionItem(i, solverboard, s));
        });
    }

    clearAnalysisUI() {
        this.get("alertBox").innerHTML = "";
        this.get("solutionList").innerHTML = "";
        this.get("toggle-definite").classList.remove("active");
        this.get("toggle-uncertain").classList.remove("active");
        this.selectedIndex = null;
        this.board.hideSolution?.();
    }

    runNormalAnalysis() {
        const solverboard = this.board.getSolverBoard();
        this.clearAnalysisUI();
        this.renderAlert("warning", "Analyzing...", "");

        this.analysisUnlocked = false;
        this.completeAnalysisDone = false;
        this.keyboard.setEnabled(false);

        setTimeout(() => {

            const { solutions, stats } = solverboard.solve(17, 16384);

            if (solutions.length === 0 && !stats.interrupted) {
                this.renderAlert("danger", "No solution", "<p>❌ No solution exists for this puzzle.</p>");
            } else if (solutions.length === 0 && stats.interrupted) {
                this.renderAlert("danger", "Search interrupted", "<p>❌ Branching factor too high. Add more constraints.</p>");
            } else if (solutions.length === 1 && !stats.interrupted) {
                this.renderAlert("success", "1 solution", "<p>✅ Exactly one solution exists.</p>");
                this.board.showSolution(solverboard, solutions[0]);
                this.displaySolutions(solverboard, solutions);
                this.checkIfCanSubmit();
            } else {
                const msg = stats.interrupted
                    ? "⚠️ One or more solutions found, but more may exist."
                    : `❌ At least ${solutions.length} solutions found.`;

                this.renderAlert("danger", "Multiple solutions", `<p>${msg}</p>`);
                this.displaySolutions(solverboard, solutions);
                this.analysisUnlocked = true;
                this.get("start-complete-analysis-btn").disabled = false;
            }

            this.get("clear-analysis-btn").disabled = false;
        }, 50);
    }

    async runCompleteAnalysis() {
        if (!this.analysisUnlocked) {
            alert("Run normal analysis first.");
            return;
        }

        const solverboard = this.board.getSolverBoard();
        this.clearAnalysisUI();
        this.renderAlert("warning", "Analyzing...", "");

        let nodeCount = 0;
        const loadingText = () => this.get("loading-text");
        const interval = setInterval(() => {
            nodeCount += Math.floor(Math.random() * 100 + 20);
            if (loadingText()) loadingText().textContent = `${nodeCount} nodes processed...`;
        }, 100);

        const solutions = await new Promise(resolve => {
            setTimeout(() => resolve(solverboard.solveComplete()), 50);
        });

        clearInterval(interval);
        this.completeAnalysisDone = true;
        this.solutionsRef = solutions;

        if (solutions.length === 1) {
            this.renderAlert("success", "1 solution", "<p>✅ Exactly one solution found.</p>");
        } else if (solutions.length === 0) {
            this.renderAlert("danger", "No solution", "<p>❌ No solution found.</p>");
        } else {
            this.renderAlert("danger", `${solutions.length} solutions`, `<p>Multiple solutions found (${solutions.length}).</p>`);
        }

        this.displaySolutions(solverboard, solutions);
        this.get("clear-analysis-btn").disabled = false;
        this.get("toggle-definite").disabled = false;
        this.get("toggle-uncertain").disabled = false;
    }

    initAnalysisButtons() {
        const normalBtn = this.get("start-normal-analysis-btn");
        const completeBtn = this.get("start-complete-analysis-btn");
        const clearBtn = this.get("clear-analysis-btn");
        const debugBtn = this.get("debug-analysis-btn");
        const toggleDefinite = this.get("toggle-definite");
        const toggleUncertain = this.get("toggle-uncertain");

        // ✅ Disable by default
        completeBtn.disabled = true;
        clearBtn.disabled = true;
        toggleDefinite.disabled = true;
        toggleUncertain.disabled = true;

        normalBtn.addEventListener("click", () => this.runNormalAnalysis());
        completeBtn.addEventListener("click", () => this.runCompleteAnalysis());
        clearBtn.addEventListener("click", () => {
            this.clearAnalysisUI();
            this.keyboard.setEnabled(true);
            this.analysisUnlocked = false;
            this.completeAnalysisDone = false;

            // ✅ Disable again after clearing
            clearBtn.disabled = true;
            completeBtn.disabled = true;
            toggleDefinite.disabled = true;
            toggleUncertain.disabled = true;
        });

        debugBtn?.addEventListener("click", () => console.log(this.board.getSolverBoard().toString(true)));

        const toggleFn = (btn, key) => {
            if (btn.disabled) return;
            btn.classList.toggle("active");
            this[`show${key}`] = btn.classList.contains("active");
            this.board.showSolutions?.(this.board.getSolverBoard(), this.solutionsRef, this.showDefinite, this.showUncertain);
        };

        toggleDefinite?.addEventListener("click", () => toggleFn(toggleDefinite, "Definite"));
        toggleUncertain?.addEventListener("click", () => toggleFn(toggleUncertain, "Uncertain"));

        // Init tooltips
        [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(el => {
            new bootstrap.Tooltip(el, { trigger: 'hover' });
        });

    }

    checkIfCanSubmit() {
        const btn = this.get("submit-sudoku-btn");
        const name = document.querySelector("input[name='sudoku_name']")?.value?.trim();
        const hasExactlyOneSolution = this.solutionsRef.length === 1;
        const isNameValid = name.length > 0;

        // Update icon states
        this.updateStatusIcon("status-name", isNameValid);
        this.updateStatusIcon("status-solution", hasExactlyOneSolution);
        this.updateStatusIcon("status-unique", hasExactlyOneSolution); // for now same

        // Enable submit if all conditions met
        btn.disabled = !(hasExactlyOneSolution && isNameValid);
        btn.disabled = false;
    }


    updateStatusIcon(id, isValid) {
        const el = document.querySelector(`#${id} i`);
        if (!el) return;

        el.classList.remove("fa-check", "fa-times", "text-success", "text-danger");
        el.classList.add(isValid ? "fa-check" : "fa-times");
        el.classList.add(isValid ? "text-success" : "text-danger");
    }

    disableSubmit() {
        const btn = this.get("submit-sudoku-btn");
        if (btn) btn.disabled = true;
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
            this.board.onEvent(event, () => {
                this.disableSubmit();
                this.renderActiveTags();
            });
        });

    }

    renderActiveTags() {
        const container = this.get("active-tags-container");
        container.innerHTML = "";

        const handlers = this.board.getAllHandlers();
        handlers.forEach(handler => {
            if (!handler.enabled) return;

            const tagName = handler.tag;
            if (!tagName) return;

            const badge = document.createElement("span");
            badge.className = `badge me-1 mb-1 p-2 badge-${tagName}`;
            // badge.className = 'badge'
            badge.textContent = tagName;
            container.appendChild(badge);
        });
    }

}

new Creator();
