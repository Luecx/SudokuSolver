import { RuleManager } from "./board_ruleManager.js";
import { BoardRenderer } from "./board_renderer.js";
import { SelectionManager } from "./board_selectionManager.js";
import { HintDotLayer } from "./board_hintLayer.js";
import { HintRCLayer } from "./board_hintRCLayer.js";
import { CellLayer } from "./board_cellLayer.js";
import { EventManager } from "./board_eventManager.js";
import { BoardContentLayer } from "./board_contentLayer.js";
import { serializeObject, deserializeObject } from "../util/jsonify.js";

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
    const contentLayer       = new BoardContentLayer(container, renderer); // <--- Creates its own container now
    const hintLayer          = new HintDotLayer(container, renderer);
    const hintRCLayer        = new HintRCLayer(container, renderer);
    const cellLayer          = new CellLayer(container, gridSize);
    const selectionManager   = new SelectionManager(grid, ruleManager, renderer);

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
        getSolverBoard          : () => contentLayer.getSolverBoard(),

        // ───  CONTENT-LAYER APIs ────────────────────────────────────────
        // single-cell
        setValue:       (idx,value,fixed=false) => contentLayer.setValue(idx,value,fixed),
        setCandidate:   (idx,c,centered=false)   => contentLayer.setCandidate(idx,c,centered),
        unsetCandidate: (idx,c,centered=false)   => contentLayer.unsetCandidate(idx,c,centered),
        toggleCandidate:(idx,c,centered=false)   => contentLayer.toggleCandidate(idx,c,centered),
        setColor:       (idx,col)                => contentLayer.setColor(idx,col),
        unsetColor:     (idx,col)                => contentLayer.unsetColor(idx,col),
        toggleColor:    (idx,col,force=false)    => contentLayer.toggleColor(idx,col,force),

        // region‐wide
        setValues:       (region,val,fixed=false) => contentLayer.setValues(region,val,fixed),
        unsetValues:     (region,               ) => contentLayer.unsetValues(region),
        toggleValues:    (region,val,fixed=false) => contentLayer.toggleValues(region,val,fixed),

        setCandidates:   (region,c,centered=false) => contentLayer.setCandidates(region,c,centered),
        unsetCandidates: (region,c,centered=false) => contentLayer.unsetCandidates(region,c,centered),
        toggleCandidates:(region,c,centered=false) => contentLayer.toggleCandidates(region,c,centered),

        setColors:       (region,col)             => contentLayer.setColors(region,col),
        unsetColors:     (region,col)             => contentLayer.unsetColors(region,col),
        toggleColors:    (region,col,force=false) => contentLayer.toggleColors(region,col,force),
        // ----─  CONTENT-LAYER APIs END ────────────────────────────────────────


        resetBoard,
        saveBoard,
        loadBoard,

        cellLayer,
        hintLayer,
        hintRCLayer,
        contentLayer,

    };

    function initBoard() {
        grid.classList.add("board");

        hintLayer.init(board);
        hintRCLayer.init(board);
        cellLayer.init(board);
        contentLayer.init(board);
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
            contentLayer._generate(cellSize, usedSize, offset);
        }

        window.addEventListener("resize", resizeAndRebuild);
        resizeAndRebuild();
    }

    function resetBoard() {
        ruleManager.resetRules();
        contentLayer.resetContent();
        board.render();
    }

    function saveBoard() {
        let solverBoard = contentLayer.getSolverBoard();

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

    return board;
}
