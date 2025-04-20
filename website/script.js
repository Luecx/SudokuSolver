// Refactored Rule Editor (Fixed preview arrow rendering)

class RuleHandler {
    constructor(name, { onStart = () => {}, onClick = () => {}, onDone = () => {}, render = () => {}, toText = () => '' } = {}) {
        this.name = name;
        this.rules = [];
        this.onStart = onStart;
        this.onClick = onClick;
        this.onDone = onDone;
        this.render = render;
        this.toText = toText;
    }

    start() { this.onStart(); }
    click(r, c) { this.onClick(r, c); }
    done() { this.onDone(); }

    add(rule) {
        rule.id = Date.now();
        this.rules.push(rule);
    }

    remove(id) {
        this.rules = this.rules.filter(r => r.id !== id);
    }

    renderAll(listEl) {
        listEl.innerHTML = '';
        this.rules.forEach(rule => {
            appendListItem(this.toText(rule), listEl, () => {
                this.remove(rule.id);
                renderAll();
            });
            this.render(rule);
        });
    }
}

const state = {
    mode: null,
    arrowPoints: [],
    handlers: {},
    selectedCell: null
};

const boardEl = document.getElementById('board');
const svgOverlay = document.getElementById('svgOverlay');

function initBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('click', () => {
                if (state.mode) {
                    state.handlers[state.mode].click(r, c);
                    renderAll();
                } else {
                    if (state.selectedCell) {
                        state.selectedCell.classList.remove('selected');
                    }
                    cell.classList.add('selected');
                    state.selectedCell = cell;
                }
            });
            boardEl.appendChild(cell);
        }
    }
    renderAll();
}

document.addEventListener('keydown', (event) => {
    const cell = state.selectedCell;
    if (!cell) return;

    const key = event.key;

    if (/^[1-9]$/.test(key)) {
        cell.textContent = key;
        cell.classList.add('filled');
    } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        cell.textContent = '';
        cell.classList.remove('filled');
    }
});

document.addEventListener('click', (event) => {
    if (!event.target.classList.contains('cell') && state.selectedCell) {
        state.selectedCell.classList.remove('selected');
        state.selectedCell = null;
    }
});

['white', 'black', 'v', 'x', 'arrow', 'sandwich'].forEach(type => {
    document.getElementById('btn' + capitalize(type)).addEventListener('click', () => toggleMode(type));
});

function toggleMode(mode) {
    if (state.mode === mode) {
        state.handlers[mode].done();
        state.mode = null;
    } else {
        if (state.mode) state.handlers[state.mode].done();
        state.mode = mode;
        state.handlers[mode].start();
    }
    updateButtons();
    renderAll();
}

function updateButtons() {
    ['white','black','v','x','arrow','sandwich'].forEach(type => {
        const btn = document.getElementById('btn' + capitalize(type));
        btn.innerHTML = state.mode === type ? '<i class="fa fa-times"></i>' : '<i class="fa fa-plus"></i>';
    });
}

function renderAll() {
    boardEl.querySelectorAll('.dot, .highlight, .mark-letter').forEach(el => el.remove());
    svgOverlay.querySelectorAll('polyline, circle').forEach(el => el.remove());

    ['white','black','v','x','arrow','sandwich'].forEach(type => {
        const listEl = document.getElementById('list' + capitalize(type));
        state.handlers[type].renderAll(listEl);
    });

    if (state.mode === 'sandwich') renderSandwichSelectors();

    if (state.mode === 'arrow' && state.arrowPoints.length > 1) {
        drawArrow(state.arrowPoints, true);
    }

    if (['white','black','v','x'].includes(state.mode)) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                [[r+1,c],[r,c+1]].forEach(([nr,nc]) => {
                    if (nr<9 && nc<9 && !ruleExists(r,c,nr,nc,state.mode)) {
                        drawHighlight(r,c,nr,nc);
                    }
                });
            }
        }
    }
}

function drawDot(rule, color='white') {
    const [A,B] = rule.cells;
    const x = (A.c + B.c)*25 + 25, y = (A.r + B.r)*25 + 25;
    const dot = document.createElement('div');
    dot.className = `dot ${color}`;
    dot.style.left = x+'px';
    dot.style.top  = y+'px';
    boardEl.appendChild(dot);
}

function drawMark(rule, markType) {
    const [A,B] = rule.cells;
    const x = (A.c + B.c)*25 + 25, y = (A.r + B.r)*25 + 25;
    const m = document.createElement('div');
    m.className = `mark-letter ${markType}`;
    m.textContent = markType.toUpperCase();
    m.style.left = x+'px';
    m.style.top = y+'px';
    boardEl.appendChild(m);
}

function drawHighlight(r1,c1,r2,c2) {
    const x = (c1+c2)*25+25, y = (r1+r2)*25+25;
    const hl = document.createElement('div');
    hl.className = 'highlight';
    hl.style.left = x+'px';
    hl.style.top = y+'px';
    hl.addEventListener('click', () => {
        state.handlers[state.mode].add({
            cells: [{r:r1,c:c1},{r:r2,c:c2}]
        });
        renderAll();
    });
    boardEl.appendChild(hl);
}

function drawArrow(points, isPreview) {
    if (points.length < 2) return;
    const [start, second] = points;
    const cx = start.c*50+25, cy = start.r*50+25, radius = 20;
    const circ = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circ.setAttribute('cx',cx); circ.setAttribute('cy',cy); circ.setAttribute('r',radius);
    circ.classList.add('arrow-base');
    svgOverlay.appendChild(circ);
    const tx = second.c*50+25, ty = second.r*50+25;
    const dx = tx-cx, dy = ty-cy, d = Math.hypot(dx,dy)||1;
    const ux=dx/d, uy=dy/d;
    const p0x = cx + ux*radius, p0y = cy + uy*radius;
    const coords = [`${p0x},${p0y}`, ...points.slice(1).map(p => `${p.c*50+25},${p.r*50+25}`)].join(' ');
    const line = document.createElementNS('http://www.w3.org/2000/svg','polyline');
    line.setAttribute('points',coords);
    line.classList.add(isPreview ? 'preview' : 'static');
    svgOverlay.appendChild(line);
}

function ruleExists(r1,c1,r2,c2,type) {
    return state.handlers[type].rules.some(rule => {
        const [A,B] = rule.cells || [];
        return (A && B) && ((A.r===r1&&A.c===c1&&B.r===r2&&B.c===c2) || (A.r===r2&&A.c===c2&&B.r===r1&&B.c===c1));
    });
}

function appendListItem(text, parentEl, onDelete) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.textContent = text;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-link text-danger';
    btn.innerHTML = '<i class="fa fa-times"></i>';
    btn.addEventListener('click', onDelete);
    li.appendChild(btn);
    parentEl.appendChild(li);
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

state.handlers.white = new RuleHandler('white', {
    render: rule => drawDot(rule, 'white'),
    toText: rule => `• (${rule.cells[0].r},${rule.cells[0].c}) – (${rule.cells[1].r},${rule.cells[1].c})`
});

state.handlers.black = new RuleHandler('black', {
    render: rule => drawDot(rule, 'black'),
    toText: rule => `• (${rule.cells[0].r},${rule.cells[0].c}) – (${rule.cells[1].r},${rule.cells[1].c})`
});

state.handlers.v = new RuleHandler('v', {
    render: rule => drawMark(rule, 'v'),
    toText: rule => `V (${rule.cells[0].r},${rule.cells[0].c}) – (${rule.cells[1].r},${rule.cells[1].c})`
});

state.handlers.x = new RuleHandler('x', {
    render: rule => drawMark(rule, 'x'),
    toText: rule => `X (${rule.cells[0].r},${rule.cells[0].c}) – (${rule.cells[1].r},${rule.cells[1].c})`
});

state.handlers.arrow = new RuleHandler('arrow', {
    onStart: () => state.arrowPoints = [],
    onClick: (r,c) => {
        state.arrowPoints.push({r,c});
        renderAll();
    },
    onDone: () => {
        if (state.arrowPoints.length > 1) {
            state.handlers.arrow.add({ points: [...state.arrowPoints] });
        }
        state.arrowPoints = [];
    },
    render: rule => drawArrow(rule.points, false),
    toText: rule => rule.points.map(p => `(${p.r},${p.c})`).join(' → ')
});

state.handlers.sandwich = new RuleHandler('sandwich', {
    onStart: renderSandwichSelectors,
    onDone: () => {
        document.querySelectorAll('.sandwich-arrow').forEach(el => el.remove());
    },
    render: drawSandwich,
    toText: rule => `Sandwich ${rule.orientation} ${rule.index+1} = ${rule.sum}`
});

function renderSandwichSelectors() {
    document.querySelectorAll('.sandwich-arrow').forEach(el => el.remove());
    const container = document.querySelector('.board-container');

    for (let r = 0; r < 9; r++) {
        const btn = document.createElement('i');
        btn.className = 'fas fa-arrow-right sandwich-arrow';
        btn.style.top  = `${r*50+25}px`;
        btn.style.left = `-20px`;
        btn.dataset.orientation = 'row';
        btn.dataset.index = r;
        btn.addEventListener('click', onSandwichClick);
        container.appendChild(btn);
    }

    for (let c = 0; c < 9; c++) {
        const btn = document.createElement('i');
        btn.className = 'fas fa-arrow-down sandwich-arrow';
        btn.style.left = `${c*50+25}px`;
        btn.style.top  = `-20px`;
        btn.dataset.orientation = 'col';
        btn.dataset.index = c;
        btn.addEventListener('click', onSandwichClick);
        container.appendChild(btn);
    }
}

function onSandwichClick(e) {
    const { orientation, index } = e.currentTarget.dataset;
    const sum = prompt(`Enter sandwich sum for ${orientation} ${Number(index)+1}:`);
    const val = parseInt(sum, 10);
    if (!isNaN(val)) {
        state.handlers.sandwich.add({ orientation, index: Number(index), sum: val });
        renderAll();
    }
}

function drawSandwich(rule) {
    const { orientation, index, sum } = rule;
    const label = document.createElement('div');
    label.className = 'mark-letter sandwich';
    label.textContent = sum;
    if (orientation === 'row') {
        label.style.left = '-40px';
        label.style.top = `${index*50 + 25}px`;
    } else {
        label.style.top = '-40px';
        label.style.left = `${index*50 + 25}px`;
    }
    document.querySelector('.board-container').appendChild(label);
}

initBoard();
