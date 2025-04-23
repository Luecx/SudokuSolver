export function buildInsetPath(cells, inset) {
    const groups = groupConnectedRegions(cells);

    const allInsetLoops = [];

    for (const group of groups) {
        const edges = extractAllCellEdges(group);
        const boundaryEdges = removeInternalEdges(edges);
        const loops = traceClosedLoops(boundaryEdges);
        const sortedLoops = sortLoops(loops);
        const insetLoops = sortedLoops.map(loop => applyInsetToLoop(loop, inset));
        allInsetLoops.push(...insetLoops);
    }

    return allInsetLoops;
}

// --- STEP 0: Group cell regions based on side adjacency ---
function groupConnectedRegions(cells) {
    const visited = new Set();
    const groups = [];

    const key = (x, y) => `${x},${y}`;
    const map = new Map(cells.map(({x, y}) => [key(x, y), {x, y}]));

    function dfs(cell, group) {
        const id = key(cell.x, cell.y);
        if (visited.has(id)) return;
        visited.add(id);
        group.push(cell);

        const directions = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 }
        ];

        for (const {dx, dy} of directions) {
            const neighborKey = key(cell.x + dx, cell.y + dy);
            if (map.has(neighborKey)) {
                dfs(map.get(neighborKey), group);
            }
        }
    }

    for (const cell of cells) {
        const id = key(cell.x, cell.y);
        if (!visited.has(id)) {
            const group = [];
            dfs(cell, group);
            groups.push(group);
        }
    }

    return groups;
}

// STEP 1: Extract all edges and remember their origin cell
function extractAllCellEdges(cells) {
    const allEdges = [];

    for (const { x, y } of cells) {
        const r = x;
        const c = y;

        const tl = { x: c,     y: r     };
        const tr = { x: c + 1, y: r     };
        const br = { x: c + 1, y: r + 1 };
        const bl = { x: c,     y: r + 1 };

        allEdges.push({ a: tl, b: tr, cellKey: `${x},${y}` }); // top
        allEdges.push({ a: tr, b: br, cellKey: `${x},${y}` }); // right
        allEdges.push({ a: br, b: bl, cellKey: `${x},${y}` }); // bottom
        allEdges.push({ a: bl, b: tl, cellKey: `${x},${y}` }); // left
    }

    return allEdges;
}

// STEP 2: Remove internal edges
function removeInternalEdges(edges) {
    const remaining = [];

    for (const edge of edges) {
        const { a: a1, b: b1 } = edge;
        let found = false;

        for (let i = 0; i < remaining.length; i++) {
            const { a: a2, b: b2 } = remaining[i];
            if (
                (pointEquals(a1, b2) && pointEquals(b1, a2)) ||
                (pointEquals(a1, a2) && pointEquals(b1, b2))
            ) {
                remaining.splice(i, 1); // Remove matching opposite
                found = true;
                break;
            }
        }

        if (!found) {
            remaining.push(edge);
        }
    }

    return remaining;
}

// STEP 3: Trace closed polygon loops with cell-aware preference
function traceClosedLoops(edges) {
    const edgeMap = new Map();

    for (const { a, b, cellKey } of edges) {
        const k = pointKey(a);
        if (!edgeMap.has(k)) edgeMap.set(k, []);
        edgeMap.get(k).push({ from: a, to: b, cellKey });
    }

    const visited = new Set();
    const loops = [];

    for (const { a: startA, b: startB, cellKey: startCell } of edges) {
        const id = `${pointKey(startA)}|${pointKey(startB)}`;
        if (visited.has(id)) continue;

        const loop = [startA];
        let current = startB;
        let prev = startA;
        let currentCell = startCell;

        visited.add(id);

        while (!pointEquals(current, startA)) {
            loop.push(current);

            const candidates = edgeMap.get(pointKey(current)) || [];

            // Prefer edges from the same original cell
            let nextEdge = candidates.find(
                e => !pointEquals(e.to, prev) && e.cellKey === currentCell
            );

            // Fallback to any unused continuation
            if (!nextEdge) {
                nextEdge = candidates.find(e => !pointEquals(e.to, prev));
            }

            if (!nextEdge) break;

            visited.add(`${pointKey(nextEdge.from)}|${pointKey(nextEdge.to)}`);
            prev = current;
            current = nextEdge.to;
            currentCell = nextEdge.cellKey;
        }

        loops.push(loop);
    }

    return loops;
}
// --- STEP 4: Inset a loop polygon ---
function applyInsetToLoop(loop, inset) {
    const len = loop.length;
    const offsetSegments = [];

    for (let i = 0; i < len; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % len];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lenAB = Math.hypot(dx, dy);
        if (lenAB === 0) {
            offsetSegments.push([a, b]);
            continue;
        }

        const nx = dy / lenAB;
        const ny = -dx / lenAB;

        offsetSegments.push([
            {
                x: a.x + nx * -inset,
                y: a.y + ny * -inset
            },
            {
                x: b.x + nx * -inset,
                y: b.y + ny * -inset
            }
        ]);
    }

    const insetLoop = [];
    for (let i = 0; i < len; i++) {
        const [p1, p2] = offsetSegments[(i - 1 + len) % len];
        const [p3, p4] = offsetSegments[i];
        const intersection = lineIntersection(p1, p2, p3, p4);
        insetLoop.push(intersection || p3);
    }

    return insetLoop;
}

// --- STEP 5: Sort loops by area (largest first) ---
function sortLoops(loops) {
    function loopArea(loop) {
        let area = 0;
        for (let i = 0; i < loop.length; i++) {
            const a = loop[i];
            const b = loop[(i + 1) % loop.length];
            area += (a.x * b.y - b.x * a.y);
        }
        return Math.abs(area / 2);
    }

    return loops.slice().sort((a, b) => loopArea(b) - loopArea(a));
}

// --- Helpers ---
function pointEquals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

function pointKey(p) {
    return `${p.x},${p.y}`;
}

function lineIntersection(p1, p2, p3, p4) {
    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = a1 * p1.x + b1 * p1.y;

    const a2 = p4.y - p3.y;
    const b2 = p3.x - p4.x;
    const c2 = a2 * p3.x + b2 * p3.y;

    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-8) return null;

    return {
        x: (b2 * c1 - b1 * c2) / det,
        y: (a1 * c2 - a2 * c1) / det
    };
}
