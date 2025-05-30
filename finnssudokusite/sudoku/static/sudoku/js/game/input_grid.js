import { InputMode, InputColor } from './input_constants.js';

export class InputGrid {
    constructor(keyboard) {
        this.keyboard = keyboard;
        this.modeButtons = {};
        this.numberButtons = [];
        this.currentMode = this.keyboard.getMode();
        this.disabled = false;
        this.init();
    }

    init() {
        this.initModeButtons();
        this.initNumberButtons();
        this.initFontControls();

        this.updateModeButtons(this.keyboard.getMode());
        this.updateNumberButtonColors(this.keyboard.getMode());
    }

    initModeButtons() {
        const modeMap = {
            [InputMode.NumberRegular]: 'btn-numberMode',
            [InputMode.CandidateRegular]: 'btn-topMode',
            [InputMode.CandidateCentered]: 'btn-centerMode',
            [InputMode.Color]: 'btn-colorMode'
        };

        for (const [mode, id] of Object.entries(modeMap)) {
            const btn = document.getElementById(id);
            if (btn) {
                this.modeButtons[mode] = btn;
                btn.classList.add("btn-square", "btn-statebtn"); // mark as state button

                btn.addEventListener('click', () => {
                    if (this.disabled) return;
                    this.keyboard.setMode(mode);
                    btn.blur();
                });
                this.addClickEffect(btn);
            }
        }

        this.keyboard.on('modechange', e => {
            this.currentMode = e.detail.mode;
            this.updateModeButtons(e.detail.mode);
        });
    }

    initNumberButtons() {
        this.numberButtons = Array.from(document.getElementsByClassName("btn-number"));
        this.numberButtons.forEach((btn, i) => {
            // btn.classList.add("btn-square"); // ensure same base styling

            btn.addEventListener("click", () => {
                if (this.disabled) return; 
                this.keyboard.handleInput(i + 1);
            });
            this.addClickEffect(btn);
        });

        this.keyboard.on('modechange', e => this.updateNumberButtonColors(e.detail.mode));
        this.keyboard.on('keyinput', e => this.flashNumberButton(e.detail.val));
    }

    initFontControls() {
        let currentFontSize = 1.8;
        let currentSvgSize = 28;
        const gridButtons = document.querySelectorAll('.button-grid .btn-square');
        const btnPlus = document.getElementById('btn-plus');
        const btnMinus = document.getElementById('btn-minus');
        const svgIcon = document.querySelector("#btn-colorMode img");

        const updateFontSize = () => {
            gridButtons.forEach(btn => {
                btn.style.fontSize = currentFontSize + 'rem';
            });
            if (svgIcon) {
                svgIcon.style.width = currentSvgSize + 'px';
                svgIcon.style.height = currentSvgSize + 'px';
            }
        };

        btnPlus?.addEventListener('click', () => {
            if (this.disabled) return; 
            currentFontSize += 0.2;
            currentSvgSize += 3;
            updateFontSize();
        });
        btnMinus?.addEventListener('click', () => {
            if (this.disabled) return; 
            currentFontSize = Math.max(0.3, currentFontSize - 0.2);
            currentSvgSize = Math.max(1, currentSvgSize - 3);
            updateFontSize();
        });

        this.addClickEffect(btnPlus);
        this.addClickEffect(btnMinus);
    }

    disable() {
        this.disabled = true;
        this.updateButtonStates();
    }

    enable() {
        this.disabled = false;
        this.updateButtonStates();
    }

    isDisabled() {
        return this.disabled;
    }

    updateButtonStates() {
        const allButtons = [
            ...Object.values(this.modeButtons),
            ...this.numberButtons,
            document.getElementById('btn-plus'),
            document.getElementById('btn-minus')
        ].filter(btn => btn); // Remove null elements

        allButtons.forEach(btn => {
            if (this.disabled) {
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.5';
                btn.classList.add('btn-disabled');
            } else {
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
                btn.classList.remove('btn-disabled');
            }
        });
    }

    updateModeButtons(activeMode) {
        for (const btn of Object.values(this.modeButtons)) {
            btn.classList.remove("btn-selected");
        }
        this.modeButtons[activeMode]?.classList.add("btn-selected");
    }

    updateNumberButtonColors(activeMode) {
        const isColor = activeMode === InputMode.Color;
        this.numberButtons.forEach((btn, i) => {
            // Entferne alle möglichen Farbklassen
            for (let j = 1; j <= 9; j++) {
                btn.classList.remove(`btn-color-${j}`);
            }
            if (isColor) {
                btn.classList.add(`btn-color-${i + 1}`);
            }
            // Keine Änderung der Textfarbe mehr!
        });
    }

    flashNumberButton(val) {
        const map = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
        const id = `btn-${map[val]}`;
        const btn = document.getElementById(id);
        if (!btn) return;

        const isColor = this.currentMode === InputMode.Color;

        if (isColor) {
            // Im Farbmodus: Permanent selektierte Darstellung
            btn.classList.add("btn-selected");
            btn.classList.add(`btn-selected-${val}`);
            setTimeout(() => {
                btn.classList.remove("btn-selected", `btn-selected-${val}`);
            }, 150);
        } else {
            // Im Normalmodus: Kurzer Hover-Effekt
            btn.classList.add("btn-hovered");
            setTimeout(() => btn.classList.remove("btn-hovered"), 250);
        }
    }

    addClickEffect(btn) {
        if (!btn) return;
        btn.addEventListener("click", () => {
            if (this.disabled) return;
            btn.blur();
            btn.classList.add("btn-hovered");
            setTimeout(() => btn.classList.remove("btn-hovered"), 150);
        });
    }
}
