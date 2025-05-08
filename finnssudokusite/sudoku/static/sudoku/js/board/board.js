import { RuleManager } from "./board_ruleManager.js";
import { BoardRenderer } from "./board_renderer.js";
import { SelectionManager } from "./board_selectionManager.js";
import { HintDotLayer } from "./board_hintLayer.js";
import { HintRCLayer } from "./board_hintRCLayer.js";
import { CellLayer } from "./board_cellLayer.js";
import { EventManager } from "./board_eventManager.js";
import { BoardNumberLayer } from "./board_numberLayer.js";
import { serializeObject, deserializeObject } from "../util/jsonify.js";
import { CellIdx } from "../region/CellIdx.js";
import { NO_NUMBER } from "../number/number.js";

export function createBoard(container) {
    const gridSize = 9;
    const paddingRatio = 0.06;

    // --- Create DOM elements ---
    const canvas = document.createElement("canvas");
    canvas.id = "board-canvas";

    const grid = document.createElement("div");
    grid.className = "board-grid";
    grid.id = "sudoku-board";

    container.appendChild(canvas);
    container.appendChild(grid);

    // --- Continue with standard setup ---
    const ruleManager        = new RuleManager();
    const eventManager       = new EventManager();
    const renderer           = new BoardRenderer(canvas, gridSize, paddingRatio);
    const numberLayer        = new BoardNumberLayer(container, renderer);
    const solutionLayer      = new BoardNumberLayer(container, renderer);
    const hintLayer          = new HintDotLayer(container, renderer);
    const hintRCLayer        = new HintRCLayer(container, renderer);
    const cellLayer          = new CellLayer(container, gridSize);
    const selectionManager   = new SelectionManager(grid, ruleManager, renderer);

    solutionLayer.useSolutionStyle = true;

    const board = {
        initBoard,
        render: () => renderer.render(ruleManager.getAllHandlers(), ruleManager.getCurrentHandler()),
        triggerRender: () => renderer.triggerRender(),

        // grid related functions
        getCellTopLeft          : (r, c) => renderer.getCellTopLeft(r, c),
        getCellCorners          : (r, c) => renderer.getCellCorners(r, c),
        getPadding              : () => renderer.getPadding(),
        getCellSize             : () => renderer.getCellSize(),
        getCanvasContext        : () => renderer.getContext(),

        getAllHandlers          : () => ruleManager.getAllHandlers(),

        // selection related functions
        setSelectedRegion       : region => selectionManager.setSelectedRegion(region),
        setSelectionMode        : config => selectionManager.setSelectionMode(config),
        getSelectedRegion       : () => selectionManager.getSelectedRegion(),
        isDefaultMode           : () => selectionManager.isDefaultMode(),
        revertSelection         : () => selectionManager.revertSelection(),
        resetSelectionToDefault : () => selectionManager.resetSelectionToDefault(),

        // renderer related functions
        addRenderCall           : (name, func, layer) => renderer.addRenderCall(name, func, layer),
        removeRenderCall        : name => renderer.removeRenderCall(name),

        // exporting and importing
        getRulesJSON            : () => ruleManager.serializeRules(),
        loadRulesJSON           : json => ruleManager.deserializeRules(json),
        getTags                 : () => ruleManager.getTags(),

        // edge hints
        emitEvent               : (eventName, data) => eventManager.emit(eventName, data),
        onEvent                 : (eventName, callback) => eventManager.on(eventName, callback),
        offEvent                : (eventName, callback) => eventManager.off(eventName, callback),

        // solver related
        getSolverBoard          : () => numberLayer.getSolverBoard(),

        // ───  CONTENT-LAYER APIs ────────────────────────────────────────
        // single-cell
        setValue:       (idx,value,fixed=false)    => numberLayer.setValue(idx,value,fixed),
        setCandidate:   (idx,c,centered=false)     => numberLayer.setCandidate(idx,c,centered),
        unsetCandidate: (idx,c,centered=false)     => numberLayer.unsetCandidate(idx,c,centered),
        toggleCandidate:(idx,c,centered=false)     => numberLayer.toggleCandidate(idx,c,centered),
        setColor:       (idx,col)                  => numberLayer.setColor(idx,col),
        unsetColor:     (idx,col)                  => numberLayer.unsetColor(idx,col),
        toggleColor:    (idx,col,force=false)      => numberLayer.toggleColor(idx,col,force),

        // region‐wide
        setValues:       (region,val,fixed=false)  => numberLayer.setValues(region,val,fixed),
        unsetValues:     (region,               )  => numberLayer.unsetValues(region),
        toggleValues:    (region,val,fixed=false)  => numberLayer.toggleValues(region,val,fixed),

        setCandidates:   (region,c,centered=false) => numberLayer.setCandidates(region,c,centered),
        unsetCandidates: (region,c,centered=false) => numberLayer.unsetCandidates(region,c,centered),
        toggleCandidates:(region,c,centered=false) => numberLayer.toggleCandidates(region,c,centered),

        setColors:       (region,col)              => numberLayer.setColors(region,col),
        unsetColors:     (region,col)              => numberLayer.unsetColors(region,col),
        toggleColors:    (region,col,force=false)  => numberLayer.toggleColors(region,col,force),
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
        contentLayer: numberLayer,

    };

    function initBoard() {
        grid.classList.add("board");

        hintLayer.init(board);
        hintRCLayer.init(board);
        cellLayer.init(board);
        numberLayer.init(board);
        solutionLayer.init(board);
        selectionManager.setup(board);
        ruleManager.registerDefaults(board);

        function resizeAndRebuild() {
            renderer.setup(container);
            const cellSize = renderer.getCellSize();
            const usedSize = renderer.getUsedSize();
            const offset = renderer.getGridOffset();

            cellLayer._generate(cellSize, usedSize, offset);
            hintLayer.update();
            hintRCLayer.update();
            board.render();
            numberLayer._generate(cellSize, usedSize, offset);
            solutionLayer._generate(cellSize, usedSize, offset);
        }

        window.addEventListener("resize", resizeAndRebuild);
        resizeAndRebuild();
    }

    function resetBoard() {
        ruleManager.resetRules();
        numberLayer.resetContent();
        board.render();
    }

    function saveBoard() {
        let solverBoard = numberLayer.getSolverBoard();

        return serializeObject({
            // fixedCells: contentLayer.saveFixedCells(),
            rules: ruleManager.saveRules()
        });
    }

    function loadBoard(json) {

        console.log("data");

        let dat = deserializeObject(json);

        console.log(dat);
        this.resetBoard();

        // if (data.board.fixedCells) {
        //
        //     contentLayer.loadFixedCells(data.board.fixedCells);
        // }

        if (dat.rules) {
            ruleManager.loadRules(dat.rules);
        }

        this.render();
    }

    function showSolution(initial, solution) {
        console.log("showing solution");

        // 1. Hide the normal layer, show the solution layer
        numberLayer.hide();
        solutionLayer.show();

        solutionLayer.resetContent();

        // 3. Fill in values from the solution
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const idx = new CellIdx(r, c);
                const initialCell  = initial.getCell(idx);
                const solutionCell = solution.getCell(idx);
                const value        = solutionCell.value;

                // Treat as fixed if present in initial
                const fixed = (initialCell.value !== NO_NUMBER);
                solutionLayer.setValue(idx, value, fixed);
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
                const initialCell = initial.getCell(idx);

                if (initialCell.value !== NO_NUMBER) {
                    // Fixed cell
                    solutionLayer.setValue(idx, initialCell.value, true);
                    continue;
                }

                const values = new Set();
                for (const sol of solutions) {
                    const val = sol.getCell(idx).value;
                    values.add(val);
                }

                if (values.size === 1 && show_definite) {
                    // Definite value across all solutions
                    const definite = values.values().next().value;
                    solutionLayer.setValue(idx, definite, false);
                } else if (values.size > 1 && show_uncertain) {
                    // Uncertain: show all values as red candidates
                    for (const v of values) {
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
