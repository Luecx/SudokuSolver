// input_state.js

import { InputMode } from './input_constants.js';

export const InputState = {
    mode: InputMode.NumberRegular,
    setMode(newMode) {
        this.mode = newMode;
    },
    getMode() {
        return this.mode;
    }
};
