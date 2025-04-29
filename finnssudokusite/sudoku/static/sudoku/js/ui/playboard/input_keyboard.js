import { InputMode, InputColor } from './input_constants.js';

export class InputKeyboard {
    constructor(board, options = {}) {
        this.board = board;
        this.allowedModes = options.allowedModes || [InputMode.NumberRegular];
        this.mode = this.allowedModes[0];
        this.events = new EventTarget();

        this.keyToValue = {
            '1': 1, '2': 2, '3': 3,
            '4': 4, '5': 5, '6': 6,
            '7': 7, '8': 8, '9': 9,
            'Numpad1': 1, 'Numpad2': 2, 'Numpad3': 3,
            'Numpad4': 4, 'Numpad5': 5, 'Numpad6': 6,
            'Numpad7': 7, 'Numpad8': 8, 'Numpad9': 9
        };

        this.specialBindings = {
            'Backspace': () => this.board.unsetValues(this.board.getSelectedRegion()),
            'Delete': () => this.board.unsetValues(this.board.getSelectedRegion()),
            'ArrowLeft': () => this.board.moveCursor?.(-1, 0),
            'ArrowRight': () => this.board.moveCursor?.(1, 0),
            'ArrowUp': () => this.board.moveCursor?.(0, -1),
            'ArrowDown': () => this.board.moveCursor?.(0, 1)
        };

        this.attachListeners();
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

    attachListeners() {
        document.addEventListener('keydown', (event) => {
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
        });
    }

    on(eventName, callback) {
        this.events.addEventListener(eventName, callback);
    }
}
