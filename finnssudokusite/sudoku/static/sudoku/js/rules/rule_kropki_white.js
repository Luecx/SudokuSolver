import { RuleTypeHandler } from "../rule.js";
import { Board } from "../board.js";

export function setupWhiteKropkiRule() {
    const handler = new RuleTypeHandler("kropki_white");
    handler.label = "White Kropki";
    handler.showInCreatorUI = true;

    let possiblePairs = [];

    handler.onRegister = () => {
        const btn = document.getElementById("btnKropki_white");
        if (!btn) return;
        btn.addEventListener("click", () => {
            const isActive = Board.getCurrentHandlerName() === handler.name;
            if (isActive) {
                Board.stopHandler();
            } else {
                Board.startHandler(handler.name);
            }
        });
    };

    handler.onStartCreating = () => {
        const btn = document.getElementById("btnKropki_white");
        if (btn) btn.innerHTML = '<i class="fa fa-times"></i>';

        Board.disableMainGrid();
        possiblePairs = [];

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                for (const [dr, dc] of [[0, 1], [1, 0]]) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 9 || nc >= 9) continue;

                    const exists = handler.rules.some(rule => {
                        const [a, b] = rule.cells;
                        return (a.r === r && a.c === c && b.r === nr && b.c === nc) ||
                            (a.r === nr && a.c === nc && b.r === r && b.c === c);
                    });

                    if (!exists) {
                        possiblePairs.push([{ r, c }, { r: nr, c: nc }]);
                    }
                }
            }
        }

        // Inject the click handler directly
        Board.showEdgeHints(possiblePairs, (r1, c1, r2, c2) => {
            const i = possiblePairs.findIndex(([a, b]) =>
                (a.r === r1 && a.c === c1 && b.r === r2 && b.c === c2) ||
                (a.r === r2 && a.c === c2 && b.r === r1 && b.c === c1)
            );

            if (i !== -1) {
                handler.add({ cells: [{ r: r1, c: c1 }, { r: r2, c: c2 }] });
                possiblePairs.splice(i, 1);
                Board.showEdgeHints(possiblePairs, arguments.callee); // re-render with updated click
                Board.render(); // optional: redraw board
            }
        });
    };

    handler.onFinishedCreating = () => {
        const btn = document.getElementById("btnKropki_white");
        if (btn) btn.innerHTML = '<i class="fa fa-plus"></i>';

        Board.enableMainGrid();
        Board.hideEdgeHints();
        possiblePairs = [];
    };

    handler.render = (rule, ctx) => {
        const [a, b] = rule.cells;
        const ax = Board.getCellTopLeft(a.r, a.c);
        const bx = Board.getCellTopLeft(b.r, b.c);
        const s = Board.getCellSize();

        const cx = (ax.x + bx.x + s) / 2;
        const cy = (ax.y + bx.y + s) / 2;

        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };

    return handler;
}
