import { RuleTypeHandler } from "./rule_handler.js";

export class StandardRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Standard", board);
        this.tag = "Standard";
        this.can_create_rules = false;
    }

    defaultRules() {
        return [];
    }

    getGeneralRuleScheme() {
        return [];
    }

    getSpecificRuleScheme() {
        return [];
    }

    getDescriptionHTML() {
        return `
            ${gettext("In <b>Standard Sudoku</b>, each row, each column, and each 3×3 block must contain the numbers <b>1</b> to <b>9</b> exactly once, without repetition.")}
        `;
    }

    getDescriptionPlayHTML() {
        return gettext("In a <b>Standard Sudoku</b>, every row, column, and 3×3 box must contain the digits <b>1</b> to <b>9</b> exactly once.");
    }

    renderAll(ctx) {
        if (!this.enabled) return;
        this.render(ctx);
    }

    render(ctx) {
        ctx.save();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;

        const gridSize = 9;
        const s = this.board.getCellSizeCTX();

        for (let row = 3; row < gridSize; row += 3) {
            const { y } = this.board.getCellTopLeftCTX(row, 0);
            const { x: xStart } = this.board.getCellTopLeftCTX(0, 0);
            const { x: xEnd } = this.board.getCellTopLeftCTX(0, gridSize);
            ctx.beginPath();
            ctx.moveTo(xStart, y);
            ctx.lineTo(xEnd, y);
            ctx.stroke();
        }

        for (let col = 3; col < gridSize; col += 3) {
            const { x } = this.board.getCellTopLeftCTX(0, col);
            const { y: yStart } = this.board.getCellTopLeftCTX(0, 0);
            const { y: yEnd } = this.board.getCellTopLeftCTX(gridSize, 0);
            ctx.beginPath();
            ctx.moveTo(x, yStart);
            ctx.lineTo(x, yEnd);
            ctx.stroke();
        }

        ctx.restore();
    }
}
