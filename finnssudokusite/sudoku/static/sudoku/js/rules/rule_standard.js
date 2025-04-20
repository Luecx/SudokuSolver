
import { RuleTypeHandler } from "../rule.js";
import { Board } from "../board.js";

export function setupStandardRule() {
    const handler = new RuleTypeHandler("standard");
    handler.label = "Standard";
    handler.showInCreatorUI = false;

    handler.renderAll = (ctx) => {
        const size = ctx.canvas.width;
        const step = Board.getCellSize();
        const pad = Board.getPadding();

        ctx.save();
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;

        console.log("renderign")

        for (let i = 1; i < 9; i++) {
            if (i % 3 === 0) continue;
            const pos = pad + i * step;

            console.log(`Drawing line at pos: ${pos}, pad: ${pad}, step: ${step}`);

            ctx.beginPath();
            ctx.moveTo(pad, pos);
            ctx.lineTo(size - pad, pos);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(pos, pad);
            ctx.lineTo(pos, size - pad);
            ctx.stroke();
        }

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        for (let i = 0; i <= 9; i += 3) {
            const pos = pad + i * step;

            ctx.beginPath();
            ctx.moveTo(pad, pos);
            ctx.lineTo(size - pad, pos);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(pos, pad);
            ctx.lineTo(pos, size - pad);
            ctx.stroke();
        }

        ctx.restore();
    };

    return handler;
}
