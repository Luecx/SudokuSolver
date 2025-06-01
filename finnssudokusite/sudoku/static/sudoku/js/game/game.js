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
        this.numpad = new InputGrid(this.keyboard);

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

        document.getElementById("validate-btn")?.addEventListener("click", () => {
            this.validateProgress();
        });

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
        this.keyboard.disable();
        this.numpad.disable();
        this.state.save_completed(this.sudokuId, this.board, this.timer);
        this.showFinishedModal();
    }

    // --- Modal functions ---
    showFinishedModal() {
        const modalEl = document.getElementById("finishedModal");
        if (!modalEl) return;

        const img           = modalEl.querySelector("#finishedImage");
        const timeText      = modalEl.querySelector("#finishedTimeText");
        const starContainer = modalEl.querySelector("#rating-stars");
        const doneButton    = modalEl.querySelector("#done-button");

        // Set random image
        if (img)
            img.src = this.finishedImages[Math.floor(Math.random() * this.finishedImages.length)];

        // Show timer
        const seconds = this.timer.getDuration() || 0;
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        if (timeText)
            timeText.textContent = `⏱️ Zeit: ${min}m ${sec}s`;

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

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') syncSaveOrSubmit();
        });
        window.addEventListener('beforeunload', () => {
            syncSaveOrSubmit();
        });
        window.addEventListener('blur', () => {
            syncSaveOrSubmit();
        });
        // Optional: submit on internal link click
        document.addEventListener('click', (e) => {
            if (e.target.closest("a")) syncSaveOrSubmit();
        });
    }

    setupThemeMenu() {
        // Define available backgrounds
        const backgrounds = {
            stone:   "url('/static/sudoku/img/game/stone.jpg')",
            glow:    "url('/static/sudoku/img/game/glow.jpg')",
            cement:  "url('/static/sudoku/img/game/cement.jpg')",
            wood:    "url('/static/sudoku/img/game/wood.jpg')",
            classic: "none"
        };

        // Apply background theme by ID
        const applyTheme = (id) => {
            if (!backgrounds.hasOwnProperty(id)) return;
            document.body.style.backgroundImage = backgrounds[id];
            localStorage.setItem("selectedTheme", id);
        };

        // Set up theme select dropdown
        const select      = document.getElementById("theme-menu");
        const savedTheme  = localStorage.getItem("selectedTheme") || "classic";

        if (!select) return;

        select.value = savedTheme;
        applyTheme(savedTheme);

        // Set up transparency slider for right pane
        const transparencySlider = document.getElementById("transparency-range");
        const rightPane          = document.querySelector(".keypad-pane");

        if (transparencySlider && rightPane) {
            const applyTransparency = (value) => {
                const alpha = Math.max(0, Math.min(1, value / 100));
                rightPane.style.backgroundColor = `rgba(255, 255, 255, ${alpha})`;
            };

            const savedTransparency = localStorage.getItem("transparencyValue");
            const initialValue      = savedTransparency !== null
                ? parseInt(savedTransparency, 10)
                : transparencySlider.value;

            transparencySlider.value = initialValue;
            applyTransparency(initialValue);

            transparencySlider.addEventListener("input", () => {
                const value = transparencySlider.value;
                applyTransparency(value);
                localStorage.setItem("transparencyValue", value);
            });
        }

        // Listen for theme selection changes
        select.addEventListener("change", () => {
            applyTheme(select.value);
        });

        // Set up number pad rotation
        const rotationCheckbox = document.getElementById("rotationNumberPad");
        const gridB            = document.getElementById("number-block");

        const applyRotationSetting = (enabled) => {
            if (!gridB) return;
            gridB.classList.toggle("reversed", enabled);
            gridB.classList.toggle("normal", !enabled);
        };

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

    async handleInitialModal() {
        const modalEl     = document.getElementById("sudokuInfoModal");
        const messageBox  = document.getElementById("sudoku-info-message");
        const startButton = document.getElementById("start-sudoku-button");
        const modal       = new bootstrap.Modal(modalEl);

        if (!modalEl)     throw new Error("Modal element not found");
        if (!messageBox)  throw new Error("Message box element not found");
        if (!startButton) throw new Error("Start button element not found");

        const completionMsg = this.state.completed_before
            ? "Dieses Sudoku wurde bereits abgeschlossen. Ein weiteres Lösen wird nicht erneut gezählt."
            : "Dies ist dein erster Versuch dieses Sudokus. Viel Erfolg!";

        const resumeMsg = this.state.resumed
            ? "Ein gespeicherter Zustand wurde gefunden. Du kannst jetzt weiterspielen."
            : "Es wurde kein gespeicherter Zustand gefunden. Du beginnst von vorne.";

        messageBox.innerHTML = `
            <div class="text-center">
                <p class="mb-3">${completionMsg}</p>
                <hr class="my-3" style="border: none; border-top: 1px solid #dee2e6;" />
                <p class="mt-3">${resumeMsg}</p>
            </div>
        `;

        return new Promise(resolve => {
            startButton.addEventListener("click", () => {
                modal.hide();
                this.timer.init();
                resolve();
            }, { once: true });
            modal.show();
        });
    }

    renderStarRatingHTML() {
        const stars         = [];
        const currentRating = this.ratingGiven || 0;

        for (let i = 0; i < 5; i++) {
            const isFilled = i < currentRating;
            const classes  = `bi star bi-star${isFilled ? "-fill" : ""}`;
            const style    = "font-size: 1.75rem; cursor: pointer; margin: 0 5px;";

            stars.push(
                `<i class="${classes}" data-rating="${i + 1}" style="${style}"></i>`
            );
        }

        return stars.join("");
    }

    renderRuleDescriptions() {
        const container = document.getElementById("rules-description");
        if (!container)
            throw new Error("Element not found: #rules-description");

        container.innerHTML = "";

        const handlers = this.board.getAllHandlers().filter(h => h.enabled);
        handlers.forEach((handler, index) => {
            const html = handler.getDescriptionPlayHTML();
            if (!html) return;

            const wrapper = document.createElement("div");
            wrapper.className = "rule-description";

            const badge = document.createElement("div");
            badge.className = "rule-badge";
            badge.textContent = index + 1;
            wrapper.appendChild(badge);

            const contentWrapper = document.createElement("div");
            contentWrapper.innerHTML = html;

            wrapper.appendChild(contentWrapper);
            container.appendChild(wrapper);
        });
    }



    setupStarRatingEvents(container) {
        const stars = container.querySelectorAll(".star");
        stars.forEach(star => {
            star.addEventListener("click", () => {
                const newRating     = parseInt(star.dataset.rating);
                this.ratingGiven    = newRating;
                container.innerHTML = this.renderStarRatingHTML();
                this.setupStarRatingEvents(container);  // rebind after re-render
            });
        });
    }

    submitCompletion() {
        // --- Exit if already completed or not valid ---
        if (!this.sudokuId || this.isCompleted || this.state.completed_before)
            return;

        this.isCompleted = true;

        // --- Build payload ---
        const payload = {
            sudoku_id:   this.sudokuId,
            time:        parseInt(this.timer.getDuration() || 0),
            board_state: this.board.contentLayer.getState()
        };

        if (this.ratingGiven != null)
            payload.rating = this.ratingGiven;

        // --- Clear local cache ---
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
                    method:  "POST",
                    headers: {
                        "Content-Type":   "application/json",
                        "X-CSRFToken":    getCSRFToken()
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
