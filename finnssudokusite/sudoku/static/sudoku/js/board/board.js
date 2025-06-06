import { RuleManager } from "./board_ruleManager.js";
import { BoardRenderer } from "./board_renderer.js";
import { SelectionManager } from "./board_selectionManager.js";
import { HintEdgeLayer } from "./board_hintEdgeLayer.js";
import { HintRCLayer } from "./board_hintRCLayer.js";
import { CellLayer } from "./board_cellLayer.js";
import { EventManager } from "./board_eventManager.js";
import { BoardNumberLayer } from "./board_numberLayer.js";
import { serializeObject, deserializeObject } from "../util/jsonify.js";
import { CellIdx } from "../region/CellIdx.js";
import { NO_NUMBER } from "../number/number.js";
import { HintDiagLayer } from "./board_hintDiagLayer.js";
import { HighlightLayer } from "./board_highlightLayer.js";
import { CandidateRemover } from "./board_removeCandidates.js";
import { HistoryManager } from "./board_historyManager.js";

export function createBoard(container) {
    const gridSize = 9;
    const paddingRatio = 0.07;

    // --- Create DOM elements ---
    const canvas = document.createElement("canvas");
    canvas.className = "layer board-canvas";

    container.appendChild(canvas);

    // --- Continue with standard setup ---
    const ruleManager        = new RuleManager();
    const eventManager       = new EventManager();
    const renderer           = new BoardRenderer(canvas, gridSize, paddingRatio);
    const highlightLayer     = new HighlightLayer(renderer);
    const numberLayer        = new BoardNumberLayer(container, renderer);
    const solutionLayer      = new BoardNumberLayer(container, renderer);
    const hintLayer          = new HintEdgeLayer(container, renderer);
    const hintRCLayer        = new HintRCLayer(container, renderer);
    const hintDiagLayer      = new HintDiagLayer(container, renderer);
    const cellLayer          = new CellLayer(container, gridSize);
    const selectionManager   = new SelectionManager(ruleManager, renderer);
    const candidateRemover   = new CandidateRemover();
    const historyManager     = new HistoryManager(renderer);

    solutionLayer.useSolutionStyle = true;

    const board = {
        initBoard,
        render: () => renderer.render(ruleManager.getAllHandlers(), ruleManager.getCurrentHandler()),
        triggerRender: () => renderer.triggerRender(),

        // grid related functions
        getCellTopLeft          : (r, c) => renderer.getCellTopLeft(r, c),
        getCellTopLeftCTX       : (r, c) => renderer.getCellTopLeftCTX(r, c),
        getPadding              : () => renderer.getPadding(),
        getCellSize             : () => renderer.getCellSize(),
        getCellSizeCTX          : () => renderer.getCellSizeCTX(),
        getCanvasContext        : () => renderer.getContext(),
        getGridSize             : () => gridSize,
        getDPR                  : () => renderer.getDPR(),

        getAllHandlers          : () => ruleManager.getAllHandlers(),

        // selection related functions
        setSelectedRegion       : region => selectionManager.setSelectedRegion(region),
        setSelectionMode        : config => selectionManager.setSelectionMode(config),
        getSelectedRegion       : () => selectionManager.getSelectedRegion(),
        isDefaultMode           : () => selectionManager.isDefaultMode(),
        revertSelection         : () => selectionManager.revertSelection(),
        resetSelectionToDefault : () => selectionManager.resetSelectionToDefault(),
        shiftSelection          : (dy, dx) => selectionManager.shiftSelection(dy, dx),

        // renderer related functions
        addRenderCall           : (name, func, layer) => renderer.addRenderCall(name, func, layer),
        removeRenderCall        : name => renderer.removeRenderCall(name),

        // exporting and importing
        getTags                 : () => ruleManager.getTags(),

        // edge hints
        emitEvent               : (eventName, data) => eventManager.emit(eventName, data),
        onEvent                 : (eventName, callback) => eventManager.on(eventName, callback),
        offEvent                : (eventName, callback) => eventManager.off(eventName, callback),

        // solver related
        getFixedNumbers         : () => numberLayer.getFixedNumbers(),
        getUserNumbers          : () => numberLayer.getUserNumbers(),
        getAllNumbers           : () => numberLayer.getAllNumbers(),

        // ───  CONTENT-LAYER APIs ────────────────────────────────────────
        setValues:       (region,val,fixed=false)  => {numberLayer.setValues(region,val,fixed);
                                                       eventManager.emit("ev_number_changed", region)},
        unsetValues:     (region,               )  => {numberLayer.unsetValues(region);
                                                       eventManager.emit("ev_number_changed", region)},
        toggleValues:    (region,val,fixed=false)  => {numberLayer.toggleValues(region,val,fixed);
                                                       eventManager.emit("ev_number_changed", region)},
        setCandidates:   (region,c,centered=false) => {numberLayer.setCandidates(region,c,centered);
                                                       eventManager.emit("ev_candidates_changed", region)},
        unsetCandidates: (region,c,centered=false) => {numberLayer.unsetCandidates(region,c,centered);
                                                       eventManager.emit("ev_candidates_changed", region)},
        toggleCandidates:(region,c,centered=false) => {numberLayer.toggleCandidates(region,c,centered);
                                                       eventManager.emit("ev_candidates_changed", region)},
        setColors:       (region,col)              => {numberLayer.setColors(region,col);
                                                       eventManager.emit("ev_color_changed", region)},
        unsetColors:     (region,col)              => {numberLayer.unsetColors(region,col);
                                                       eventManager.emit("ev_color_changed", region)},
        toggleColors:    (region,col,force=false)  => {numberLayer.toggleColors(region,col,force);
                                                       eventManager.emit("ev_color_changed", region)},
        clearRegion:     (region, force=false, canClearFixed = false) => {
            let hasValues = false, hasCandidates = false, hasColors = false;
            for (const idx of region.items) {
                const cell = numberLayer.getCell(idx);
                if (!cell) continue;
                
                if (!hasValues && cell.value !== NO_NUMBER) hasValues = true;
                if (!hasCandidates && (cell.ordinaryCandidates.size > 0 || cell.centeredCandidates.size > 0)) hasCandidates = true;
                if (!hasColors && cell.colors.size > 0) hasColors = true;
                
                // early exit if all types found
                if (hasValues && hasCandidates && hasColors) break;
            }
                    
            numberLayer.clearRegion(region, force, canClearFixed)

            if (hasValues) eventManager.emit("ev_number_changed", region);
            if (hasCandidates) eventManager.emit("ev_candidates_changed", region);
            if (hasColors) eventManager.emit("ev_color_changed", region);
        },

        // ----─  CONTENT-LAYER APIs END ────────────────────────────────────────
        resetBoard,
        saveBoard,
        loadBoard,

        // solution functions
        showSolution,
        showSolutions,
        hideSolution,

        cellLayer,
        hintLayer,
        hintRCLayer,
        hintDiagLayer,
        contentLayer: numberLayer,
        highlightLayer,
        candidateRemover,
        historyManager
    };

    function initBoard() {
        hintLayer.init(board);
        hintRCLayer.init(board);
        hintDiagLayer.init(board);
        cellLayer.init(board);
        numberLayer.init(board);
        solutionLayer.init(board);
        highlightLayer.init(board);
        selectionManager.setup(board);
        ruleManager.registerDefaults(board);
        candidateRemover.init(board);
        historyManager.init(board);

        function resizeAndRebuild() {
            renderer.setup(container);
            const cellSize = renderer.getCellSize();
            const usedSize = renderer.getUsedSize();
            const offset = renderer.getGridOffset();

            cellLayer._generate(cellSize, usedSize, offset);
            hintLayer.update();
            hintRCLayer.update();
            hintDiagLayer.update();
            board.render();
            numberLayer._generate(cellSize, usedSize, offset);
            solutionLayer._generate(cellSize, usedSize, offset);
        }

        this.onEvent("ev_rule_added"   , () => this.triggerRender());
        this.onEvent("ev_rule_removed" , () => this.triggerRender());
        this.onEvent("ev_rule_changed" , () => this.triggerRender());
        this.onEvent("ev_rule_reset"   , () => this.triggerRender());

        window.addEventListener("resize", resizeAndRebuild);
        resizeAndRebuild();
    }

    function resetBoard() {
        ruleManager.resetRules();
        numberLayer.resetContent();
        board.render();
    }

    function saveBoard() {
        // const ctx = this.getCanvasContext();
        // const canvas = ctx.canvas;
        //
        // for (let i = 0; i <= 10; i++) {
        //     const quality = i / 10;
        //
        //     canvas.toBlob(blob => {
        //         console.log(`Quality ${quality.toFixed(1)}: Size in bytes = ${blob.size}`);
        //
        //         const link = document.createElement('a');
        //         link.href = URL.createObjectURL(blob);
        //         link.download = `sudoku_q${quality.toFixed(1)}.webp`;
        //         document.body.appendChild(link);
        //         link.click();
        //         document.body.removeChild(link);
        //     }, 'image/webp', quality);
        // }

        return serializeObject({
            fixedCells: numberLayer.saveFixedCells(),
            rules: ruleManager.saveRules()
        });
    }

    function loadBoard(json) {
        let dat = deserializeObject(json);

        this.resetBoard();
        if (dat.fixedCells) {
            numberLayer.loadFixedCells(dat.fixedCells);
        }

        if (dat.rules) {
            ruleManager.loadRules(dat.rules);
        }

        this.render();
    }

    function showSolution(initial, solution) {
        // 1. Hide the normal layer, show the solution layer
        numberLayer.hide();
        solutionLayer.show();

        solutionLayer.resetContent();

        // 3. Fill in values from the solution
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const idx = new CellIdx(r, c);
                const init_value  = initial .get(idx);
                const sol_value   = solution.get(idx);

                // Treat as fixed if present in initial
                const fixed = (init_value !== NO_NUMBER);
                solutionLayer.setValue(idx, sol_value, fixed);
            }
        }
    }

    function showSolutions(initial, solutions, show_definite = true, show_uncertain = true) {
        numberLayer.hide();
        solutionLayer.show();

        solutionLayer.resetContent();

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const idx = new CellIdx(r, c);
                const init_val = initial.get(idx);

                if (init_val !== NO_NUMBER) {
                    // Fixed cell
                    solutionLayer.setValue(idx, init_val, true);
                    continue;
                }

                const cands = solutions.getCandidates(idx);

                if (cands.count() === 1 && show_definite) {
                    const definite = cands.lowest();
                    solutionLayer.setValue(idx, definite, false);
                } else if (cands.count() > 1 && show_uncertain) {
                    // Uncertain: show all values as red candidates
                    for (const v of cands) {
                        solutionLayer.setCandidate(idx, v, false);
                    }
                }
            }
        }
    }

    function hideSolution() {
        solutionLayer.hide();
        numberLayer.show();
    }

    return board;
}
