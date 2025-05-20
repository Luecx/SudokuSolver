// solver.worker.js
import SolverEngine from "./solver.js";   // path to your compiled Emscripten glue

let engineReady = false;
let engine;

// bootstrap the wasm engine:
;(async () => {
    engine = await SolverEngine();
    // forward all solver‐internal messages to the main thread:
    engine.addMessageListener(msg => {
        postMessage(msg);
    });
    engineReady = true;
})();

// listen for commands from main:
onmessage = ({ data }) => {
    if (!engineReady) {
        // optionally queue until ready
        return console.warn("Solver worker not ready yet");
    }
    // data is expected to be [ cmd, puzzleJson, opt1, opt2 ]
    engine.postMessage(...data);
};
