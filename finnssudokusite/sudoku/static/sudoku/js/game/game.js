// game.js

import { createBoard } from "../board/board.js";
import { getCSRFToken } from "../csrf/csrf.js";
import { InputKeyboard } from "./input_keyboard.js";
import { InputMode } from "./input_constants.js";
import { InputGrid } from "./input_grid.js";
import { Timer } from "./timer.js";
import { Solution } from "../solution/solution.js";
import { GameState } from "./game_state.js";

export class Game {
    constructor(options = {}) {
        this.ratingGiven = null;
        this.isCompleted = false;
        this.modalClosed = false;


        const container = document.querySelector(".board-container");
        this.board = createBoard(container);
        this.keyboard = new InputKeyboard(this.board, [
            InputMode.NumberRegular,
            InputMode.CandidateRegular,
            InputMode.CandidateCentered,
            InputMode.Color
        ]);

        this.timer = new Timer("timer");
        this.sudokuId = null;
        this.state = null;

        // Array of finished image paths
        this.finishedImages = [
            "/static/sudoku/img/done/1.png",
            "/static/sudoku/img/done/2.png",
            "/static/sudoku/img/done/4.png",
            "/static/sudoku/img/done/5.png",
            "/static/sudoku/img/done/6.png",
            "/static/sudoku/img/done/7.png",
            "/static/sudoku/img/done/8.png",
            "/static/sudoku/img/done/9.png",
            "/static/sudoku/img/done/10.png",
            "/static/sudoku/img/done/11.png",
            "/static/sudoku/img/done/12.png",
            "/static/sudoku/img/done/13.png"
        ];


        setTimeout(() => {
            this.init();
        }, 250); // wait till everything initializes before rendering the board
    }

    async init() {
        this.board.initBoard();
        const jsonData = window.puzzle_data;
        if (!jsonData) return;

        this.sudokuId = jsonData.id;
        this.board.loadBoard(jsonData.board);

        this.solution = jsonData.solution
            ? Solution.fromFlatString(jsonData.solution, this.board.gridSize)
            : null;

        this.state = new GameState();
        await this.state.load(this.sudokuId, this.board, this.timer);


        new InputGrid(this.keyboard);
        this.setupPageUnloadHandlers();
        this.setupThemeMenu();
        this.renderRuleDescriptions();

        await this.handleInitialModal();

        this.board.onEvent("ev_number_changed", () => {
            if (!this.board.contentLayer.allCellsFilled()) return;

            if (this.isBoardSolved()) {
                this.onSudokuFinished();
            } else {
                this.validateProgress();
            }
        });

        const validateBtn = document.getElementById("validate-btn");
        if (validateBtn) {
            validateBtn.addEventListener("click", () => this.validateProgress());
        }

        // highlight toggles
        document.getElementById('highlightRow').addEventListener('change', (e) => {
            this.board.cellLayer.enableRowHighlight(e.target.checked);
        });

        document.getElementById('highlightColumn').addEventListener('change', (e) => {
            this.board.cellLayer.enableColumnHighlight(e.target.checked);
        });

        document.getElementById('highlightBlock').addEventListener('change', (e) => {
            this.board.cellLayer.enableBlockHighlight(e.target.checked);
        });

        document.getElementById('highlightNumber').addEventListener('change', (e) => {
            this.board.cellLayer.enableNumberHighlight(e.target.checked);
        });

        document.getElementById('highlightCandidates').addEventListener('change', (e) => {
            this.board.cellLayer.enableCandidatesHighlight(e.target.checked);
        });
    }

    isBoardSolved() {
        if (!this.board.contentLayer.allCellsFilled())
            return false;

        if (!this.solution) 
            return false;
    
        const userInput = this.board.getUserNumbers ? this.board.getUserNumbers() : null;
        if (!userInput)
            return false;

        const diff = userInput.difference(this.solution);
        return diff === 0;
    }

    // --- New function that is triggered when the sudoku is completed ---
    onSudokuFinished() {
        console.log("Sudoku Completed!");
        this.state.save_completed(this.sudokuId, this.board, this.timer);
        this.showFinishedModal();
    }

    // --- Modal functions ---
    showFinishedModal() {
        const modalEl = document.getElementById("finishedModal");
        if (!modalEl) return;

        const img = modalEl.querySelector("#finishedImage");
        const timeText = modalEl.querySelector("#finishedTimeText");
        const starContainer = modalEl.querySelector("#rating-stars");
        const doneButton = modalEl.querySelector("#done-button");

        // Set random image
        if (img) {
            const imgSrc = this.finishedImages[Math.floor(Math.random() * this.finishedImages.length)];
            img.src = imgSrc;
        }

        // Show timer
        const seconds = this.timer.getDuration() || 0;
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        if (timeText) {
            timeText.textContent = `⏱️ Zeit: ${min}m ${sec}s`;
        }

        // Show rating stars if it's the user's first time
        if (this.state && !this.state.completed_before && starContainer) {
            starContainer.innerHTML = this.renderStarRatingHTML();
            this.setupStarRatingEvents(starContainer);
        } else if (starContainer) {
            starContainer.innerHTML = "";
        }

        // Submit only once
        const submitOnce = () => {
            if (!this.modalClosed) {
                this.submitCompletion();
                this.modalClosed = true;
            }
        };

        // Modal closed (via button or backdrop)
        modalEl.addEventListener("hidden.bs.modal", submitOnce, { once: true });

        // Done button click
        if (doneButton) {
            doneButton.addEventListener("click", submitOnce, { once: true });
        }

        // Show modal
        new bootstrap.Modal(modalEl).show();
    }


    showValidationModal(message) {
        const modalEl = document.getElementById("validationModal");
        if (!modalEl) {
            alert(message);
            return;
        }
        const modalBody = modalEl.querySelector(".modal-body");
        if (modalBody) modalBody.textContent = message;
        new bootstrap.Modal(modalEl).show();
    }

    // Called when the "Check My Progress" button is clicked.
    validateProgress() {
        if (!this.solution) {
            alert("No solution available for validation.");
            return;
        }

        const userInput = this.board.getUserNumbers?.();
        if (!userInput) {
            alert("User input extraction not available.");
            return;
        }

        const diff = userInput.difference(this.solution);
        const message = diff === 0
            ? "✅ Everything looks good so far!"
            : `❌ ${diff} number${diff === 1 ? '' : 's'} are incorrect.`;

        this.showValidationModal(message);
    }

    // --- Rest of your methods remain unchanged ---
    setupPageUnloadHandlers() {
        const syncSaveOrSubmit = () => {
            if (this.sudokuId) {
                if (this.isBoardSolved()) {
                    this.submitCompletion();
                } else {
                    this.state.save_state(this.sudokuId, this.board, this.timer);
                }
            }
        };

        window.addEventListener('beforeunload', syncSaveOrSubmit);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') syncSaveOrSubmit();
        });
        window.addEventListener('blur', syncSaveOrSubmit);

        // Optional: submit on internal link click
        document.addEventListener('click', (e) => {
            if (e.target.closest("a")) syncSaveOrSubmit();
        });
    }

    setupThemeMenu() {
        const backgrounds = {
            stone: "url('/static/sudoku/img/game/stone.jpg')",
            glow: "url('/static/sudoku/img/game/glow.jpg')",
            cement: "url('/static/sudoku/img/game/cement.jpg')",
            wood: "url('/static/sudoku/img/game/wood.jpg')",
            classic: "none"
        };

        const applyTheme = (id) => {
            if (!backgrounds.hasOwnProperty(id)) return;
            document.body.style.backgroundImage = backgrounds[id];
            localStorage.setItem("selectedTheme", id);
        };

        const select = document.getElementById("theme-menu");
        if (!select) return;
        const savedTheme = localStorage.getItem("selectedTheme") || "classic";
        select.value = savedTheme;
        applyTheme(savedTheme);

        const transparencySlider = document.getElementById("transparency-range");
        const rightPane = document.querySelector(".keypad-pane");
        if (transparencySlider && rightPane) {
            const applyTransparency = (value) => {
                const alpha = Math.max(0, Math.min(1, value / 100));
                rightPane.style.backgroundColor = `rgba(255, 255, 255, ${alpha})`;
            };
            const savedTransparency = localStorage.getItem("transparencyValue");
            const initialValue = savedTransparency !== null ? parseInt(savedTransparency, 10) : transparencySlider.value;
            transparencySlider.value = initialValue;
            applyTransparency(initialValue);
            transparencySlider.addEventListener("input", () => {
                const value = transparencySlider.value;
                applyTransparency(value);
                localStorage.setItem("transparencyValue", value);
            });
        }
        select.addEventListener("change", () => { applyTheme(select.value); });
        const rotationCheckbox = document.getElementById("rotationNumberPad");
        const gridB = document.getElementById("number-block");
        function applyRotationSetting(enabled) {
            if (!gridB) return;
            gridB.classList.toggle("reversed", enabled);
            gridB.classList.toggle("normal", !enabled);
        }
        if (rotationCheckbox && gridB) {
            const saved = localStorage.getItem("rotationNumberPad") === "true";
            rotationCheckbox.checked = saved;
            applyRotationSetting(saved);
            rotationCheckbox.addEventListener("change", () => {
                const enabled = rotationCheckbox.checked;
                localStorage.setItem("rotationNumberPad", enabled);
                applyRotationSetting(enabled);
            });
        }
    }

    renderRuleDescriptions() {
        const container = document.getElementById("rules-description");
        if (!container) return;
        container.innerHTML = "";
        for (const handler of this.board.getAllHandlers()) {
            if (handler.enabled) {
                const html = handler.getDescriptionPlayHTML();
                if (html) {
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("rule-description");
                    wrapper.innerHTML = html;
                    container.appendChild(wrapper);
                }
            }
        }
    }

    async handleInitialModal() {
        const modal = new bootstrap.Modal(document.getElementById("sudokuInfoModal"));
        const messageBox = document.getElementById("sudoku-info-message");
        const startButton = document.getElementById("start-sudoku-button");

        if (!modal || !messageBox || !startButton) {
            this.timer.init();
            return;
        }

        const messages = [];

        // --- Message 1: Completion status ---
        if (this.state.completed_before) {
            messages.push("✔️ Dieses Sudoku wurde bereits abgeschlossen. Ein weiteres Lösen wird nicht erneut gezählt.");
        } else {
            messages.push("🧩 Dies ist dein erster Versuch dieses Sudokus. Viel Erfolg!");
        }

        // --- Message 2: Resume status ---
        if (this.state.resumed) {
            messages.push("💾 Es wurde ein gespeicherter Zustand gefunden. Du kannst jetzt weiterspielen.");
        } else {
            messages.push("🆕 Es wurde kein gespeicherter Zustand gefunden. Du beginnst von vorne.");
        }

        // Combine all messages with line breaks
        messageBox.innerHTML = messages.map(m => `<p>${m}</p>`).join("");

        return new Promise(resolve => {
            startButton.addEventListener("click", () => {
                modal.hide();
                if (!this.state.completed_before) this.timer.init();
                resolve();
            }, { once: true });
            modal.show();
        });
    }

    renderStarRatingHTML() {
        return Array.from({ length: 5 }, (_, i) =>
            `<i class="bi star bi-star${i < (this.ratingGiven || 0) ? "-fill" : ""}" data-rating="${i + 1}" style="font-size: 1.75rem; cursor: pointer; margin: 0 5px;"></i>`
        ).join("");
    }

    setupStarRatingEvents(container) {
        container.querySelectorAll(".star").forEach(star => {
            star.addEventListener("click", () => {
                this.ratingGiven = parseInt(star.dataset.rating);
                container.innerHTML = this.renderStarRatingHTML();
                this.setupStarRatingEvents(container);  // rebind
            });
        });
    }

    submitCompletion() {
        if (!this.sudokuId || this.isCompleted) return;
        this.isCompleted = true;

        const payload = {
            sudoku_id: this.sudokuId,
            time: parseInt(this.timer.getDuration() || 0),
            board_state: this.board.contentLayer.getState()
        };

        if (!this.state.completed_before && this.ratingGiven != null) {
            payload.rating = this.ratingGiven;
        }

        // --- Clear local cache immediately ---
        try {
            const key = `sudoku_${this.sudokuId}`;
            localStorage.removeItem(key);
        } catch (e) {
            console.warn("Failed to clear local cache:", e);
        }

        // --- Submit to server ---
        try {
            if (navigator.sendBeacon) {
                const formData = new FormData();
                formData.append("data", JSON.stringify(payload));
                formData.append("csrfmiddlewaretoken", getCSRFToken());
                navigator.sendBeacon("/complete/", formData);
            } else {
                fetch("/complete/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCSRFToken()
                    },
                    body: JSON.stringify(payload)
                });
            }
        } catch (e) {
            console.warn("Submission failed:", e);
        }
    }

}

// --- Initialization ---
new Game();
