// game.js

import { createBoard } from "../board/board.js";
import { InputKeyboard } from "./input_keyboard.js";
import { InputMode } from "./input_constants.js";
import { InputGrid } from "./input_grid.js";
import { Timer } from "./timer.js";
import { getCSRFToken } from "../csrf/csrf.js";

export class Game {
    constructor(options = {}) {
        const container = document.querySelector(".board-container");
        this.board = createBoard(container);
        this.keyboard = new InputKeyboard(this.board, [
                InputMode.NumberRegular,
                InputMode.CandidateRegular,
                InputMode.CandidateCentered,
                InputMode.Color
            ]
        );

        this.isSaveTriggered = false;
        this.timer = new Timer("timer");
        this.sudokuId = null;
        this.isCompleted = false;
        this.saveTimer = null;

        setTimeout(() => {
            this.init();
        }, 250); // wait till everything initializes before rendering the board
    }

    async init() {
        this.board.initBoard();

        const jsonData = window.puzzle_data;
        if (jsonData) {
            this.sudokuId = jsonData.id;
            this.board.loadBoard(jsonData.board);
            
            // check if puzzle is completed or load saved state
            await this.loadGameState();
            // set up auto-save if puzzle is not completed
            if (!this.isCompleted) 
                this.setupAutoSave();
        }

        if (!this.isCompleted)
            this.timer.init();
        new InputGrid(this.keyboard);

        this.setupPageUnloadHandlers();
        this.setupThemeMenu();
        this.renderRuleDescriptions();
    }

    // page unload related

    setupPageUnloadHandlers() {
        // Save when user navigates away or closes tab
        window.addEventListener('beforeunload', () => {
            this.saveGameStateSync();
        });

        // Save when tab becomes hidden (user switches tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden')
                this.saveGameStateSync();
        });

        // Save when page loses focus (user clicks on another window)
        window.addEventListener('blur', () => {
            this.saveGameStateSync();
        });
    }

    saveGameStateSync() {
        if (!this.sudokuId || this.isCompleted) return;

        const currentTime = this.timer.getDuration() || 0;
        const status = this.board.contentLayer.isSolved() ? "completed" : "ongoing";

        // always save to cache immediately (synchronous)
        this.saveToCache(currentTime, status);

        // try to save to server using sendBeacon
        try {
            const payload = {
                sudoku_id: this.sudokuId,
                time: parseInt(currentTime),
                status: status,
                board_state: this.board.contentLayer.getState(),
            };

            if (navigator.sendBeacon) {
                // Use sendBeacon - designed for page unload scenarios
                const formData = new FormData();
                formData.append('data', JSON.stringify(payload));
                formData.append('csrfmiddlewaretoken', getCSRFToken());
                
                navigator.sendBeacon('/save-puzzle-state/', formData);
            } else {
                // Fallback: synchronous XMLHttpRequest (less reliable but better than nothing)
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/save-puzzle-state/', false); // false = synchronous
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
                xhr.send(JSON.stringify(payload));
            }
        } catch (error) {
            console.error("Error saving on page unload:", error);
        }
    }

    // cache related

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
                } else {
                    console.log("Loaded cached game state");
                }
            }
        } catch (error) {
            console.log("No cached state found or error loading:", error);
        }
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

            // clean up old cache entries
            this.cleanOldCacheEntries();
        } catch (error) {
            console.error("Error saving game state to cache:", error);
        }
    }

    cleanOldCacheEntries() {
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
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
                    // remove corrupted entries
                    localStorage.removeItem(key);
                }
            }
        }
    }

    // server related

    async loadGameState() {
        if (!this.sudokuId) return;

        try {
            const response = await fetch(`/load-puzzle-state/${this.sudokuId}/`);
            const data = await response.json();

            if (data.status === "no_auth") {
                // user not authenticated, load from localStorage
                this.loadFromCache();
                return;
            }

            if (data.status === "success" || data.status === "completed") {
                if (data.board_state) 
                    this.board.contentLayer.loadState(data.board_state);

                const timeValue = data.status === "completed" ? data.completion_time : data.time;
                this.timer.setTimer(timeValue || 0);
                
                if (data.status === "completed") {
                    this.isCompleted = true;
                    this.showCompletedState(data);
                } else {
                    console.log("Loaded saved game state from server");
                }
            }
        } catch (error) {
            console.log("Error loading from server, trying cache:", error);
            this.loadFromCache();
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
                // user not authenticated, save to localStorage
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

    // general

    setupAutoSave() {
        if (!this.sudokuId || this.isCompleted) return;

        setInterval(() => {
            if (!this.isSaveTriggered) return;
            this.saveGameState();
        }, 2 * 60 * 1000); // every 2 minutes
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

        // Transparenz-Slider und .keypad-pane Transparenzsteuerung
        const transparencySlider = document.getElementById("transparency-range");
        const rightPane = document.querySelector(".keypad-pane"); // oder ggf. .my_control_style

        if (transparencySlider && rightPane) {
            const applyTransparency = (value) => {
                const alpha = Math.max(0, Math.min(1, value / 100));
                rightPane.style.backgroundColor = `rgba(255, 255, 255, ${alpha})`;
            };

            // gespeicherten Wert laden oder aktuellen verwenden
            const savedTransparency = localStorage.getItem("transparencyValue");
            const initialValue = savedTransparency !== null ? parseInt(savedTransparency, 10) : transparencySlider.value;
            transparencySlider.value = initialValue;
            applyTransparency(initialValue);

            // Speichern bei Änderung
            transparencySlider.addEventListener("input", () => {
                const value = transparencySlider.value;
                applyTransparency(value);
                localStorage.setItem("transparencyValue", value);
            });
        }
        select.addEventListener("change", () => { applyTheme(select.value); });

        // Rotation NumberPad
        const rotationCheckbox = document.getElementById("rotationNumberPad");
        const gridB = document.getElementById("number-block");
        function applyRotationSetting(enabled) {
            if (!gridB) return;
            gridB.classList.toggle("reversed", enabled);
            gridB.classList.toggle("normal", !enabled);
        }
        // Save Rotation NumberPad
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

        container.innerHTML = ""; // Clear existing content

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
}

// Initialization
new Game();