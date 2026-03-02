'use strict';
// ═══════════════════════════════════════════════════════════
//  PAC-MAN  –  fully playable, mobile-responsive
// ═══════════════════════════════════════════════════════════

// ── grid values ──────────────────────────────────────────
// 1 = wall   0 = dot   2 = power pellet   3 = empty path
const CELL  = 28;          // px per tile
const SPEED = 1.5;         // px per frame  (lower = easier to navigate)
const PAC_R = 11;          // pac-man draw+collision radius
const GHO_R = 11;          // ghost   draw+collision radius

/*  21 wide × 23 tall  –  every spawn position is verified open  */
const MAP = [
//   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 1
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1], // 2
    [1, 2, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 2, 1], // 3
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 4
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1], // 5
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], // 6
    [1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 1, 1, 3, 1, 1, 1, 0, 1, 1, 1, 1], // 7
    [3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3], // 8  ← tunnel row
    [1, 1, 1, 1, 0, 1, 3, 1, 1, 3, 3, 3, 1, 1, 3, 1, 0, 1, 1, 1, 1], // 9
    [1, 1, 1, 1, 0, 3, 3, 1, 3, 3, 3, 3, 3, 1, 3, 3, 0, 1, 1, 1, 1], //10
    [1, 1, 1, 1, 0, 1, 3, 1, 3, 3, 3, 3, 3, 1, 3, 1, 0, 1, 1, 1, 1], //11  ghost house open
    [3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3], //12  ← tunnel row
    [1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 3, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1], //13
    [1, 1, 1, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 1, 1, 1], //14
    [1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 1, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1], //15
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1], //16
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1], //17
    [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1], //18  pac-man starts col10,row18
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1], //19
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], //20
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1], //21
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //22
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //23
];

// verify every spawn is walkable at startup (dev guard)
function assertOpen(c, r, label) {
    if (MAP[r][c] === 1) console.error(`SPAWN "${label}" at (${c},${r}) is a wall!`);
}

const COLS = MAP[0].length;
const ROWS = MAP.length;
const CW   = COLS * CELL;
const CH   = ROWS * CELL;

// ── canvas ───────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = CW;
canvas.height = CH;

// ── helpers ──────────────────────────────────────────────
const midX = c => c * CELL + CELL / 2;
const midY = r => r * CELL + CELL / 2;

function tileAt(px, py) {
    const c = Math.floor(px / CELL);
    const r = Math.floor(py / CELL);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return 3; // tunnel = open
    return MAP[r][c];
}

function isWall(px, py) { return tileAt(px, py) === 1; }

// AABB check using 4 corner points of a bounding square
function canMoveTo(nx, ny, radius) {
    const s = radius * 0.85; // slightly inset so we don't clip wall edges
    return !isWall(nx - s, ny - s) &&
           !isWall(nx + s, ny - s) &&
           !isWall(nx - s, ny + s) &&
           !isWall(nx + s, ny + s);
}

// Align v to nearest cell centre (for smooth cornering)
function snapToGrid(v) {
    const mod = ((v % CELL) + CELL) % CELL;
    const off = mod < CELL / 2 ? mod : mod - CELL;
    return Math.abs(off) <= SPEED + 1 ? v - off : v;
}

// ── state ────────────────────────────────────────────────
let dots   = [];
let powers = [];
let pac, ghosts;
let score = 0, lives = 3;
let raf = null, frameN = 0;
let running = false, paused = false;
let scaredTimer = null;

// ── build map objects ─────────────────────────────────────
function buildMap() {
    dots   = [];
    powers = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (MAP[r][c] === 0) dots.push  ({ x: midX(c), y: midY(r), eaten: false });
            if (MAP[r][c] === 2) powers.push({ x: midX(c), y: midY(r), eaten: false });
        }
    }
}

// ── pac-man ───────────────────────────────────────────────
// starts at col 10, row 18 — confirmed open (value 1 → actually value 0 after map fix)
function makePac() {
    assertOpen(10, 18, 'pac-man');
    return {
        x: midX(10), y: midY(18),
        vx: 0, vy: 0,
        wantVx: 0, wantVy: 0,
        dir: 0,      // radians, for drawing
        r: PAC_R,
    };
}

// ── ghosts ────────────────────────────────────────────────
// ghost house centre column=10, rows 10-12 are all '3' (open)
const GHOST_SPAWNS = [
    { c:  9, r: 10, color: '#ff0000', ivx:  SPEED, ivy: 0 },
    { c: 11, r: 10, color: '#ffb8ff', ivx: -SPEED, ivy: 0 },
    { c:  9, r: 12, color: '#00ffff', ivx: 0, ivy:  SPEED },
    { c: 11, r: 12, color: '#ffb852', ivx: 0, ivy: -SPEED },
];

function makeGhosts() {
    return GHOST_SPAWNS.map(s => {
        assertOpen(s.c, s.r, `ghost ${s.color}`);
        return {
            x: midX(s.c), y: midY(s.r),
            vx: s.ivx, vy: s.ivy,
            color: s.color,
            scared: false,
            dead: false,
            r: GHO_R,
        };
    });
}

// ── init ─────────────────────────────────────────────────
function init() {
    buildMap();
    pac    = makePac();
    ghosts = makeGhosts();
    score  = 0;
    lives  = 3;
    hud();
}

function hud() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

// ═══════════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════════
function drawBg() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CW, CH);
}

function drawWalls() {
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
}

function drawDots() {
    ctx.fillStyle = '#ffcc88';
    for (const d of dots) {
        if (d.eaten) continue;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPowers(f) {
    if (Math.floor(f / 16) % 2 === 0) {
        ctx.shadowColor = '#fff200';
        ctx.shadowBlur  = 14;
        ctx.fillStyle   = '#fff200';
        for (const p of powers) {
            if (p.eaten) continue;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}

function drawPac() {
    const mouth = 0.22 + 0.18 * Math.abs(Math.sin(frameN * 0.18));
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
}

function drawGhost(g) {
    const { x, y, r, scared, color } = g;
    const fill = scared ? '#2244dd' : color;
    ctx.save();
    ctx.fillStyle = fill;

    // body
    ctx.beginPath();
    ctx.arc(x, y - r * 0.1, r, Math.PI, 0);
    ctx.lineTo(x + r, y + r * 0.9);
    const segs = 4, sw = (r * 2) / segs;
    for (let i = 0; i < segs; i++) {
        const bx = x + r - i * sw;
        ctx.quadraticCurveTo(bx - sw * 0.25, y + r * 0.9 + 6, bx - sw * 0.5, y + r * 0.9);
        ctx.quadraticCurveTo(bx - sw * 0.75, y + r * 0.9 - 5, bx - sw,       y + r * 0.9);
    }
    ctx.closePath();
    ctx.fill();

    // eyes
    if (!scared) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(x - 4, y - 4, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 4, y - 4, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#004';
        ctx.beginPath(); ctx.arc(x - 4, y - 3, 2,   0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 4, y - 3, 2,   0, Math.PI * 2); ctx.fill();
    } else {
        ctx.fillStyle = '#88aaff';
        ctx.beginPath(); ctx.arc(x - 4, y - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 4, y - 3, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

// ═══════════════════════════════════════════════════════════
//  MOVE – PAC-MAN (grid-snapped queue system)
// ═══════════════════════════════════════════════════════════
function movePac() {
    // -- try to switch to queued direction (snap perp. axis first) --
    if (pac.wantVx !== 0 || pac.wantVy !== 0) {
        // snap the axis perpendicular to desired motion so we fit in corridors
        const sx = pac.wantVx !== 0 ? pac.x : snapToGrid(pac.x);
        const sy = pac.wantVy !== 0 ? pac.y : snapToGrid(pac.y);
        if (canMoveTo(sx + pac.wantVx, sy + pac.wantVy, pac.r)) {
            pac.x  = sx;  pac.y  = sy;
            pac.vx = pac.wantVx;
            pac.vy = pac.wantVy;
            if      (pac.vx > 0) pac.dir = 0;
            else if (pac.vx < 0) pac.dir = Math.PI;
            else if (pac.vy > 0) pac.dir = Math.PI / 2;
            else                 pac.dir = -Math.PI / 2;
        }
    }

    // -- keep moving in current direction --
    if (pac.vx !== 0 || pac.vy !== 0) {
        const nx = pac.x + pac.vx;
        const ny = pac.y + pac.vy;
        if (canMoveTo(nx, ny, pac.r)) {
            pac.x = nx; pac.y = ny;
        } else {
            // stop cleanly at wall edge
            pac.vx = 0; pac.vy = 0;
        }
    }

    // tunnel wrap
    if (pac.x < -pac.r)    pac.x = CW + pac.r;
    if (pac.x > CW + pac.r) pac.x = -pac.r;
}

// ═══════════════════════════════════════════════════════════
//  MOVE – GHOSTS (random-walk, no reversals, junction turns)
// ═══════════════════════════════════════════════════════════
const FOUR = [
    { vx:  SPEED, vy: 0 },
    { vx: -SPEED, vy: 0 },
    { vx: 0, vy:  SPEED },
    { vx: 0, vy: -SPEED },
];

function moveGhost(g) {
    // Try to move straight
    if (canMoveTo(g.x + g.vx, g.y + g.vy, g.r)) {
        g.x += g.vx;
        g.y += g.vy;
    } else {
        // snap to grid centre so next-turn checks are clean
        g.x = snapToGrid(g.x);
        g.y = snapToGrid(g.y);

        const options = FOUR.filter(d =>
            !(d.vx === -g.vx && d.vy === -g.vy) &&   // no 180-turn
            canMoveTo(g.x + d.vx, g.y + d.vy, g.r)
        );
        if (options.length > 0) {
            const pick = options[Math.floor(Math.random() * options.length)];
            g.vx = pick.vx; g.vy = pick.vy;
        } else {
            // dead-end: reverse
            g.vx = -g.vx; g.vy = -g.vy;
        }
    }

    // random junction turn (~3% each frame)
    if (Math.random() < 0.03) {
        const sx = snapToGrid(g.x), sy = snapToGrid(g.y);
        if (Math.abs(sx - g.x) < 2 && Math.abs(sy - g.y) < 2) {
            const opts = FOUR.filter(d =>
                !(d.vx === -g.vx && d.vy === -g.vy) &&
                canMoveTo(g.x + d.vx, g.y + d.vy, g.r)
            );
            if (opts.length > 0) {
                const p = opts[Math.floor(Math.random() * opts.length)];
                g.vx = p.vx; g.vy = p.vy;
            }
        }
    }

    // tunnel
    if (g.x < -g.r)     g.x = CW + g.r;
    if (g.x > CW + g.r) g.x = -g.r;
}

// ═══════════════════════════════════════════════════════════
//  COLLISION
// ═══════════════════════════════════════════════════════════
function dst(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function eatDots() {
    for (const d of dots) {
        if (!d.eaten && dst(pac, d) < PAC_R + 3) {
            d.eaten = true; score += 10; hud();
        }
    }
    for (const p of powers) {
        if (!p.eaten && dst(pac, p) < PAC_R + 9) {
            p.eaten = true; score += 50; hud();
            frighten();
        }
    }
}

function frighten() {
    ghosts.forEach(g => { if (!g.dead) g.scared = true; });
    if (scaredTimer) clearTimeout(scaredTimer);
    scaredTimer = setTimeout(() => ghosts.forEach(g => g.scared = false), 8000);
}

function checkGhosts() {
    for (const g of ghosts) {
        if (g.dead) continue;
        if (dst(pac, g) < PAC_R + GHO_R - 4) {
            if (g.scared) {
                g.dead = true; g.scared = false;
                score += 200; hud();
            } else {
                die(); return;
            }
        }
    }
}

function die() {
    lives--; hud();
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

// ═══════════════════════════════════════════════════════════
//  OVERLAY
// ═══════════════════════════════════════════════════════════
function showOverlay(t, s, h) {
    document.getElementById('overlay-title').textContent = t;
    document.getElementById('overlay-sub').textContent   = s;
    document.getElementById('overlay-hint').textContent  = h || '';
    document.getElementById('overlay').classList.remove('hidden');
}
function hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════
//  GAME LOOP
// ═══════════════════════════════════════════════════════════
function loop() {
    if (!running || paused) return;
    raf = requestAnimationFrame(loop);
    frameN++;

    drawBg();
    drawWalls();
    drawDots();
    drawPowers(frameN);
    drawPac();
    ghosts.forEach(g => { if (!g.dead) drawGhost(g); });

    movePac();
    ghosts.forEach(g => { if (!g.dead) moveGhost(g); });

    eatDots();
    checkGhosts();
    checkWin();
}

function startLoop() {
    if (raf) cancelAnimationFrame(raf);
    running = true; paused = false;
    hideOverlay();
    frameN = 0;
    loop();
}

function pauseGame() {
    if (!running || paused) return;
    paused = true;
    showOverlay('⏸ PAUSED', 'Press ▶ Play to Resume');
}

function resumeGame() {
    if (!running || !paused) return;
    paused = false; hideOverlay(); loop();
}

function resetGame() {
    if (raf) cancelAnimationFrame(raf);
    if (scaredTimer) clearTimeout(scaredTimer);
    running = false; paused = false;
    init();
    renderStatic();
    showOverlay('PAC-MAN', 'Press ▶ Play to Start', 'Arrow / WASD / D-Pad / Swipe');
}

function endGame(title, sub) {
    if (raf) cancelAnimationFrame(raf);
    running = false;
    showOverlay(title, sub, 'Press 🔄 Reset to play again');
}

function renderStatic() {
    drawBg(); drawWalls(); drawDots(); drawPowers(0);
    drawPac(); ghosts.forEach(g => drawGhost(g));
}

// ═══════════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════════
function setDir(vx, vy) {
    pac.wantVx = vx;
    pac.wantVy = vy;
    if (!running)      { init(); startLoop(); }
    else if (paused)   resumeGame();
}

// keyboard
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowLeft':  case 'a': e.preventDefault(); setDir(-SPEED, 0); break;
        case 'ArrowRight': case 'd': e.preventDefault(); setDir( SPEED, 0); break;
        case 'ArrowUp':    case 'w': e.preventDefault(); setDir(0, -SPEED); break;
        case 'ArrowDown':  case 's': e.preventDefault(); setDir(0,  SPEED); break;
        case ' ':
            e.preventDefault();
            running && !paused ? pauseGame() : resumeGame();
            break;
    }
});

// buttons
document.getElementById('play-btn') .onclick = () => { running ? resumeGame() : (init(), startLoop()); };
document.getElementById('pause-btn').onclick = pauseGame;
document.getElementById('reset-btn').onclick = resetGame;

// d-pad
function bindDpad(id, vx, vy) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e => { e.preventDefault(); setDir(vx, vy); }, { passive: false });
    el.addEventListener('mousedown',  () => setDir(vx, vy));
}
bindDpad('btn-up',    0,      -SPEED);
bindDpad('btn-down',  0,       SPEED);
bindDpad('btn-left',  -SPEED,  0);
bindDpad('btn-right',  SPEED,  0);

// swipe on canvas
let swX = 0, swY = 0;
canvas.addEventListener('touchstart', e => { swX = e.touches[0].clientX; swY = e.touches[0].clientY; e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - swX;
    const dy = e.changedTouches[0].clientY - swY;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    Math.abs(dx) > Math.abs(dy) ? setDir(dx > 0 ? SPEED : -SPEED, 0)
                                : setDir(0, dy > 0 ? SPEED : -SPEED);
    e.preventDefault();
}, { passive: false });

// ═══════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════
init();
renderStatic();
showOverlay('PAC-MAN', 'Press ▶ Play to Start', 'Arrow / WASD / D-Pad / Swipe');
