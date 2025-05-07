import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./creator_rule_manager.js";
import { SelectionMode } from "../board/board_selectionEnums.js";
import { RegionType } from "../region/RegionType.js";
import { getCSRFToken } from "../csrf/csrf.js";
import { InputKeyboard } from "../playboard/input_keyboard.js";
import { InputMode } from "../playboard/input_constants.js";

class Creator {
    constructor() {
        setTimeout(() => {
            const container = document.querySelector(".board-container");
            this.init(container);
        }, 0);
    }

    init(container) {
        if (!container) {
            throw new Error("Creator: .board-container element not found in the DOM.");
        }

        this.board = createBoard(container);
        this.board.initBoard();
        this.keyboard = new InputKeyboard(this.board, [InputMode.NumberFixed]);
        this.rule_manager = new CreatorRuleManager(this.board);

        this.initTestButton();
        this.initSaveButton();
        this.initAnalysisButton();
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

    initAnalysisButton() {
        const startBtn = document.getElementById("start-analysis-btn");
        const clearBtn = document.getElementById("clear-analysis-btn");
        const toggleDefinite = document.getElementById("toggle-definite");
        const toggleUncertain = document.getElementById("toggle-uncertain");
        const alertBox = document.getElementById("alertBox");
        const solutionList = document.getElementById("solutionList");

        if (!startBtn || !alertBox || !solutionList) return;

        let selectedIndex = null;
        let solutionsRef = [];
        let showDefinite = true;
        let showUncertain = true;

        const setButtonState = (el, enabled) => {
            el.disabled = !enabled;
        };

        const clearSelectedListItem = () => {
            selectedIndex = null;
            const items = solutionList.querySelectorAll(".list-group-item");
            items.forEach(item => item.classList.remove("active"));
            if (this.board.hideSolution) {
                this.board.hideSolution();
            }
        };

        setButtonState(clearBtn, false);
        setButtonState(toggleDefinite, false);
        setButtonState(toggleUncertain, false);

        startBtn.addEventListener("click", async () => {
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

            setButtonState(startBtn, false);
            setButtonState(clearBtn, false);
            setButtonState(toggleDefinite, false);
            setButtonState(toggleUncertain, false);

            this.keyboard.setEnabled(false);

            const loadingText = document.getElementById("loading-text");
            let nodeCount = 0;

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

            const resultCount = solutions.length || 0;
            const alertWrapper = alertBox.querySelector(".alert");
            const progressBar = alertBox.querySelector(".progress-bar");
            const alertContent = document.getElementById("alertContent");

            if (resultCount === 0) {
                alertWrapper.classList.replace("alert-warning", "alert-danger");
                progressBar.classList.replace("bg-warning", "bg-danger");
                progressBar.textContent = "No solution found";

                if (alertContent) {
                    alertContent.innerHTML = `<p>No solutions could be found for this puzzle.</p>`;
                }

                // Fix: re-enable interface
                setButtonState(startBtn, true);
                setButtonState(clearBtn, true); // allow clearing

                return;
            }


            if (resultCount === 1) {
                alertWrapper.classList.replace("alert-warning", "alert-success");
                progressBar.classList.replace("bg-warning", "bg-success");
                progressBar.textContent = "1 solution found";
                if (alertContent) {
                    alertContent.innerHTML = `<p>1 solution found.</p>`;
                }
            } else {
                alertWrapper.classList.replace("alert-warning", "alert-danger");
                progressBar.classList.replace("bg-warning", "bg-danger");
                progressBar.textContent = `Atleast ${resultCount} solutions found`;
                if (alertContent) {
                    alertContent.innerHTML = `<p>More than 1 solution found (${resultCount}).</p>`;
                }
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
                        const items = solutionList.querySelectorAll(".list-group-item");
                        items.forEach(item => item.classList.remove("active"));
                        li.classList.add("active");
                        selectedIndex = i;

                        this.board.showSolution(solverboard, solution);
                    }
                });

                solutionList.appendChild(li);
            });

            setButtonState(startBtn, true);
            setButtonState(clearBtn, true);
            setButtonState(toggleDefinite, true);
            setButtonState(toggleUncertain, true);
        });

        clearBtn.addEventListener("click", () => {
            alertBox.innerHTML = "";
            solutionList.innerHTML = "";
            toggleDefinite.classList.remove("active");
            toggleUncertain.classList.remove("active");
            clearSelectedListItem();
            setButtonState(toggleDefinite, false);
            setButtonState(toggleUncertain, false);
            setButtonState(clearBtn, false);
            this.keyboard.setEnabled(true);
        });

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

        // Initialize Bootstrap tooltips if needed
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
    }
}

new Creator();
