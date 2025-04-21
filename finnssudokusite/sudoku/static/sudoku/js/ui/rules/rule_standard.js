// rules/rule_standard.js
import {RuleTypeHandler} from "../rule.js";
import {RuleType} from "../rule_types.js";

export function setupStandardRule(board) {
    const handler = new RuleTypeHandler("standard", board);
    handler.label = "Standard";
    handler.tag  =  "Standard";

    handler.rule_type = RuleType.SINGLE_CLICK_SINGLE;

    handler.onStartCreating = () => {
        handler.rules = [];
        handler.add({ type: "standard" });
        board.stopHandler();
        board.render();
    };

    handler.ruleToText = () => "Standard grid";

    handler.renderAll = (ctx) => {
        if (handler.rules.length === 0) return;

        ctx.save();
        ctx.strokeStyle = "#000";
        ctx.lineWidth   = 2;

        const gridSize = 9;

        // Bold horizontal lines at rows 3, 6
        for (let row = 3; row < gridSize; row += 3) {
            const { y } = board.getCellTopLeft(row, 0);
            const { x: xStart } = board.getCellTopLeft(0, 0);
            const { x: xEnd }   = board.getCellTopLeft(0, gridSize);
            ctx.beginPath();
            ctx.moveTo(xStart, y);
            ctx.lineTo(xEnd, y);
            ctx.stroke();
        }

        // Bold vertical lines at cols 3, 6
        for (let col = 3; col < gridSize; col += 3) {
            const { x } = board.getCellTopLeft(0, col);
            const { y: yStart } = board.getCellTopLeft(0, 0);
            const { y: yEnd }   = board.getCellTopLeft(gridSize, 0);
            ctx.beginPath();
            ctx.moveTo(x, yStart);
            ctx.lineTo(x, yEnd);
            ctx.stroke();
        }

        ctx.restore();
    };

    return handler;
}
