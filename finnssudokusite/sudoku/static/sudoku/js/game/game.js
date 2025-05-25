// game.js

import { createBoard } from "../board/board.js";
import { createSelectionConfig } from "../board/board_selectionConfig.js";
import { InputKeyboard } from "./input_keyboard.js";
import { InputMode } from "./input_constants.js";
import { InputGrid } from "./input_grid.js";
import { Timer } from "./timer.js";

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
        setTimeout(() => {
            this.init();
        }, 250); // wait till everything initializes before rendering the board
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

    init() {
        this.board.initBoard();

        const jsonData = window.puzzle_data;
        if (jsonData) this.board.loadBoard(jsonData.board);

        new Timer("timer").init();
        new InputGrid(this.keyboard);

        this.setupThemeMenu();
        this.renderRuleDescriptions();
    }

}

// Initialization
new Game();
