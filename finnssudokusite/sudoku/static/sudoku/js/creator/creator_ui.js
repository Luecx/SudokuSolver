// Updated Creator class using WebAssembly Solver with event-based handling

import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./creator_rule_manager.js";
import { getCSRFToken } from "../csrf/csrf.js";
import { InputKeyboard } from "../game/input_keyboard.js";
import { InputMode } from "../game/input_constants.js";
import SolverEngine from "../cppsolver/solver.js";
import {CellIdx} from "../region/CellIdx.js";

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

        this.analysisUnlocked = false;
        this.completeAnalysisDone = false;
        this.selectedIndex = null;
        this.solutionsRef = [];
        this.showDefinite = true;
        this.showUncertain = true;

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


        this.module = await SolverEngine();
        this.module.addMessageListener(this.onSolverMessage.bind(this));
        this.resetSolverState();

        this.initSaveButton();
        this.initAnalysisButtons();
        this.registerBoardChangeListeners();
        this.renderActiveTags();
        this.renderSettings();
    }

    resetSolverState() {
        this.solverRunning = false;
        this.solverSolutions = [];
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
            this.addSolutionFromString(msg.replace("[SOLUTION]", "").trim());
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

    addSolutionFromString(flatStr) {
        const values = flatStr.split(",").map(Number);
        const board = this.board.getSolverBoard().clone();
        for (let i = 0; i < values.length; i++) {
            const r = Math.floor(i / board.size);
            const c = i % board.size;
            board.setCellForce(new CellIdx(r, c), values[i]);
        }
        this.solverSolutions.push(board);
    }

    runNormalAnalysis() {
        if (this.solverRunning) return;

        this.clearAnalysisUI();
        this.renderAlert("warning", "Analyzing...", "");
        this.disableAnalysisButtons(true);
        this.keyboard.setEnabled(false);
        this.resetSolverState();
        this.solverRunning = true;

        const json = this.board.saveBoard();

        console.log(json);

        this.module.postMessage("solve", json, 17, this.normalDepth);
    }

    async runCompleteAnalysis() {
        this.disableAnalysisButtons(true);
        if (!this.analysisUnlocked) {
            alert("Run normal analysis first.");
            return;
        }

        this.clearAnalysisUI();
        this.renderAlert("warning", "Analyzing...", "");
        this.resetSolverState();
        this.solverRunning = true;
        this.module.postMessage("solveComplete", this.board.saveBoard(), 9999, this.completeDepth);
    }

    finishSolverRun() {
        const solverboard = this.board.getSolverBoard();
        const solutions = this.solverSolutions;
        this.solverRunning = false;
        this.solutionsRef = solutions;

        const { solutions_found, interrupted_by_node_limit, interrupted_by_solution_limit, error, nodes_explored, time_taken_ms } = this.stats;

        if (error) {
            this.renderAlert("danger", "Solver Error", `<p>❌ ${error}</p>`);
        } else if (solutions_found === 0) {
            this.renderAlert("danger", "No solution", "<p>❌ No solution exists for this puzzle.</p>");
        } else if (solutions_found === 1 && !interrupted_by_solution_limit && !interrupted_by_node_limit) {
            this.renderAlert("success", "1 solution", `<p>✅ Exactly one solution exists.<br><small>${nodes_explored} nodes, ${time_taken_ms.toFixed(1)} ms</small></p>`);
            this.board.showSolution(solverboard, solutions[0]);
            this.displaySolutions(solverboard, solutions);
            this.checkIfCanSubmit();
        } else {
            let msg = "";
            if (interrupted_by_solution_limit) {
                msg = `⚠️ At least ${solutions_found} solutions found (solution limit reached).`;
            } else if (interrupted_by_node_limit) {
                msg = `⚠️ At least ${solutions_found} solutions found (node limit reached).`;
            } else {
                msg = `❌ Found ${solutions_found} solutions.`;
            }
            msg += `<br><small>${nodes_explored} nodes, ${time_taken_ms.toFixed(1)} ms</small>`;
            this.renderAlert("danger", "Multiple solutions", `<p>${msg}</p>`);
            this.displaySolutions(solverboard, solutions);
            this.analysisUnlocked = true;
        }

        this.disableAnalysisButtons(false);
        this.get("clear-analysis-btn").disabled = false;
        this.get("start-complete-analysis-btn").disabled = !this.analysisUnlocked;
        this.get("toggle-definite").disabled = !this.completeAnalysisDone;
        this.get("toggle-uncertain").disabled = !this.completeAnalysisDone;
    }


    get(id) {
        return document.getElementById(id);
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
        const normalBtn = this.get("start-normal-analysis-btn");
        const completeBtn = this.get("start-complete-analysis-btn");
        const clearBtn = this.get("clear-analysis-btn");
        const debugBtn = this.get("debug-analysis-btn");
        const toggleDefinite = this.get("toggle-definite");
        const toggleUncertain = this.get("toggle-uncertain");

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

            // Disable everything first
            this.disableAnalysisButtons(true);

            // Enable only Normal Analysis button
            const normalBtn = this.get("start-normal-analysis-btn");
            if (normalBtn) normalBtn.disabled = false;

            // Clear all solver output
            this.solverSolutions = [];
            this.solutionsRef = [];
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

            const payload = {
                title: document.querySelector("input[name='sudoku_name']").value || "Untitled Sudoku",
                board: this.board.saveBoard(),
                solution: null,
                tags: this.board.getTags()
            };

            let serverSuccess = null;
            let serverDone = false;

            fetch("/save-sudoku/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify(payload),
            })
                .then(res => res.json())
                .then(data => serverSuccess = data.status === "success")
                .catch(() => serverSuccess = false)
                .finally(() => serverDone = true);

            const animate = () => {
                const progress = serverDone ? 1 : 0.99;
                bar.style.width = `${progress * 100}%`;
                bar.style.backgroundColor = serverSuccess ? "green" : "red";
                bar.textContent = serverSuccess ? "Upload complete" : "Upload failed";
                text.textContent = serverSuccess ? "Your Sudoku was saved." : "Upload error.";
            };

            requestAnimationFrame(animate);
        });
    }

    checkIfCanSubmit() {
        const btn = this.get("submit-sudoku-btn");
        const name = document.querySelector("input[name='sudoku_name']")?.value?.trim();
        const isValid = name.length > 0 && this.solutionsRef.length === 1;
        btn.disabled = !isValid;
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
