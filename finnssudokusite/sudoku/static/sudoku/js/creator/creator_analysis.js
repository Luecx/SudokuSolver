// creator_analysis.js

import { Solution } from "../solution/solution.js";
import { Solutions } from "../solution/solutions.js";

export class CreatorAnalysis {
    constructor(parent) {
        this.parent = parent;
        this.board = parent.board;
        this.keyboard = parent.keyboard;
        this.rule_manager = parent.rule_manager;

        this.normalDepth = 16384;
        this.completeDepth = 1024;

        this.resetSolverState();

        this.worker = new Worker("/static/sudoku/js/cppsolver/solver.worker.js", { type: "module" });
        this.worker.onmessage = e => this.onSolverMessage(e.data);
    }

    init() {
        this.initAnalysisButtons();
    }

    renderAlert(type, text, html) {
        const alertBox = this.parent.get("alertBox");
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

    initAnalysisButtons() {
        const get = this.parent.get.bind(this.parent);
        const normalBtn       = get("start-normal-analysis-btn");
        const completeBtn     = get("start-complete-analysis-btn");
        const clearBtn        = get("clear-analysis-btn");
        const toggleDefinite  = get("toggle-definite");
        const toggleUncertain = get("toggle-uncertain");

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
            this.resetSolverState();
            this.disableAnalysisButtons(true);
            normalBtn.disabled = false;

            this.showDefinite = false;
            this.showUncertain = false;
            toggleDefinite.classList.remove("active");
            toggleUncertain.classList.remove("active");
        });

        const toggleFn = (btn, key) => {
            if (btn.disabled || !this.solutions) return;
            btn.classList.toggle("active");
            this[`show${key}`] = btn.classList.contains("active");
            this.board.showSolutions?.(this.preSolveNumbers, this.solutions, this.showDefinite, this.showUncertain);
        };

        toggleDefinite.addEventListener("click", () => toggleFn(toggleDefinite, "Definite"));
        toggleUncertain.addEventListener("click", () => toggleFn(toggleUncertain, "Uncertain"));

        [].slice.call(document.querySelectorAll('[data-bs-toggle=\"tooltip\"]')).forEach(el => {
            new bootstrap.Tooltip(el, { trigger: 'hover' });
        });
    }

    resetSolverState() {
        this.solverRunning = false;
        this.solutions_temp_list = [];
        this.solutions = null;
        this.preSolveNumbers = null;
        this.analysisUnlocked = false;
        this.completeAnalysisDone = false;
        this.selectedIndex = null;
        this.showDefinite = false;
        this.showUncertain = false;

        this.stats = {
            solutions_found: 0,
            nodes_explored: 0,
            time_taken_ms: 0.0,
            guesses_made: 0,
            interrupted_by_node_limit: false,
            interrupted_by_solution_limit: false,
            error: null
        };
    }

    disableAnalysisButtons(disabled) {
        const ids = [
            "start-normal-analysis-btn",
            "start-complete-analysis-btn",
            "clear-analysis-btn",
            "debug-analysis-btn",
            "toggle-definite",
            "toggle-uncertain",
        ];
        ids.forEach(id => {
            const btn = this.parent.get(id);
            if (btn) btn.disabled = disabled;
        });
    }

    clearAnalysisUI() {
        const get = this.parent.get.bind(this.parent);
        get("alertBox").innerHTML = "";
        get("solutionList").innerHTML = "";
        get("toggle-definite").classList.remove("active");
        get("toggle-uncertain").classList.remove("active");
        this.showDefinite = false;
        this.showUncertain = false;
        this.selectedIndex = null;
        this.board.hideSolution?.();
    }

    onSolverMessage(msg) {
        console.debug(msg);
        if (msg.startsWith("[SOLUTION]")) {
            const sol = Solution.fromFlatString(msg.replace("[SOLUTION]", "").trim(), 9);
            this.solutions_temp_list.push(sol);
        } else if (msg.startsWith("[PROGRESS]")) {
            const value = parseFloat(msg.replace("[PROGRESS]", "").trim());
            const progressBar = document.querySelector(".progress-bar");
            const loadingText = this.parent.get("loading-text");
            if (progressBar) {
                progressBar.style.width = `${Math.floor(value * 100)}%`;
                progressBar.textContent = `${Math.floor(value * 100)}%`;
            }
            if (loadingText) {
                loadingText.textContent = `Progress: ${(value * 100).toFixed(1)}%`;
            }
        } else if (msg.startsWith("[INFO]")) {
            const content = msg.replace("[INFO]", "").trim();
            const [key, val] = content.split("=");
            if (key in this.stats) {
                if (key.startsWith("interrupted") || key === "error") {
                    this.stats[key] = val === "true" ? true : val === "false" ? false : val;
                } else {
                    this.stats[key] = parseFloat(val);
                }
            }
        } else if (msg.startsWith("[DONE]")) {
            this.finishSolverRun();
        }
    }

    runNormalAnalysis() {
        if (this.solverRunning) return;
        if (this.rule_manager.anyWarnings()) {
            alert("Please resolve all warnings before running analysis.");
            return;
        }

        this.clearAnalysisUI();
        this.renderAlert("warning", "Analyzing...", "");
        this.disableAnalysisButtons(true);
        this.resetSolverState();
        this.keyboard.setEnabled(false);
        this.solverRunning = true;
        this.lastCommand = "solve";
        this.preSolveNumbers = this.board.getFixedNumbers();

        const json = this.board.saveBoard();
        this.worker.postMessage(["solve", json, 32, this.normalDepth]);
    }

    runCompleteAnalysis() {
        this.disableAnalysisButtons(true);
        if (!this.analysisUnlocked) {
            alert("Run normal analysis first.");
            return;
        }

        if (this.rule_manager.anyWarnings()) {
            alert("Please resolve all warnings before running analysis.");
            return;
        }

        this.clearAnalysisUI();
        this.renderAlert("warning", "Analyzing...", "");
        this.resetSolverState();
        this.solverRunning = true;
        this.lastCommand = "solveComplete";
        this.completeAnalysisDone = false;
        this.preSolveNumbers = this.board.getFixedNumbers();

        const json = this.board.saveBoard();
        this.worker.postMessage(["solveComplete", json, 0, this.completeDepth]);
    }

    finishSolverRun() {
        const solutions = this.solutions_temp_list;
        this.solverRunning = false;

        try {
            this.solutions = new Solutions(solutions);
        } catch (e) {
            this.solutions = null;
            console.error("Failed to build Solutions object:", e);
        }

        const {
            solutions_found,
            interrupted_by_node_limit,
            interrupted_by_solution_limit,
            error,
            nodes_explored,
            guesses_made,
            time_taken_ms } = this.stats;
        const interrupted = interrupted_by_node_limit || interrupted_by_solution_limit;

        if (error) {
            this.renderAlert("danger", "Solver Error", `<p>❌ ${error}</p>`);
        } else if (solutions_found === 0 && !interrupted) {
            this.renderAlert("danger", "No solution", "<p>❌ No solution exists for this puzzle.</p>");
        } else if (solutions_found === 1 && !interrupted) {
            this.renderAlert("success", "1 solution", `<p>✅ Exactly one solution exists.<br><small>${nodes_explored} nodes, ${time_taken_ms.toFixed(1)} ms</small></p>`);
            this.board.showSolution(this.preSolveNumbers, solutions[0]);
            this.displaySolutions(solutions);
            this.parent.checkIfCanSubmit();
        } else {
            let summary = "";
            let solutionText = "";
            let alertType, alertContent;

            if (interrupted_by_solution_limit) {
                summary = "⚠️ Solution limit reached";
                solutionText = `At least ${solutions_found}`;
                alertType = "danger";
                alertContent = "Solution limit reached";
            } else if (interrupted_by_node_limit) {
                summary = "⚠️ Node limit reached";
                solutionText = solutions_found > 0 ? `At least ${solutions_found}` : "No solutions found";
                if (solutions_found === 1) {
                    alertType = "warning";
                    alertContent = "More solutions may exist, add more constraints";
                } else if (solutions_found > 1) {
                    alertType = "danger";
                    alertContent = "Multiple solutions found";
                } else {
                    alertType = "warning";
                    alertContent = "Node limit reached";
                }
            } else {
                summary = "❌ Multiple solutions found";
                solutionText = `${solutions_found}`;
                alertType = "danger";
                alertContent = "Multiple solutions found";
            }

            const msg = `
              <div style="max-width: 260px; white-space: normal; word-wrap: break-word;">
                <div style="margin-bottom: 0.25em;">${summary}</div>
                <small>
                  <div><strong>Solutions:</strong> ${solutionText}</div>
                  <div><strong>Nodes:</strong> ${nodes_explored}</div>
                  <div><strong>Guesses:</strong> ${guesses_made} <i class="fas fa-info-circle" data-bs-toggle="tooltip" title="A value of 0 implies the puzzle may be solvable with basic logic. A non-zero guess count does not necessarily mean it's too hard for humans—just that advanced human strategies aren't implemented."></i></div>
                  <div><strong>Time:</strong> ${time_taken_ms.toFixed(1)} ms</div>
                </small>
              </div>
            `;

            this.renderAlert(alertType, alertContent, msg);
            this.displaySolutions(solutions);
            this.analysisUnlocked = true;
        }

        this.disableAnalysisButtons(false);
        this.parent.get("clear-analysis-btn").disabled = false;
        this.parent.get("start-complete-analysis-btn").disabled = !this.analysisUnlocked;
        this.completeAnalysisDone = !error && this.lastCommand === "solveComplete";
        this.parent.get("toggle-definite").disabled = !this.completeAnalysisDone;
        this.parent.get("toggle-uncertain").disabled = !this.completeAnalysisDone;
    }

    createSolutionItem(i, solution) {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `Solution ${i + 1}`;
        li.addEventListener("click", () => {
            const solutionList = this.parent.get("solutionList");
            if (this.selectedIndex === i) {
                li.classList.remove("active");
                this.selectedIndex = null;
                this.board.hideSolution();
            } else {
                solutionList.querySelectorAll(".list-group-item").forEach(el => el.classList.remove("active"));
                li.classList.add("active");
                this.selectedIndex = i;
                this.board.showSolution(this.preSolveNumbers, solution);
            }
        });
        return li;
    }

    displaySolutions(solutions) {
        const solutionList = this.parent.get("solutionList");
        solutionList.innerHTML = "";
        solutions.forEach((s, i) => {
            solutionList.appendChild(this.createSolutionItem(i, s));
        });
    }
}
