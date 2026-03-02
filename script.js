'use strict';

// ── TILE SIZE & SPEED ─────────────────────────────────────────────────────────
const CELL  = 28;
const SPEED = 2;

// ── MAP: 21 cols × 23 rows ────────────────────────────────────────────────────
// 0 = dot   1 = wall   2 = power pellet   3 = empty (no dot)
// EVERY open tile pacman/ghosts can be on must be 0, 2, or 3.
// Pac-Man spawns at col 10, row 16  (value 3 — confirmed below)
// Ghosts spawn at cols 9-11, rows 9-11 (ghost house — all 3)
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row 0
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 1
    [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1], // row 2
    [1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1], // row 3
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 4
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1], // row 5
    [1,0,1,1,0,1,0,0,0,0,3,0,0,0,0,1,0,1,1,0,1], // row 6
    [1,0,0,0,0,1,0,1,1,3,1,3,1,1,0,1,0,0,0,0,1], // row 7
    [1,1,1,1,0,1,0,1,3,3,3,3,3,1,0,1,0,1,1,1,1], // row 8
    [3,3,3,1,0,1,0,1,3,3,3,3,3,1,0,1,0,1,3,3,3], // row 9  ghost house row 1
    [3,3,3,1,0,1,3,3,3,3,3,3,3,3,3,1,0,1,3,3,3], // row 10 ghost house row 2
    [3,3,3,1,0,1,0,1,3,3,3,3,3,1,0,1,0,1,3,3,3], // row 11 ghost house row 3
    [1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1], // row 12
    [1,0,0,0,0,1,0,0,0,0,3,0,0,0,0,1,0,0,0,0,1], // row 13
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1], // row 14
    [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1], // row 15
    [1,0,1,1,0,1,0,1,1,1,3,1,1,1,0,1,0,1,1,0,1], // row 16  pac-man: col10,row16 = 3 ✓
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 17
    [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1], // row 18
    [1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1], // row 19
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 20
    [1,0,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1], // row 21
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 22
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row 23
];

const COLS = MAP[0].length;   // 21
const ROWS = MAP.length;      // 24
const CW   = COLS * CELL;     // canvas width
const CH   = ROWS * CELL;     // canvas height

// ── CANVAS ───────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = CW;
canvas.height = CH;

// ── TILE HELPERS ─────────────────────────────────────────────────────────────
function tileCol(px) { return Math.floor(px / CELL); }
function tileRow(py) { return Math.floor(py / CELL); }
function midX(c)     { return c * CELL + CELL / 2; }
function midY(r)     { return r * CELL + CELL / 2; }

function isWallTile(c, r) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false; // edges are tunnels
    return MAP[r][c] === 1;
}

// Check if circle at (nx,ny) with given radius overlaps any wall tile.
// We sample the 4 corners of a box slightly smaller than the radius.
function blocked(nx, ny, r) {
    const s = r * 0.78; // inset — not too large, not too small
    return isWallTile(tileCol(nx - s), tileRow(ny - s)) ||
           isWallTile(tileCol(nx + s), tileRow(ny - s)) ||
           isWallTile(tileCol(nx - s), tileRow(ny + s)) ||
           isWallTile(tileCol(nx + s), tileRow(ny + s));
}

// Snap a pixel coordinate to the nearest cell-centre if close enough.
function snap(v) {
    const rem = ((v % CELL) + CELL) % CELL;
    const off = rem < CELL / 2 ? rem : rem - CELL;
    return Math.abs(off) < SPEED + 2 ? v - off : v;
}

// ── STATE ────────────────────────────────────────────────────────────────────
let dots, powers, pac, ghosts;
let score = 0, lives = 3;
let raf = null, frameN = 0;
let running = false, paused = false;
let scaredTimer = null;

// ── INIT ─────────────────────────────────────────────────────────────────────
function buildMap() {
    dots = []; powers = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (MAP[r][c] === 0) dots.push({ x: midX(c), y: midY(r), eaten: false });
            if (MAP[r][c] === 2) powers.push({ x: midX(c), y: midY(r), eaten: false });
        }
    }
}

// Pac-Man: col 10, row 16 — MAP[16][10] = 3 ✓
function makePac() {
    // Validate at runtime
    const v = MAP[16][10];
    if (v === 1) console.error('PAC SPAWN IS A WALL!');
    return { x: midX(10), y: midY(16), vx: 0, vy: 0, wantVx: 0, wantVy: 0, dir: 0, r: 11 };
}

// Ghosts: all in the ghost house area (rows 9-11, cols 8-12 are all 3)
const GHOST_DEFS = [
    { c: 9,  r: 9,  color: '#ff0000', ivx:  SPEED, ivy: 0 },
    { c: 11, r: 9,  color: '#ffb8ff', ivx: -SPEED, ivy: 0 },
    { c: 9,  r: 11, color: '#00ffff', ivx: 0, ivy:  SPEED },
    { c: 11, r: 11, color: '#ffb852', ivx: 0, ivy: -SPEED },
];

function makeGhosts() {
    return GHOST_DEFS.map(d => {
        const v = MAP[d.r][d.c];
        if (v === 1) console.error(`GHOST SPAWN (${d.c},${d.r}) IS A WALL!`);
        return { x: midX(d.c), y: midY(d.r), vx: d.ivx, vy: d.ivy, color: d.color, scared: false, dead: false, r: 11 };
    });
}

function init() {
    buildMap();
    pac    = makePac();
    ghosts = makeGhosts();
    score  = 0; lives = 3;
    updateHUD();
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

// ── DRAW ─────────────────────────────────────────────────────────────────────
function drawScene() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CW, CH);

    // Walls
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (MAP[r][c] !== 1) continue;
            const x = c * CELL, y = r * CELL;
            ctx.fillStyle = '#1044bb';
            ctx.fillRect(x, y, CELL, CELL);
            ctx.strokeStyle = '#3377ff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
        }
    }

    // Dots
    ctx.fillStyle = '#ffcc88';
    for (const d of dots) {
        if (d.eaten) continue;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Power pellets (blink)
    if (Math.floor(frameN / 15) % 2 === 0) {
        ctx.fillStyle = '#fff200';
        ctx.shadowColor = '#fff200';
        ctx.shadowBlur = 12;
        for (const p of powers) {
            if (p.eaten) continue;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // Pac-Man
    const mouth = 0.22 + 0.18 * Math.abs(Math.sin(frameN * 0.2));
    ctx.save();
    ctx.translate(pac.x, pac.y);
    ctx.rotate(pac.dir);
    ctx.fillStyle = '#ffe033';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, pac.r, mouth, Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Ghosts
    for (const g of ghosts) {
        if (g.dead) continue;
        const { x, y, r, scared, color } = g;
        ctx.save();
        ctx.fillStyle = scared ? '#2244cc' : color;
        // Body
        ctx.beginPath();
        ctx.arc(x, y - 2, r, Math.PI, 0);
        ctx.lineTo(x + r, y + r);
        const sw = (r * 2) / 3;
        for (let i = 0; i < 3; i++) {
            const bx = x + r - i * sw;
            ctx.quadraticCurveTo(bx - sw * 0.25, y + r + 5, bx - sw * 0.5, y + r);
            ctx.quadraticCurveTo(bx - sw * 0.75, y + r - 4, bx - sw, y + r);
        }
        ctx.closePath();
        ctx.fill();
        // Eyes
        if (!scared) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(x - 4, y - 4, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x + 4, y - 4, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#00f';
            ctx.beginPath(); ctx.arc(x - 4, y - 3, 1.8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + 4, y - 3, 1.8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// ── PAC-MAN MOVEMENT ─────────────────────────────────────────────────────────
function movePac() {
    // Try queued direction: snap perpendicular axis first for smooth turning
    if (pac.wantVx !== 0 || pac.wantVy !== 0) {
        let tx = pac.x, ty = pac.y;
        if (pac.wantVx !== 0) ty = snap(pac.y); // moving horizontally → snap Y
        if (pac.wantVy !== 0) tx = snap(pac.x); // moving vertically   → snap X
        if (!blocked(tx + pac.wantVx, ty + pac.wantVy, pac.r)) {
            pac.x = tx; pac.y = ty;
            pac.vx = pac.wantVx; pac.vy = pac.wantVy;
            if      (pac.vx > 0) pac.dir = 0;
            else if (pac.vx < 0) pac.dir = Math.PI;
            else if (pac.vy > 0) pac.dir = Math.PI / 2;
            else                 pac.dir = -Math.PI / 2;
        }
    }

    // Continue current direction
    if (pac.vx !== 0 || pac.vy !== 0) {
        const nx = pac.x + pac.vx;
        const ny = pac.y + pac.vy;
        if (!blocked(nx, ny, pac.r)) {
            pac.x = nx; pac.y = ny;
        } else {
            pac.vx = 0; pac.vy = 0; // stop at wall
        }
    }

    // Tunnel wrap
    if (pac.x < 0)    pac.x = CW;
    if (pac.x > CW)   pac.x = 0;
}

// ── GHOST MOVEMENT ───────────────────────────────────────────────────────────
const DIRS = [
    { vx:  SPEED, vy: 0 },
    { vx: -SPEED, vy: 0 },
    { vx: 0, vy:  SPEED },
    { vx: 0, vy: -SPEED },
];

function moveGhost(g) {
    const nx = g.x + g.vx;
    const ny = g.y + g.vy;

    if (!blocked(nx, ny, g.r)) {
        g.x = nx; g.y = ny;
    } else {
        // Snap to grid then pick a valid new direction
        g.x = snap(g.x);
        g.y = snap(g.y);
        const opts = DIRS.filter(d =>
            !(d.vx === -g.vx && d.vy === -g.vy) &&
            !blocked(g.x + d.vx, g.y + d.vy, g.r)
        );
        if (opts.length > 0) {
            const p = opts[Math.floor(Math.random() * opts.length)];
            g.vx = p.vx; g.vy = p.vy;
        } else {
            g.vx = -g.vx; g.vy = -g.vy; // reverse as last resort
        }
    }

    // Random turn at junctions (~2% per frame)
    if (Math.random() < 0.02) {
        const sx = snap(g.x), sy = snap(g.y);
        if (Math.abs(sx - g.x) < 2 && Math.abs(sy - g.y) < 2) {
            const opts = DIRS.filter(d =>
                !(d.vx === -g.vx && d.vy === -g.vy) &&
                !blocked(g.x + d.vx, g.y + d.vy, g.r)
            );
            if (opts.length > 0) {
                const p = opts[Math.floor(Math.random() * opts.length)];
                g.vx = p.vx; g.vy = p.vy;
            }
        }
    }

    // Tunnel wrap
    if (g.x < 0)  g.x = CW;
    if (g.x > CW) g.x = 0;
}

// ── COLLISIONS ───────────────────────────────────────────────────────────────
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function collectDots() {
    for (const d of dots) {
        if (!d.eaten && dist(pac, d) < pac.r + 3) {
            d.eaten = true; score += 10; updateHUD();
        }
    }
    for (const p of powers) {
        if (!p.eaten && dist(pac, p) < pac.r + 9) {
            p.eaten = true; score += 50; updateHUD();
            frightenGhosts();
        }
    }
}

function frightenGhosts() {
    ghosts.forEach(g => { if (!g.dead) g.scared = true; });
    if (scaredTimer) clearTimeout(scaredTimer);
    scaredTimer = setTimeout(() => ghosts.forEach(g => g.scared = false), 8000);
}

function checkGhostCollision() {
    for (const g of ghosts) {
        if (g.dead) continue;
        if (dist(pac, g) < pac.r + g.r - 4) {
            if (g.scared) {
                g.dead = true; g.scared = false;
                score += 200; updateHUD();
            } else {
                loseLife(); return;
            }
        }
    }
}

function loseLife() {
    lives--; updateHUD();
    if (lives <= 0) {
        endGame('💀 GAME OVER', 'Score: ' + score);
    } else {
        pac    = makePac();
        ghosts = makeGhosts();
    }
}

function checkWin() {
    if (dots.every(d => d.eaten) && powers.every(p => p.eaten))
        endGame('🎉 YOU WIN!', 'Final Score: ' + score);
}

// ── OVERLAY ──────────────────────────────────────────────────────────────────
function showOverlay(title, sub, hint) {
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-sub').textContent   = sub || '';
    document.getElementById('overlay-hint').textContent  = hint || '';
    document.getElementById('overlay').classList.remove('hidden');
}
function hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
}

// ── GAME LOOP ─────────────────────────────────────────────────────────────────
function loop() {
    if (!running || paused) return;
    raf = requestAnimationFrame(loop);
    frameN++;
    drawScene();
    movePac();
    ghosts.forEach(g => { if (!g.dead) moveGhost(g); });
    collectDots();
    checkGhostCollision();
    checkWin();
}

// ── BUTTON HANDLERS ─────────────────────────────────────────────────────────
function startGame() {
    if (running) return;
    running = true;
    paused = false;
    hideOverlay();
    loop();
}

function pauseGame() {
    if (!running || paused) return;
    paused = true;
    showOverlay('⏸ PAUSED', 'Press ▶ Play to Resume');
}

function resetGame() {
    running = false;
    paused = false;
    cancelAnimationFrame(raf);
    init();
    showOverlay('PAC-MAN', 'Press ▶ Play to Start');
}

// ── KEYBOARD CONTROLS ───────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            pac.wantVx = 0; pac.wantVy = -SPEED;
            break;
        case 'ArrowDown':
        case 's':
            pac.wantVx = 0; pac.wantVy = SPEED;
            break;
        case 'ArrowLeft':
        case 'a':
            pac.wantVx = -SPEED; pac.wantVy = 0;
            break;
        case 'ArrowRight':
        case 'd':
            pac.wantVx = SPEED; pac.wantVy = 0;
            break;
    }
});

// ── MOBILE D-PAD CONTROLS ───────────────────────────────────────────────────
document.getElementById('btn-up').addEventListener('click', () => {
    pac.wantVx = 0; pac.wantVy = -SPEED;
});
document.getElementById('btn-down').addEventListener('click', () => {
    pac.wantVx = 0; pac.wantVy = SPEED;
});
document.getElementById('btn-left').addEventListener('click', () => {
    pac.wantVx = -SPEED; pac.wantVy = 0;
});
document.getElementById('btn-right').addEventListener('click', () => {
    pac.wantVx = SPEED; pac.wantVy = 0;
});

// ── EVENT LISTENERS ─────────────────────────────────────────────────────────
document.getElementById('play-btn').addEventListener('click', startGame);
document.getElementById('pause-btn').addEventListener('click', pauseGame);
document.getElementById('reset-btn').addEventListener('click', resetGame);

// ── INITIALIZE ──────────────────────────────────────────────────────────────
init();
showOverlay('PAC-MAN', 'Press ▶ Play to Start');
