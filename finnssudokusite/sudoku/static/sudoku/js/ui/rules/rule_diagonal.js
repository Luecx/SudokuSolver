import {RuleTypeHandler} from "../board_rule.js";
import {RuleType} from "../board_ruleTypes.js";
export function setupDiagonalRule(board) {
    const handler = new RuleTypeHandler("diagonal", board);
    handler.label = "Diagonal";
    handler.tag  =  "Diagonal";

    handler.rule_type = RuleType.SINGLE_CLICK_SINGLE;

    handler.onStartCreating = () => {
        handler.rules = [];
        handler.add({ type: "diagonal" });
        board.stopHandler(); // Immediately close the tool
        board.render();
    };

    handler.ruleToText = () => "Main + Anti Diagonal";

    handler.renderAll = (ctx) => {
        if (handler.rules.length === 0) return; // Only draw if rule is present

        const cellSize = board.getCellSize();
        ctx.save();
        ctx.strokeStyle = "#00f";
        ctx.lineWidth = 2;

        const topLeft     = board.getCellTopLeft(0, 0);
        const bottomRight = board.getCellTopLeft(8, 8);
        const bottomLeft  = board.getCellTopLeft(8, 0);
        const topRight    = board.getCellTopLeft(0, 8);

        const offset = cellSize / 2;

        // Main diagonal
        ctx.beginPath();
        ctx.moveTo(topLeft.x + offset, topLeft.y + offset);
        ctx.lineTo(bottomRight.x + offset, bottomRight.y + offset);
        ctx.stroke();

        // Anti diagonal
        ctx.beginPath();
        ctx.moveTo(bottomLeft.x + offset, bottomLeft.y + offset);
        ctx.lineTo(topRight.x + offset, topRight.y + offset);
        ctx.stroke();

        ctx.restore();
    };

    return handler;
}
