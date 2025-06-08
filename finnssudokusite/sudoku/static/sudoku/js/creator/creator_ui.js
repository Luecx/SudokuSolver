// Updated Creator class with solution caching

import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./creator_rule_manager.js";
import { getCSRFToken } from "../csrf/csrf.js";
import { InputKeyboard } from "../game/input_keyboard.js";
import { InputMode } from "../game/input_constants.js";
import { Solution } from "../solution/solution.js";
import { Solutions } from "../solution/solutions.js";

class Creator {
    constructor() {
        setTimeout(() => {
            const container = document.querySelector(".board-container");
            this.init(container);
        }, 250);
    }

    async init(container) {
        if (!container) throw new Error("Creator: .board-container element not found.");

        this.board = createBoard(container);
        this.board.initBoard();
        this.keyboard = new InputKeyboard(this.board, [InputMode.NumberFixed]);
        this.rule_manager = new CreatorRuleManager(this.board);

        this.preSolveNumbers = null;
        this.analysisUnlocked = false;
        this.completeAnalysisDone = false;
        this.selectedIndex = null;
        this.solutions_temp_list = [];
        this.solutions = null;
        this.showDefinite = false;
        this.showUncertain = false;


        this.stats = {
            solutions_found: 0,
            nodes_explored: 0,
            time_taken_ms: 0.0,
            interrupted_by_node_limit: false,
            interrupted_by_solution_limit: false,
            error: null
        };

        this.normalDepth = 16384;
        this.completeDepth = 1024;

        this.worker = new Worker("/static/sudoku/js/cppsolver/solver.worker.js", { type: "module" });
        this.worker.onmessage = e => this.onSolverMessage(e.data);
        this.resetSolverState();

        this.initSaveButton();
        this.initAnalysisButtons();
        this.registerBoardChangeListeners();
        this.renderActiveTags();
        this.renderSettings();
        this.checkIfCanSubmit()
    }

    resetSolverState() {
        this.solverRunning = false;
        this.solutions_temp_list = [];
        this.solutions = null;
        this.stats = {
            solutions_found: 0,
            nodes_explored: 0,
            time_taken_ms: 0.0,
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
            const btn = this.get(id);
            if (btn) btn.disabled = disabled;
        });
    }

    onSolverMessage(msg) {
        console.log(msg);
        if (msg.startsWith("[SOLUTION]")) {
            const sol = Solution.fromFlatString(msg.replace("[SOLUTION]", "").trim(), 9);
            this.solutions_temp_list.push(sol);
        } else if (msg.startsWith("[PROGRESS]")) {
            const value = parseFloat(msg.replace("[PROGRESS]", "").trim());
            const progressBar = document.querySelector(".progress-bar");
            const loadingText = this.get("loading-text");
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

        console.log(json);

        this.worker.postMessage(["solve", json, 32, this.normalDepth]);
    }

    async runCompleteAnalysis() {
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

        const { solutions_found, interrupted_by_node_limit, interrupted_by_solution_limit, error, nodes_explored, time_taken_ms } = this.stats;
        const interrupted = interrupted_by_node_limit || interrupted_by_solution_limit;

        if (error) {
            this.renderAlert("danger", "Solver Error", `<p>❌ ${error}</p>`);
        } else if (solutions_found === 0 && !interrupted) {
            this.renderAlert("danger", "No solution", "<p>❌ No solution exists for this puzzle.</p>");
        } else if (solutions_found === 1 && !interrupted) {
            this.renderAlert("success", "1 solution", `<p>✅ Exactly one solution exists.<br><small>${nodes_explored} nodes, ${time_taken_ms.toFixed(1)} ms</small></p>`);
            this.board.showSolution(this.preSolveNumbers, solutions[0]);
            this.displaySolutions(solutions);
            this.checkIfCanSubmit();
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

            let msg = `
              <div style="max-width: 260px; white-space: normal; word-wrap: break-word;">
                <div style="margin-bottom: 0.25em;">${summary}</div>
                <small>
                  <div><strong>Solutions:</strong> ${solutionText}</div>
                  <div><strong>Nodes:</strong> ${nodes_explored}</div>
                  <div><strong>Time:</strong> ${time_taken_ms.toFixed(1)} ms</div>
                </small>
              </div>
            `;

            this.renderAlert(alertType, alertContent, msg);
            this.displaySolutions(solutions);
            this.analysisUnlocked = true;
        }

        this.disableAnalysisButtons(false);
        this.get("clear-analysis-btn").disabled = false;
        this.get("start-complete-analysis-btn").disabled = !this.analysisUnlocked;

        this.completeAnalysisDone = !error && this.lastCommand === "solveComplete";
        this.get("toggle-definite").disabled = !this.completeAnalysisDone;
        this.get("toggle-uncertain").disabled = !this.completeAnalysisDone;
    }

    get(id) {
        return document.getElementById(id);
    }

    createSolutionItem(i, solution) {
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
                this.board.showSolution(this.preSolveNumbers, solution);
            }
        });
        return li;
    }

    displaySolutions(solutions) {
        const solutionList = this.get("solutionList");
        solutionList.innerHTML = "";
        solutions.forEach((s, i) => {
            solutionList.appendChild(this.createSolutionItem(i, s));
        });
    }

    clearAnalysisUI() {
        this.get("alertBox").innerHTML = "";
        this.get("solutionList").innerHTML = "";
        this.get("toggle-definite").classList.remove("active");
        this.get("toggle-uncertain").classList.remove("active");
        this.showDefinite = false;
        this.showUncertain = false;

        this.selectedIndex = null;
        this.board.hideSolution?.();
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

    initAnalysisButtons() {
        const normalBtn         = this.get("start-normal-analysis-btn");
        const completeBtn       = this.get("start-complete-analysis-btn");
        const clearBtn          = this.get("clear-analysis-btn");
        const debugBtn          = this.get("debug-analysis-btn");
        const toggleDefinite    = this.get("toggle-definite");
        const toggleUncertain   = this.get("toggle-uncertain");

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

            // Reset toggle states
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

        toggleDefinite?.addEventListener("click", () => toggleFn(toggleDefinite, "Definite"));
        toggleUncertain?.addEventListener("click", () => toggleFn(toggleUncertain, "Uncertain"));

        [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(el => {
            new bootstrap.Tooltip(el, { trigger: 'hover' });
        });
    }

    initSaveButton() {
        const btn = this.get("submit-sudoku-btn");
        if (!btn) return;

        btn.addEventListener("click", async (e) => {
            e.preventDefault();

            const box = this.get("upload-loading-box");
            const text = this.get("upload-progress-text");
            const bar = this.get("upload-progress-bar");

            if (!box || !text || !bar) return;

            bar.style.width = "0%";
            bar.style.backgroundColor = "gold";
            bar.textContent = "Uploading Sudoku...";
            box.style.display = "block";
            text.textContent = "Encoding Sudoku as JSON...";

            if (this.solutions.list.length !== 1) {
                throw new Error("Expected exactly one solution before saving.");
            }

            const payload = {
                title: document.querySelector("input[name='sudoku_name']").value || "Untitled Sudoku",
                board: this.board.saveBoard(),
                solution: this.solutions.list[0].toFlatString(),
                tags: this.board.getTags()
            };

            let serverSuccess = null;
            let serverDone = false;
            let animationStartTime = performance.now();
            let animationFrameId = null;

            // start animation loop immediately
            function animate(currentTime) {
                const elapsed = currentTime - animationStartTime;
                const fakeProgress = serverDone ? 1 : Math.min(0.95, 0.1 + 0.85 * (1 - Math.exp(-elapsed / 2000)));
                
                bar.style.width = `${fakeProgress * 100}%`;
                
                if (serverDone) {
                    // final state
                    bar.style.backgroundColor = serverSuccess ? "green" : "red";
                    bar.textContent = serverSuccess ? "Upload complete" : "Upload failed";
                    text.textContent = serverSuccess ? "Your Sudoku was saved." : "Upload error.";
                    // stop animation loop
                    cancelAnimationFrame(animationFrameId);
                } else {
                    // continue animation loop
                    animationFrameId = requestAnimationFrame(animate);
                }
            }
            
            // start the animation loop
            animationFrameId = requestAnimationFrame(animate);

            // start the actual fetch request
            fetch("/save-sudoku/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify(payload),
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                text.textContent = "Processing response...";
                return res.json();
            })
            .then(data => {
                serverSuccess = data.status === "success";
                if (!serverSuccess) {
                    throw new Error(data.message || "Server returned failure status");
                }
            })
            .catch((error) => {
                serverSuccess = false;
                console.error("Save failed:", error);
                text.textContent = error.message || "Failed to save Sudoku";
            })
            .finally(() => {
                serverDone = true;
            });
        });

        document.querySelector("input[name='sudoku_name']")?.addEventListener("input", () => {
            this.checkIfCanSubmit();
        });
    }

    checkIfCanSubmit() {
        const btn = this.get("submit-sudoku-btn");
        const name = document.querySelector("input[name='sudoku_name']")?.value?.trim() || "";

        const nameValid = name.length > 0;
        const uniqueSolution = this.solutions_temp_list.length === 1;

        // Update button state
        btn.disabled = !(nameValid && uniqueSolution);

        // Update status icons
        const updateStatus = (id, isValid) => {
            const statusDiv = this.get(id);
            if (!statusDiv) return;
            const icon = statusDiv.querySelector("i");
            if (!icon) return;

            icon.classList.remove("fa-check", "fa-times", "text-success", "text-danger");
            icon.classList.add(isValid ? "fa-check" : "fa-times");
            icon.classList.add(isValid ? "text-success" : "text-danger");
        };

        updateStatus("status-name", nameValid);
        updateStatus("status-solution", uniqueSolution);
        updateStatus("status-unique", true);
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
                this.checkIfCanSubmit();
                this.renderActiveTags();
            });
        });
    }

    renderSettings() {
        const normalSelect = this.get("normal-depth-select");
        const completeSelect = this.get("complete-depth-select");

        if (normalSelect) {
            normalSelect.value = this.normalDepth.toString();
            normalSelect.addEventListener("change", () => {
                this.normalDepth = parseInt(normalSelect.value);
            });
        }

        if (completeSelect) {
            completeSelect.value = this.completeDepth.toString();
            completeSelect.addEventListener("change", () => {
                this.completeDepth = parseInt(completeSelect.value);
            });
        }
    }

    renderActiveTags() {
        const container = this.get("active-tags-container");
        container.innerHTML = "";

        const handlers = this.board.getAllHandlers();
        handlers.forEach(handler => {
            if (!handler.enabled || !handler.tag) return;
            const badge = document.createElement("span");
            badge.className = `badge me-1 mb-1 p-2 badge-${handler.tag}`;
            badge.textContent = handler.tag;
            container.appendChild(badge);
        });
    }
}

new Creator();
