/*
 * Venom edges (phone only): while a finger is down, a couple of hairline amber strokes, the same width
 * as the site's 1px frame border, crackle like venom lightning and grow from the screen edge on the thumb's side and reach the thumb,
 * tracking it live. They vanish the same frame the finger lifts. Canvas 2D overlay with
 * pointer-events: none; it draws only while a finger is down, so idle does no work.
 */
const GROW = 90;         // ms to reach the thumb (starts near-full)
const START = 0.85;      // strands begin at 85% length on touchdown
const TAP = 150;         // touches shorter than this count as a quick tap
const LINGER = 120;      // quick taps keep the flash this long after lift
const STROKE = 1;        // css px: matches the site border (1px solid)

export function isPhone() {
  return matchMedia('(pointer: coarse) and (hover: none)').matches && Math.min(innerWidth, screen.width || innerWidth) <= 820;
}
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export function mountEdges(opts = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (!isPhone()) return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: innerWidth + 'px', height: innerHeight + 'px',
    pointerEvents: 'none', zIndex: '60', display: 'block' });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const color = opts.color || '#ffb867';

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, opts.maxDpr || 3);
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
  };
  resize(); addEventListener('resize', resize);
  const vv = window.visualViewport; vv && vv.addEventListener('resize', resize);
  let lingerT = 0;

  let touch = null;   // { id, x, y, t0, side, offs, bends }
  let raf = 0;
  const clear = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); };

  // venom lightning: jagged strands re-rolled every few frames (crackle), riding a slow gooey sway
  // (secondary motion), with short forks that flicker in and out. Drawn at ~50% opacity with a soft glow.
  const CRACKLE = 55;     // ms between re-routes
  let seed = 1, lastRoll = -1e9;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function bolt(ax, ay, ex, ey, rough, depth, out) {
    // midpoint displacement: jagged but continuous
    if (depth === 0) { out.push([ex, ey]); return; }
    const mx = (ax + ex) / 2, my = (ay + ey) / 2, len = Math.hypot(ex - ax, ey - ay) || 1;
    const off = (rnd() - 0.5) * rough * len;
    const nx = -(ey - ay) / len, ny = (ex - ax) / len;
    bolt(ax, ay, mx + nx * off, my + ny * off, rough * 0.62, depth - 1, out);
    bolt(mx + nx * off, my + ny * off, ex, ey, rough * 0.62, depth - 1, out);
  }
  function path(pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); }

  function frame(now) {
    raf = 0;
    if (!touch) return clear();
    const W = innerWidth, k = START + (1 - START) * ease(Math.min(1, (now - touch.t0) / GROW));
    if (now - lastRoll > CRACKLE) { lastRoll = now; touch.roll = (Math.random() * 1e9) | 0; }
    clear(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 6;
    const ax = touch.side < 0 ? 0 : W;
    touch.offs.forEach((off, si) => {
      seed = (touch.roll + si * 7919) % 2147483646 + 1;
      const sway = Math.sin(now * 0.004 + si * 2.1) * 10;          // slow goo sway under the crackle
      const ay = touch.y + off + sway * 0.4;
      const ex = ax + (touch.x - ax) * k, ey = ay + (touch.y - ay) * k;
      const dx = ex - ax, dy = ey - ay, len = Math.hypot(dx, dy) || 1;
      // one bend control point, so the strand arcs like the button's tendrils
      const bend = touch.bends[si] + sway;
      const cx = (ax + ex) / 2 - (dy / len) * bend, cy = (ay + ey) / 2 + (dx / len) * bend;
      const pts = [[ax, ay]];
      // sample the arc into 4 legs, each one jagged
      let px = ax, py = ay;
      for (let q = 1; q <= 4; q++) {
        const t = q / 4, u = 1 - t;
        const qx = u * u * ax + 2 * u * t * cx + t * t * ex, qy = u * u * ay + 2 * u * t * cy + t * t * ey;
        bolt(px, py, qx, qy, 0.5, 3, pts); px = qx; py = qy;
      }
      ctx.lineWidth = STROKE; path(pts);
      // forks: short, thinner, flicker (not every roll)
      ctx.lineWidth = STROKE * 0.75;
      for (let f = 0; f < 3; f++) {
        if (rnd() < 0.45) continue;
        const at = pts[2 + ((rnd() * (pts.length - 4)) | 0)];
        const ang = Math.atan2(dy, dx) + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.7);
        const fl = (10 + rnd() * 26) * k;
        const fp = [[at[0], at[1]]];
        bolt(at[0], at[1], at[0] + Math.cos(ang) * fl, at[1] + Math.sin(ang) * fl, 0.6, 2, fp);
        path(fp);
      }
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    raf = requestAnimationFrame(frame);   // keeps crackling while the finger is down; stops on lift
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const SKIP = '.venom-slot, .venom-fallback, input, textarea, select, [contenteditable]';
  const stop = () => { clearTimeout(lingerT); touch = null; cancelAnimationFrame(raf); raf = 0; clear(); };
  const start = (id, x, y, target) => {
    if (target instanceof Element && target.closest(SKIP)) return;
    clearTimeout(lingerT);   // a new touch always takes over (also mid-linger / multi-touch)
    const now = performance.now();
    touch = { id, x, y, t0: now, down: now, side: x < innerWidth / 2 ? -1 : 1, offs: [-26, 22], bends: [14, -10] };
    lastRoll = -1e9; kick();
  };
  // follow the finger anywhere; swap to the nearer edge once it clearly crosses the middle
  const track = (x, y) => {
    touch.x = x; touch.y = y;
    const W = innerWidth;
    if (touch.side < 0 && x > W * 0.6) { touch.side = 1; touch.t0 = performance.now(); }
    else if (touch.side > 0 && x < W * 0.4) { touch.side = -1; touch.t0 = performance.now(); }
    kick();
  };
  // lift: held touches vanish the same frame; quick taps keep a short flash so they're visible
  const end = () => {
    if (!touch || touch.ending) return;
    if (performance.now() - touch.down < TAP) { touch.ending = true; lingerT = setTimeout(stop, LINGER); }
    else stop();
  };
  // Touch events are the source of truth on phones: they keep firing through scrolls (pointer events
  // get pointercancel'd the moment the page starts scrolling).
  const find = (list) => { if (!touch) return null; for (const t of list) if (t.identifier === touch.id) return t; return null; };
  const onTS = (e) => { const t = e.changedTouches[e.changedTouches.length - 1]; if (t) start(t.identifier, t.clientX, t.clientY, e.target); };
  const onTM = (e) => { const t = find(e.changedTouches); if (t && !touch.ending) track(t.clientX, t.clientY); };
  const onTE = (e) => { if (find(e.changedTouches)) end(); };
  // pen / browsers without touch events: pointer fallback
  const hasTouch = 'ontouchstart' in window;
  const onPD = (e) => { if (hasTouch || e.pointerType === 'mouse') return; start('p' + e.pointerId, e.clientX, e.clientY, e.target); };
  const onPM = (e) => { if (!hasTouch && touch && touch.id === 'p' + e.pointerId && !touch.ending) track(e.clientX, e.clientY); };
  const onPU = (e) => { if (!hasTouch && touch && touch.id === 'p' + e.pointerId) end(); };
  const L = { passive: true, capture: true };
  const evs = [['touchstart', onTS], ['touchmove', onTM], ['touchend', onTE], ['touchcancel', onTE],
    ['pointerdown', onPD], ['pointermove', onPM], ['pointerup', onPU], ['pointercancel', onPU]];
  for (const [n, f] of evs) addEventListener(n, f, L);

  return {
    destroy() {
      stop(); removeEventListener('resize', resize); vv && vv.removeEventListener('resize', resize);
      for (const [n, f] of evs) removeEventListener(n, f, true);
      canvas.remove();
    },
  };
}
