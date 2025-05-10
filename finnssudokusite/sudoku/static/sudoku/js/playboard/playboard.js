// playboard.js

import { createBoard } from "../board/board.js";
import { createSelectionConfig } from "../board/board_selectionConfig.js";
import { InputKeyboard } from "./input_keyboard.js";
import { InputMode } from "./input_constants.js";
import { InputGrid } from "./input_grid.js";
import { Timer } from "./timer.js";

export class PlayBoard {
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
        }, 250); // wait till everything initializes before redndering the board
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

    setupThemeMenu() {
        const backgrounds = {
            stone: "url('/static/sudoku/img/playboard/stone.jpg')",
            glow: "url('/static/sudoku/img/playboard/glow.jpg')",
            cement: "url('/static/sudoku/img/playboard/cement.jpg')",
            wood: "url('/static/sudoku/img/playboard/wood.jpg')",
            classic: "none"
        };

        document.getElementById("theme-menu")?.addEventListener("click", (e) => {
            const id = e.target.id;
            if (!backgrounds[id]) return;
            document.body.style.backgroundImage = backgrounds[id];

            document.querySelectorAll(".block-content").forEach(bg => bg.classList.toggle("my_box_style", id === "classic"));
            document.querySelectorAll(".block-part").forEach(part => {
                const type = part.getAttribute("data-block");
                part.classList.toggle("block-top", id !== "classic" && type === "top");
                part.classList.toggle("block-middle", id !== "classic" && type === "middle");
                part.classList.toggle("block-bottom", id !== "classic" && type === "bottom");
            });
        });
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
new PlayBoard();
