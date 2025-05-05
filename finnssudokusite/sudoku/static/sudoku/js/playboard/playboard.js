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

        this.init();
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.board.initBoard();

            const jsonData = window.puzzle_data;
            if (jsonData) this.board.loadBoard(jsonData.board);

            new Timer("timer").init();
            new InputGrid(this.keyboard);

            this.setupThemeMenu();
        });
    }

    setupThemeMenu() {
        const backgrounds = {
            stone: "url('/static/sudoku/img/playboard/stone.jpg')",
            glow: "url('/static/sudoku/img/playboard/glow.jpg')",
            cement: "url('/static/sudoku/img/playboard/zement.jpg')",
            wood: "url('/static/sudoku/img/playboard/wood.jpg')",
            classic: "none"
        };

        document.getElementById("theme-menu")?.addEventListener("click", (e) => {
            const id = e.target.id;
            if (!backgrounds[id]) return;
            document.body.style.backgroundImage = backgrounds[id];

            document.querySelectorAll(".block-bg").forEach(bg => bg.classList.toggle("my_white_box", id === "classic"));
            document.querySelectorAll(".block-part").forEach(part => {
                const type = part.getAttribute("data-block");
                part.classList.toggle("block-top", id !== "classic" && type === "top");
                part.classList.toggle("block-middle", id !== "classic" && type === "middle");
                part.classList.toggle("block-bottom", id !== "classic" && type === "bottom");
            });
        });
    }
}

// Initialization
new PlayBoard();
