import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./creator_rule_manager.js";
import { getCSRFToken } from "../csrf/csrf.js";
import { InputKeyboard } from "../playboard/input_keyboard.js";
import { InputMode } from "../playboard/input_constants.js";

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
    }

    get(id) {
        return document.getElementById(id);
    }

    initSaveButton() {
        const btn = this.get("submit-sudoku-btn");
        if (!btn) return;

        btn.addEventListener("click", async (e) => {
            e.preventDefault();

            // === SHOW LOADING BAR ===
            const loadingBox = this.get("upload-loading-box");
            const loadingText = this.get("upload-progress-text");

            if (loadingBox && loadingText) {
                loadingBox.style.display = "block";
                loadingText.textContent = "Encoding Sudoku as JSON... 🔐";

                const steps = [
                    "Compressing clues... 🤏",
                    "Assigning digital ink... 🖋️",
                    "Finalizing metadata... 📁",
                    "Uploading to puzzle vault... 🧠",
                ];

                let i = 0;
                const interval = setInterval(() => {
                    if (i < steps.length) {
                        loadingText.textContent = steps[i++];
                    } else {
                        clearInterval(interval);
                    }
                }, 800); // ~3 seconds total
            }

            const json = this.board.saveBoard();
            const payload = {
                title: document.querySelector("input[name='sudoku_name']").value || "Untitled Sudoku",
                board: json,
            };

            try {
                const response = await fetch("/save-sudoku/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCSRFToken(),
                    },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();

                alert(data.status === "success"
                    ? `Sudoku saved! ID: ${data.sudoku_id}`
                    : `Error saving sudoku: ${data.message}`);
            } catch (err) {
                console.error("Save error:", err);
                alert("Unexpected error while saving.");
            } finally {
                // === HIDE LOADING BAR ===
                if (loadingBox) loadingBox.style.display = "none";
            }
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
            this.board.onEvent(event, () => this.disableSubmit());
        });
    }

}

new Creator();
