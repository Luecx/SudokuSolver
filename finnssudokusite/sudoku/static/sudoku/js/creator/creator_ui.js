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
        if (!container) {
            throw new Error("Creator: .board-container element not found in the DOM.");
        }

        this.board = createBoard(container);
        this.board.initBoard();
        this.keyboard = new InputKeyboard(this.board, [InputMode.NumberFixed]);
        this.rule_manager = new CreatorRuleManager(this.board);

        this.analysisUnlocked = false;
        this.completeAnalysisDone = false;

        this.initTestButton();
        this.initSaveButton();
        this.initAnalysisButtons();
    }

    initTestButton() {
        const btn = document.getElementById("test-sudoku-btn");
        if (!btn) return;
        btn.addEventListener("click", () => {
            const solverboard = this.board.getSolverBoard();
            console.log(solverboard.toString(true));
        });
    }

    initSaveButton() {
        const btn = document.getElementById("submit-sudoku-btn");
        if (!btn) return;

        btn.addEventListener("click", async (e) => {
            e.preventDefault();
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
                if (data.status === "success") {
                    alert(`Sudoku saved! ID: ${data.sudoku_id}`);
                } else {
                    alert(`Error saving sudoku: ${data.message}`);
                }
            } catch (error) {
                console.error("Save error:", error);
                alert("Unexpected error while saving.");
            }
        });
    }

    initAnalysisButtons() {
        const normalBtn = document.getElementById("start-normal-analysis-btn");
        const completeBtn = document.getElementById("start-complete-analysis-btn");
        const clearBtn = document.getElementById("clear-analysis-btn");
        const debugBtn = document.getElementById("debug-analysis-btn");
        const toggleDefinite = document.getElementById("toggle-definite");
        const toggleUncertain = document.getElementById("toggle-uncertain");
        const alertBox = document.getElementById("alertBox");
        const solutionList = document.getElementById("solutionList");

        let selectedIndex = null;
        let solutionsRef = [];
        let showDefinite = true;
        let showUncertain = true;

        const setButtonState = (el, enabled) => el && (el.disabled = !enabled);

        const clearSelectedListItem = () => {
            selectedIndex = null;
            solutionList.querySelectorAll(".list-group-item").forEach(el => el.classList.remove("active"));
            this.board.hideSolution?.();
        };

        const debugAnalysis = () => {
            const solverboard = this.board.getSolverBoard();
            console.log(solverboard.toString(true));
        }

        const runNormalAnalysis = () => {
            const solverboard = this.board.getSolverBoard();
            solutionList.innerHTML = "";
            clearSelectedListItem();
            setButtonState(toggleDefinite, false);
            setButtonState(toggleUncertain, false);
            setButtonState(completeBtn, false);
            setButtonState(clearBtn, true);
            this.keyboard.setEnabled(false);
            this.analysisUnlocked = false;
            this.completeAnalysisDone = false;

            // Show initial loading bar
            alertBox.innerHTML = `
		<div class="alert alert-warning show" role="alert">
			<div class="progress mb-2" style="height: 28px;">
				<div id="loading-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-warning" style="width: 100%;">
					<span id="loading-text">Analyzing...</span>
				</div>
			</div>
			<div id="alertContent"></div>
		</div>
	`;

            setTimeout(() => {
                const { solutions, stats } = solverboard.solve(17, 16384);
                const wrapper = alertBox.querySelector(".alert");
                const bar = alertBox.querySelector(".progress-bar");
                const content = alertBox.querySelector("#alertContent");

                const displaySolutions = (solutions) => {
                    solutionsRef = solutions;
                    solutions.forEach((solution, i) => {
                        const li = document.createElement("li");
                        li.className = "list-group-item";
                        li.textContent = `Solution ${i + 1}`;
                        li.addEventListener("click", () => {
                            if (selectedIndex === i) {
                                li.classList.remove("active");
                                selectedIndex = null;
                                this.board.hideSolution();
                            } else {
                                solutionList.querySelectorAll(".list-group-item").forEach(item => item.classList.remove("active"));
                                li.classList.add("active");
                                selectedIndex = i;
                                this.board.showSolution(solverboard, solution);
                            }
                        });
                        solutionList.appendChild(li);
                    });
                };

                if (solutions.length === 0 && !stats.interrupted) {
                    wrapper.classList.replace("alert-warning", "alert-danger");
                    bar.classList.replace("bg-warning", "bg-danger");
                    bar.textContent = "No solution";
                    content.innerHTML = `<p>❌ No solution exists for this puzzle.</p>`;
                } else if (solutions.length === 0 && stats.interrupted) {
                    wrapper.classList.replace("alert-warning", "alert-danger");
                    bar.classList.replace("bg-warning", "bg-danger");
                    bar.textContent = "Search interrupted";
                    content.innerHTML = `<p>❌ Branching factor too high. Add more constraints.</p>`;
                } else if (solutions.length === 1 && !stats.interrupted) {
                    wrapper.classList.replace("alert-warning", "alert-success");
                    bar.classList.replace("bg-warning", "bg-success");
                    bar.textContent = "1 solution";
                    content.innerHTML = `<p>✅ Exactly one solution exists with certainty.</p>`;
                    this.board.showSolution(solverboard, solutions[0]);
                    displaySolutions(solutions);
                } else if (solutions.length === 1 && stats.interrupted) {
                    wrapper.classList.replace("alert-warning", "alert-warning");
                    bar.classList.replace("bg-warning", "bg-warning");
                    bar.textContent = "Partial result";
                    content.innerHTML = `<p>⚠️ One solution found, but more may exist. Run complete analysis to verify.</p>`;
                    displaySolutions(solutions);
                    setButtonState(completeBtn, true);
                    this.analysisUnlocked = true;
                } else {
                    wrapper.classList.replace("alert-warning", "alert-danger");
                    bar.classList.replace("bg-warning", "bg-danger");
                    bar.textContent = `${solutions.length} solutions`;
                    content.innerHTML = `<p>❌ At least ${solutions.length} solutions found. Run complete analysis for certainty.</p>`;
                    displaySolutions(solutions);
                    setButtonState(completeBtn, true);
                    this.analysisUnlocked = true;
                }
            }, 50);
        };


        const runCompleteAnalysis = async () => {
            if (!this.analysisUnlocked) {
                alert("Run normal analysis first.");
                return;
            }

            const solverboard = this.board.getSolverBoard();
            alertBox.innerHTML = `
				<div class="alert alert-warning show" role="alert">
					<div class="progress mb-2" style="height: 28px;">
						<div id="loading-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-warning" style="width: 100%;">
							<span id="loading-text">Analyzing...</span>
						</div>
					</div>
					<div id="alertContent"></div>
				</div>
			`;
            solutionList.innerHTML = "";
            clearSelectedListItem();

            setButtonState(normalBtn, false);
            setButtonState(completeBtn, false);
            setButtonState(clearBtn, false);
            setButtonState(toggleDefinite, false);
            setButtonState(toggleUncertain, false);

            this.keyboard.setEnabled(false);
            let nodeCount = 0;

            const loadingText = document.getElementById("loading-text");
            const nodeInterval = setInterval(() => {
                nodeCount += Math.floor(Math.random() * 100 + 20);
                if (loadingText) loadingText.textContent = `${nodeCount} nodes processed...`;
            }, 100);

            const solutions = await new Promise((resolve) => {
                setTimeout(() => {
                    const res = solverboard.solveComplete();
                    resolve(res);
                }, 50);
            });

            clearInterval(nodeInterval);
            solutionsRef = solutions;
            this.completeAnalysisDone = true;

            const resultCount = solutions.length;
            const wrapper = alertBox.querySelector(".alert");
            const bar = alertBox.querySelector(".progress-bar");
            const content = alertBox.querySelector("#alertContent");

            if (resultCount === 0) {
                wrapper.classList.replace("alert-warning", "alert-danger");
                bar.classList.replace("bg-warning", "bg-danger");
                bar.textContent = "No solution found";
                content.innerHTML = `<p>No solutions could be found for this puzzle.</p>`;
            } else if (resultCount === 1) {
                wrapper.classList.replace("alert-warning", "alert-success");
                bar.classList.replace("bg-warning", "bg-success");
                bar.textContent = "1 solution found";
                content.innerHTML = `<p>Exactly one solution found.</p>`;
            } else {
                wrapper.classList.replace("alert-warning", "alert-danger");
                bar.classList.replace("bg-warning", "bg-danger");
                bar.textContent = `${resultCount} solutions found`;
                content.innerHTML = `<p>Multiple solutions found (${resultCount}).</p>`;
            }

            solutions.forEach((solution, i) => {
                const li = document.createElement("li");
                li.className = "list-group-item";
                li.textContent = `Solution ${i + 1}`;
                li.addEventListener("click", () => {
                    if (selectedIndex === i) {
                        li.classList.remove("active");
                        selectedIndex = null;
                        this.board.hideSolution();
                    } else {
                        solutionList.querySelectorAll(".list-group-item").forEach(item => item.classList.remove("active"));
                        li.classList.add("active");
                        selectedIndex = i;
                        this.board.showSolution(solverboard, solution);
                    }
                });
                solutionList.appendChild(li);
            });

            setButtonState(normalBtn, true);
            setButtonState(clearBtn, true);
            setButtonState(toggleDefinite, true);
            setButtonState(toggleUncertain, true);
        };

        normalBtn.addEventListener("click", runNormalAnalysis);
        completeBtn.addEventListener("click", runCompleteAnalysis);
        clearBtn.addEventListener("click", () => {
            alertBox.innerHTML = "";
            solutionList.innerHTML = "";
            toggleDefinite.classList.remove("active");
            toggleUncertain.classList.remove("active");
            clearSelectedListItem();
            setButtonState(toggleDefinite, false);
            setButtonState(toggleUncertain, false);
            setButtonState(clearBtn, false);
            setButtonState(completeBtn, false);
            this.keyboard.setEnabled(true);
            this.analysisUnlocked = false;
            this.completeAnalysisDone = false;
        });
        debugBtn.addEventListener("click", debugAnalysis);

        const toggleButton = (btn, type) => {
            if (btn.disabled) return;
            btn.classList.toggle("active");

            if (type === "definite") {
                showDefinite = btn.classList.contains("active");
            } else if (type === "uncertain") {
                showUncertain = btn.classList.contains("active");
            }

            clearSelectedListItem();
            const solverboard = this.board.getSolverBoard();
            if (this.board.showSolutions && solutionsRef.length > 0) {
                this.board.showSolutions(solverboard, solutionsRef, showDefinite, showUncertain);
            }
        };

        toggleDefinite?.addEventListener("click", function () {
            toggleButton(this, "definite");
        });

        toggleUncertain?.addEventListener("click", function () {
            toggleButton(this, "uncertain");
        });

        [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(el =>
            new bootstrap.Tooltip(el)
        );
    }
}

new Creator();
