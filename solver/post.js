// Embedded into solver.js by --post-js. Runs inside WebWorker.
self.onmessage = async function (e) {

    console.log("Starting webworker: ", e)

    const { json, maxSolutions, maxNodes } = e.data;

    const Module = await createSolver({
        print: (text) => self.postMessage({ type: "stdout", text }),
        printErr: (text) => self.postMessage({ type: "stderr", text })
    });

    const jsonPtr = Module._malloc(json.length + 1);
    Module.stringToUTF8(json, jsonPtr, json.length + 1);

    Module._solve(jsonPtr, maxSolutions, maxNodes);

    Module._free(jsonPtr);
    console.log("Finished webworker")
    self.close(); // Kill worker when done
};
