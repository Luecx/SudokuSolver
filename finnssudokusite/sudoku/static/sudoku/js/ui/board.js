import { RuleManager } from "./board_ruleManager.js";
import { BoardRenderer } from "./board_renderer.js";
import { InteractionManager } from "./board_selectionManager.js";
import { HintDotLayer } from "./board_hintDotLayer.js";
import { CellLayer } from "./board_cellLayer.js";

/**
 * Initializes and returns a Sudoku board instance.
 * Wires together modular components for rendering, interaction, rule handling, and hint display.
 *
 * @param {HTMLElement} container - The HTML element that wraps the canvas and grid.
 * @param {HTMLCanvasElement} canvas - The canvas used for drawing overlays and rules.
 * @param {HTMLElement} grid - The container element for HTML grid cells.
 * @returns {Object} Board API with various interaction methods.
 */
export function createBoard(container, canvas, grid) {
    const gridSize = 9;
    const paddingRatio = 0.04;

    const ruleManager = new RuleManager();
    const renderer = new BoardRenderer(canvas, gridSize, paddingRatio);
    const hintLayer = new HintDotLayer(container, renderer);
    const cellLayer = new CellLayer(container, gridSize);
    const interactionManager = new InteractionManager(grid, ruleManager, renderer);

    const board = {
        initBoard,
        render: () => renderer.render(ruleManager.getAllHandlers(), ruleManager.getCurrentHandler()),
        getCellTopLeft: (r, c) => renderer.getCellTopLeft(r, c),
        getCellCorners: (r, c) => renderer.getCellCorners(r, c),
        getPadding: () => renderer.getPadding(),
        getCellSize: () => renderer.getCellSize(),
        getCanvasContext: () => renderer.getContext(),

        registerHandler: ruleManager.registerHandler.bind(ruleManager),
        startHandler: ruleManager.startHandler.bind(ruleManager),
        stopHandler: ruleManager.stopHandler.bind(ruleManager),
        getCurrentHandlerName: () => ruleManager.getCurrentHandler()?.name || null,
        getAllHandlers: () => ruleManager.getAllHandlers(),

        setSelection: config => interactionManager.setSelection(config),
        showSelectionBlue: show => interactionManager.showSelectionBlue(show),

        addRenderCall: (name, func) => renderer.addRenderCall(name, func),
        removeRenderCall: name => renderer.removeRenderCall(name),
        triggerRender: () => renderer.triggerRender(),

        getRulesJSON: () => ruleManager.serializeRules(),
        loadRulesJSON: json => ruleManager.deserializeRules(json),
        getTags: () => ruleManager.getTags(),

        cellLayer: cellLayer,
        hintLayer: hintLayer, // Expose the unified hint layer
    };

    function initBoard() {
        grid.classList.add("board");

        // Wire board reference into systems that need it
        hintLayer.init(board);
        cellLayer.init(board);
        interactionManager.setup(board);
        ruleManager.registerDefaults(board);

        function resizeAndRebuild() {
            renderer.setup(container);

            const cellSize = renderer.getCellSize();
            const usedSize = renderer.getUsedSize();
            const offset = renderer.getGridOffset();

            cellLayer.generate(cellSize, usedSize, offset);
            hintLayer.update(); // Automatically uses currentTarget from show()
            board.render();
        }

        window.addEventListener("resize", resizeAndRebuild);
        resizeAndRebuild();
    }

    return board;
}
