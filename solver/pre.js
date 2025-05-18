(() => {
    let isReady = false;
    let pending = null;       // holds one [cmd, puzzle, opt1, opt2] tuple
    const listeners = new Set();

    // Internal dispatcher: only "solve" or "solveComplete" allowed
    const dispatch = ([cmd, puzzle, opt1, opt2]) => {
        if (cmd !== "solve" && cmd !== "solveComplete") {
            console.warn(`Unknown solver command: ${cmd}`);
            return;
        }
        Module.ccall(
            cmd,             // name of C function
            "number",        // return type
            ["string", "number", "number"], // arg types
            [puzzle, opt1, opt2]
        );
    };

    // Expose add/remove listener APIs
    Module.addMessageListener = fn => listeners.add(fn);
    Module.removeMessageListener = fn => listeners.delete(fn);

    // Funnel all Module.print calls to any listeners
    Module.print = text => {
        for (const fn of listeners) fn(text);
    };

    // Your page calls this once per worker:
    Module.postMessage = (...args) => {
        if (!isReady) {
            // buffer the very first command
            pending = args;
        } else {
            dispatch(args);
        }
    };

    // When WASM is up, run the one pending command (if any)
    Module.postRun = () => {
        isReady = true;
        if (pending) {
            dispatch(pending);
            pending = null;
        }
    };
})();