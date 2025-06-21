(() => {
    let isReady = false;
    let pending = null;
    const listeners = new Set();

    // Expose add/remove listener APIs
    Module.addMessageListener = fn => listeners.add(fn);
    Module.removeMessageListener = fn => listeners.delete(fn);

    // Funnel all Module.print calls to any listeners
    Module.print = text => {
        for (const fn of listeners) fn(text);
    };

    // Your page calls this to send a command (e.g., "solve --json=... --sol_limit=1 ...")
    Module.postMessage = (commandLine) => {
        if (typeof commandLine !== "string") {
            console.warn(`Invalid command type: expected string, got ${typeof commandLine}`);
            return;
        }
        if (!isReady) {
            pending = commandLine;
        } else {
            Module.ccall(
                "run",           // C function name
                "number",        // return type
                ["string"],      // argument types
                [commandLine]    // argument values
            );
        }
    };

    // Called automatically by Emscripten when WASM is loaded
    Module.postRun = () => {
        isReady = true;
        if (pending) {
            Module.postMessage(pending);
            pending = null;
        }
    };
})();
