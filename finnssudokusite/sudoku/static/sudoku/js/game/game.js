// game.js

import { createBoard } from "../board/board.js";
import { getCSRFToken } from "../csrf/csrf.js";
import { InputKeyboard } from "./input_keyboard.js";
import { InputMode } from "./input_constants.js";
import { InputGrid } from "./input_grid.js";
import { Timer } from "./timer.js";
import { Solution } from "../solution/solution.js";

export class Game {
    constructor(options = {}) {
        const container = document.querySelector(".board-container");
        this.board = createBoard(container);
        this.keyboard = new InputKeyboard(this.board, [
            InputMode.NumberRegular,
            InputMode.CandidateRegular,
            InputMode.CandidateCentered,
            InputMode.Color
        ]);

        this.isSaveTriggered = false;
        this.timer = new Timer("timer");
        this.sudokuId = null;
        this.isCompleted = false;
        this.saveTimer = null;
        // Array of finished image paths – adjust as needed
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

        console.log(jsonData);

        if (!jsonData) return;

        this.sudokuId = jsonData.id;
        this.board.loadBoard(jsonData.board);

        const solutionStr = jsonData.solution;  // ✅ fixed: no longer inside `board`
        if (solutionStr) {
            this.solution = Solution.fromFlatString(solutionStr, this.board.gridSize);
        } else {
            this.solution = null;
        }

        // Hook into changes: when a number is changed, check if the puzzle is finished
        this.board.onEvent("ev_number_changed", () => {
            if (this.board.contentLayer.isSolved()) {
                this.onSudokuFinished();
            }
        });

        const validateBtn = document.getElementById("validate-btn");
        if (validateBtn) {
            validateBtn.addEventListener("click", () => this.validateProgress());
        }

        let state = await this.loadGameState();
        new InputGrid(this.keyboard);

        this.setupPageUnloadHandlers();
        this.setupThemeMenu();
        this.renderRuleDescriptions();

        await this.handleInitialModal(state);
    }


    // --- New function that is triggered when the sudoku is completed ---
    onSudokuFinished() {
        // Optionally, add any game-complete logic here.
        console.log("Sudoku Completed!");
        this.showFinishedModal();
    }

    // --- Modal functions ---
    showFinishedModal() {
        // Pick a random image from the finishedImages array
        const imgSrc = this.finishedImages[
            Math.floor(Math.random() * this.finishedImages.length)
            ];

        // Find the modal container – ensure this exists in your HTML with id "finishedModal"
        const modalEl = document.getElementById("finishedModal");
        if (!modalEl) {
            console.warn("Finished modal element not found!");
            return;
        }

        // Set the modal content to show the image
        const modalBody = modalEl.querySelector(".modal-body");
        if (modalBody) {
            modalBody.innerHTML = `<img src="${imgSrc}" alt="Finished!" style="width: 100%;">`;
        }

        // Show the modal using bootstrap
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    showValidationModal(message) {
        const modalEl = document.getElementById("validationModal");
        if (!modalEl) {
            alert(message);
            return;
        }
        const modalBody = modalEl.querySelector(".modal-body");
        if (modalBody) {
            modalBody.textContent = message;
        }
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    // Called when the "Check My Progress" button is clicked.
    validateProgress() {
        if (!this.solution) {
            alert("No solution available for validation.");
            return;
        }

        // Expecting that board.getUserNumbers returns a Solution object of user-entered numbers.
        // Adjust if necessary based on your implementation.
        const userInput = this.board.getUserNumbers ? this.board.getUserNumbers() : null;
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
        window.addEventListener('beforeunload', () => {
            this.saveGameStateSync();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden')
                this.saveGameStateSync();
        });

        window.addEventListener('blur', () => {
            this.saveGameStateSync();
        });
    }

    saveGameStateSync() {
        if (!this.sudokuId || this.isCompleted) return;

        const currentTime = this.timer.getDuration() || 0;
        const status = this.board.contentLayer.isSolved() ? "completed" : "ongoing";
        this.saveToCache(currentTime, status);

        try {
            const payload = {
                sudoku_id: this.sudokuId,
                time: parseInt(currentTime),
                status: status,
                board_state: this.board.contentLayer.getState(),
            };

            if (navigator.sendBeacon) {
                const formData = new FormData();
                formData.append('data', JSON.stringify(payload));
                formData.append('csrfmiddlewaretoken', getCSRFToken());
                navigator.sendBeacon('/save-puzzle-state/', formData);
            } else {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/save-puzzle-state/', false);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
                xhr.send(JSON.stringify(payload));
            }
        } catch (error) {
            console.error("Error saving on page unload:", error);
        }
    }

    loadFromCache() {
        try {
            const cacheKey = `sudoku_${this.sudokuId}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const data = JSON.parse(cachedData);
                if (data.board_state)
                    this.board.contentLayer.loadState(data.board_state);
                this.timer.setTimer(data.time || 0);
                if (data.status === "completed") {
                    this.isCompleted = true;
                    this.showCompletedState(data);
                    return "completed";
                } else {
                    console.log("Loaded cached game state");
                    return "resume";
                }
            }
        } catch (error) {
            console.log("No cached state found or error loading:", error);
        }
        return "new";
    }

    saveToCache(currentTime, status) {
        try {
            const cacheData = {
                sudoku_id: this.sudokuId,
                time: parseInt(currentTime),
                status: status,
                board_state: this.board.contentLayer.getState(),
                timestamp: Date.now()
            };

            const cacheKey = `sudoku_${this.sudokuId}`;
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));

            if (status === "completed") {
                this.isCompleted = true;
                this.showCompletedState();
            } else {
                console.log("Game state saved to cache");
            }
            this.cleanOldCacheEntries();
        } catch (error) {
            console.error("Error saving game state to cache:", error);
        }
    }

    cleanOldCacheEntries() {
        const maxAge = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sudoku_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && (now - data.timestamp) > maxAge) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        }
    }

    async loadGameState() {
        if (!this.sudokuId) return "unknown";
        try {
            const response = await fetch(`/load-puzzle-state/${this.sudokuId}/`);
            const data = await response.json();
            if (data.status === "no_auth") {
                this.loadFromCache();
                return this.isCompleted ? "completed" : "resume";
            }
            if (data.status === "success" || data.status === "completed") {
                if (data.board_state)
                    this.board.contentLayer.loadState(data.board_state);
                const timeValue = data.status === "completed" ? data.completion_time : data.time;
                this.timer.setTimer(timeValue || 0);
                if (data.status === "completed") {
                    this.isCompleted = true;
                    this.showCompletedState(data);
                    return "completed";
                }
                return "resume";
            }
            return "new";
        } catch (error) {
            this.loadFromCache();
            return this.isCompleted ? "completed" : "resume";
        }
    }

    async saveGameState() {
        if (!this.sudokuId || this.isCompleted) return;
        this.isSaveTriggered = true;
        try {
            const currentTime = this.timer.getDuration() || 0;
            const status = this.board.contentLayer.isSolved() ? "completed" : "ongoing";
            const payload = {
                sudoku_id: this.sudokuId,
                time: parseInt(currentTime),
                status: status,
                board_state: this.board.contentLayer.getState(),
            };
            const response = await fetch('/save-puzzle-state/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.status === "no_auth") {
                this.saveToCache(currentTime, status);
                return;
            }
            if (data.status === "success") {
                if (status === "completed") {
                    this.isCompleted = true;
                    this.showCompletedState();
                } else {
                    console.log("Game state saved to server");
                }
            }
        } catch (error) {
            console.error("Error saving to server, saving to cache:", error);
            const currentTime = this.timer.getDuration() || 0;
            const status = this.board.contentLayer.isSolved() ? "completed" : "ongoing";
            this.saveToCache(currentTime, status);
        }
    }

    setupAutoSave() {
        if (!this.sudokuId || this.isCompleted) return;
        setInterval(() => {
            if (!this.isSaveTriggered) return;
            this.saveGameState();
        }, 2 * 60 * 1000);
    }

    showCompletedState(data = null) {
        console.log("Puzzle is completed - disabling interaction");
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

    async handleInitialModal(state) {
        const modal = new bootstrap.Modal(document.getElementById("sudokuInfoModal"));
        const messageBox = document.getElementById("sudoku-info-message");
        const startButton = document.getElementById("start-sudoku-button");
        if (!modal || !messageBox || !startButton) {
            console.warn("Modal-Elemente nicht gefunden");
            this.timer.init();
            return;
        }
        let message = "";
        switch (state) {
            case "new":
            case "unknown":
                message = "Dies ist dein erster Versuch dieses Sudokus. Viel Erfolg!";
                break;
            case "resume":
                message = "Dieses Sudoku wurde bereits begonnen. Du kannst jetzt weiterspielen.";
                break;
            case "completed":
                message = "Dieses Sudoku wurde bereits abgeschlossen. Es wird nicht erneut gezählt, kann aber nochmal gespielt werden.";
                break;
        }
        messageBox.textContent = message;
        return new Promise(resolve => {
            startButton.addEventListener("click", () => {
                modal.hide();
                if (!this.isCompleted) this.timer.init();
                resolve();
            }, { once: true });
            modal.show();
        });
    }
}

// --- Initialization ---
new Game();
