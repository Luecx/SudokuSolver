import { RuleTypeHandler } from "./rule_handler.js";

export class DiagonalRuleHandler extends RuleTypeHandler {
    constructor(board) {
        super("Diagonal", board);
        this.tag = "Diagonal";
        this.can_create_rules = false;
    }

    defaultRules() {
        return []; // no instances
    }

    getGeneralRuleScheme() {
        return [
            {
                key: "diagonal",
                type: "boolean",
                label: gettext('Main Diagonal (<i class="bi bi-arrow-up-left"></i>)'),
                default: true
            },
            {
                key: "antiDiagonal",
                type: "boolean",
                label: gettext('Anti-Diagonal (<i class="bi bi-arrow-up-right"></i>)'),
                default: true
            }
        ];
    }

    getSpecificRuleScheme() {
        return []; // no per-rule options
    }

    getDescriptionHTML() {
        return `
            ${gettext("In <b>Diagonal Sudoku</b>, digits 1 to 9 must also appear exactly once on one or both diagonals.")}
            <ul>
                <li><b>${gettext('Main Diagonal')} (<i class="bi bi-arrow-up-left"></i>)</b>: ${gettext("From top-left to bottom-right.")}</li>
                <li><b>${gettext('Anti-Diagonal')} (<i class="bi bi-arrow-up-right"></i>)</b>: ${gettext("From top-right to bottom-left.")}</li>
            </ul>
            ${gettext("You can enable or disable each diagonal individually.")}
        `;
    }

    getDescriptionPlayHTML() {
        const diag = this.fields?.diagonal;
        const anti = this.fields?.antiDiagonal;

        if (diag && anti) {
            return gettext("In a <b>Diagonal Sudoku</b>, digits 1 to 9 must appear exactly once on both diagonals.");
        } else if (diag) {
            return gettext("In a <b>Diagonal Sudoku</b>, digits 1 to 9 must appear exactly once on the <b>main diagonal</b> (top-left to bottom-right).");
        } else if (anti) {
            return gettext("In a <b>Diagonal Sudoku</b>, digits 1 to 9 must appear exactly once on the <b>anti-diagonal</b> (top-right to bottom-left).");
        } else {
            return gettext("In a <b>Diagonal Sudoku</b>, diagonal constraints are disabled.");
        }
    }

    renderAll(ctx) {
        if (!this.enabled) return;
        this.render(ctx);
    }

    render(ctx) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
        ctx.lineWidth = 2;

        const gridSize = 9;
        const s = this.board.getCellSizeCTX();

        if (this.fields.diagonal) {
            const { x: xStart, y: yStart } = this.board.getCellTopLeftCTX(0, 0);
            const { x: xEnd, y: yEnd } = this.board.getCellTopLeftCTX(gridSize, gridSize);
            ctx.beginPath();
            ctx.moveTo(xStart, yStart);
            ctx.lineTo(xEnd, yEnd);
            ctx.stroke();
        }

        if (this.fields.antiDiagonal) {
            const { x: xStart, y: yStart } = this.board.getCellTopLeftCTX(0, gridSize);
            const { x: xEnd, y: yEnd } = this.board.getCellTopLeftCTX(gridSize, 0);
            ctx.beginPath();
            ctx.moveTo(xStart, yStart);
            ctx.lineTo(xEnd, yEnd);
            ctx.stroke();
        }

        ctx.restore();
    }
}
