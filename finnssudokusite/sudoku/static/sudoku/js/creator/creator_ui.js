// creator_ui.js

import { createBoard } from "../board/board.js";
import { CreatorRuleManager } from "./creator_rule_manager.js";
import { InputKeyboard } from "../game/input_keyboard.js";
import { InputMode } from "../game/input_constants.js";
import { CreatorAnalysis } from "./creator_analysis.js";
import { CreatorRules } from "./creator_rules.js";
import { CreatorSubmit } from "./creator_submit.js";

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

        this.analysis = new CreatorAnalysis(this);
        this.rules = new CreatorRules(this);
        this.submit = new CreatorSubmit(this);

        this.analysis.init();
        this.rules.init();
        this.submit.init();

        this.renderSettings();
    }

    get(id) {
        return document.getElementById(id);
    }

    renderSettings() {
        const normalSelect = this.get("normal-depth-select");
        const completeSelect = this.get("complete-depth-select");

        if (normalSelect) {
            normalSelect.value = this.analysis.normalDepth.toString();
            normalSelect.addEventListener("change", () => {
                this.analysis.normalDepth = parseInt(normalSelect.value);
            });
        }

        if (completeSelect) {
            completeSelect.value = this.analysis.completeDepth.toString();
            completeSelect.addEventListener("change", () => {
                this.analysis.completeDepth = parseInt(completeSelect.value);
            });
        }
    }

    checkIfCanSubmit() {
        this.submit.checkIfCanSubmit();
    }
}

new Creator();
