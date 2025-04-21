import {RuleTypeHandler} from "../rule.js";
import {RuleType} from "../rule_types.js";
export function setupBlackKropkiRule(board) {
    const handler = new RuleTypeHandler("kropki_black", board);
    handler.label = "Black Kropki";

    let possiblePairs = [];

    handler.rule_type = RuleType.SINGLE_CLICK_MANY;

    handler.ruleToText = (rule) => {
        const format = (c) => `(${c.r},${c.c})`;
        return rule.cells?.length === 2 ? `${format(rule.cells[0])} ● ${format(rule.cells[1])}` : JSON.stringify(rule);
    };

    function computeAvailablePairs() {
        possiblePairs = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                for (const [dr, dc] of [[0, 1], [1, 0]]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 9 || nc >= 9) continue;

                    const alreadyUsed = handler.rules.some(rule => {
                        const [a, b] = rule.cells;
                        return (a.r === r && a.c === c && b.r === nr && b.c === nc) ||
                            (a.r === nr && a.c === nc && b.r === r && b.c === c);
                    });

                    if (!alreadyUsed) possiblePairs.push([{ r, c }, { r: nr, c: nc }]);
                }
            }
        }
    }

    handler.onRegister = () => {
        const btn = document.getElementById("btnKropki_black");
        if (!btn) return;
        btn.addEventListener("click", () => {
            const isActive = board.getCurrentHandlerName() === handler.name;
            if (isActive) board.stopHandler();
            else board.startHandler(handler.name);
        });
    };

    handler.onStartCreating = () => {
        const btn = document.getElementById("btnKropki_black");
        if (btn) btn.innerHTML = '<i class="fa fa-times"></i>';

        board.saveInteractionState();
        board.disableClickable();
        board.disableSelectable();
        board.disableDraggable();

        computeAvailablePairs();

        const clickEdge = (r1, c1, r2, c2) => {
            const i = possiblePairs.findIndex(([a, b]) =>
                (a.r === r1 && a.c === c1 && b.r === r2 && b.c === c2) ||
                (a.r === r2 && a.c === c2 && b.r === r1 && b.c === c1));
            if (i !== -1) {
                handler.add({ cells: [{ r: r1, c: c1 }, { r: r2, c: c2 }] });
                possiblePairs.splice(i, 1);
                board.showEdgeHints(possiblePairs, clickEdge);
                board.render();
            }
        };

        board.showEdgeHints(possiblePairs, clickEdge);
    };

    handler.onFinishedCreating = () => {
        const btn = document.getElementById("btnKropki_black");
        if (btn) btn.innerHTML = '<i class="fa fa-plus"></i>';

        board.restoreInteractionState();
        board.hideEdgeHints();
        possiblePairs = [];
    };

    handler.render = (rule, ctx) => {
        const [a, b] = rule.cells;
        const ax = board.getCellTopLeft(a.r, a.c);
        const bx = board.getCellTopLeft(b.r, b.c);
        const s = board.getCellSize();
        const cx = (ax.x + bx.x + s) / 2;
        const cy = (ax.y + bx.y + s) / 2;

        ctx.save();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    };

    return handler;
}
