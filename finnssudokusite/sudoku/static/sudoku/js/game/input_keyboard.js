import { InputMode, InputColor } from './input_constants.js';

export class InputKeyboard {
    constructor(board, allowedModes) {
        this.board = board;
        this.allowedModes = allowedModes;
        this.mode = this.allowedModes[0];
        this.events = new EventTarget();

        this.enabled = false;
        this._boundKeyHandler = this._handleKey.bind(this);

        this.keyToValue = {
            '1': 1, '2': 2, '3': 3,
            '4': 4, '5': 5, '6': 6,
            '7': 7, '8': 8, '9': 9,
            'Numpad1': 1, 'Numpad2': 2, 'Numpad3': 3,
            'Numpad4': 4, 'Numpad5': 5, 'Numpad6': 6,
            'Numpad7': 7, 'Numpad8': 8, 'Numpad9': 9
        };

        this.specialBindings = {
            'Backspace': () => this.board.clearRegion(this.board.getSelectedRegion(),
                this.mode === InputMode.NumberFixed, this.mode === InputMode.NumberFixed),
            'Delete': () => this.board.clearRegion(this.board.getSelectedRegion(),
                this.mode === InputMode.NumberFixed, this.mode === InputMode.NumberFixed),
            'ArrowUp': () => this.board.shiftSelection(-1, 0),
            'ArrowDown': () => this.board.shiftSelection(1, 0),
            'ArrowLeft': () => this.board.shiftSelection(0, -1),
            'ArrowRight': () => this.board.shiftSelection(0, 1),
        };

        this.previousMode = null;
        this.modifierState = { ctrl: false, alt: false };

        this.setEnabled(true);
    }

    getAvailableModes() {
        return this.allowedModes;
    }

    cycleMode() {
        const index = this.allowedModes.indexOf(this.mode);
        const nextMode = this.allowedModes[(index + 1) % this.allowedModes.length];
        this.setMode(nextMode);
    }

    setMode(mode) {
        if (this.allowedModes.includes(mode)) {
            this.mode = mode;

            const numberBlock = document.getElementById("number-block");
            if (numberBlock) {
                const rot = localStorage.getItem("rotationNumberPad");

                if (mode === InputMode.CandidateRegular) {
                    if (rot === "true") {
                        numberBlock.classList.add("toCorner-rotation");
                    } else {
                        numberBlock.classList.add("toCorner");
                    }
                } else {
                    numberBlock.classList.remove("toCorner");
                    numberBlock.classList.remove("toCorner-rotation");
                }

                if (mode === InputMode.CandidateCentered) {
                    numberBlock.classList.add("toCenter");
                } else {
                    numberBlock.classList.remove("toCenter");
                }
            }

            this.events.dispatchEvent(new CustomEvent('modechange', { detail: { mode } }));
        }
    }

    getMode() {
        return this.mode;
    }

    handleInput(val) {
        const region = this.board.getSelectedRegion();
        if (!this.board.isDefaultMode() || !region || region.length === 0) return;

        switch (this.mode) {
            case InputMode.NumberRegular:
                this.board.toggleValues(region, val, false);
                break;
            case InputMode.NumberFixed:
                this.board.toggleValues(region, val, true);
                break;
            case InputMode.CandidateRegular:
                this.board.toggleCandidates(region, val, false);
                break;
            case InputMode.CandidateCentered:
                this.board.toggleCandidates(region, val, true);
                break;
            case InputMode.Color:
                const color = InputColor[val];
                if (color) this.board.toggleColors(region, color, false);
                break;
        }

        this.events.dispatchEvent(new CustomEvent('keyinput', { detail: { val } }));
    }

    _handleKey(event) {
        const target = event.target;
        const isTypingField = (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        );
        if (isTypingField) return;

        const isKeyDown = event.type === 'keydown';

        // Handle Ctrl
        if (event.key === 'Control') {
            if (isKeyDown && !this.modifierState.ctrl) {
                this.modifierState.ctrl = true;
                if (this.allowedModes.includes(InputMode.CandidateRegular)) {
                    this.previousMode = this.mode;
                    this.setMode(InputMode.CandidateRegular);
                }
            } else if (!isKeyDown && this.modifierState.ctrl) {
                this.modifierState.ctrl = false;
                if (this.previousMode && this.allowedModes.includes(this.previousMode)) {
                    this.setMode(this.previousMode);
                    this.previousMode = null;
                }
            }
            return;
        }

        // Handle Alt
        if (event.key === 'Alt') {
            if (isKeyDown && !this.modifierState.alt) {
                this.modifierState.alt = true;
                if (this.allowedModes.includes(InputMode.CandidateCentered)) {
                    this.previousMode = this.mode;
                    this.setMode(InputMode.CandidateCentered);
                }
            } else if (!isKeyDown && this.modifierState.alt) {
                this.modifierState.alt = false;
                if (this.previousMode && this.allowedModes.includes(this.previousMode)) {
                    this.setMode(this.previousMode);
                    this.previousMode = null;
                }
            }
            return;
        }

        // Only handle keys once (on keydown)
        if (!isKeyDown) return;

        if (event.code === 'Space') {
            this.cycleMode();
            event.preventDefault();
            return;
        }

        if (this.specialBindings[event.key]) {
            this.specialBindings[event.key]();
            event.preventDefault();
            return;
        }

        const val = this.keyToValue[event.key] || this.keyToValue[event.code];
        if (val) {
            this.handleInput(val);
            event.preventDefault();
        }
    }

    setEnabled(enabled) {
        if (enabled && !this.enabled) {
            document.addEventListener('keydown', this._boundKeyHandler);
            document.addEventListener('keyup', this._boundKeyHandler);
            this.enabled = true;
        } else if (!enabled && this.enabled) {
            document.removeEventListener('keydown', this._boundKeyHandler);
            document.removeEventListener('keyup', this._boundKeyHandler);
            this.enabled = false;
        }
    }

    enable() {
        this.setEnabled(true);
    }

    disable() {
        this.setEnabled(false);
    }

    on(eventName, callback) {
        this.events.addEventListener(eventName, callback);
    }
}
