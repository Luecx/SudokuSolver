// build/worker.js

// 1. Load the Emscripten factory into this worker:
importScripts('solver.js');

// 2. Immediately start the module:
const modulePromise = createSolver({
    print:  text => self.postMessage({ type: 'stdout', text }),
    printErr: text => self.postMessage({ type: 'stderr', text })
});

// 3. Install your message handler at top‐level:
self.onmessage = async (e) => {
    console.log("Worker received:", e.data);

    const { type, json, maxSolutions, maxNodes } = e.data;
    try {
        const Module = await modulePromise;
        const fn = (type === 'solveComplete') ? 'solveComplete' : 'solve';
        Module.ccall(fn, null,
            ['string','number','number'],
            [json, maxSolutions, maxNodes]);
    } catch (err) {
        self.postMessage({ type: 'error', text: String(err) });
    }

    self.postMessage({ type: 'done' });
    self.close();
};
