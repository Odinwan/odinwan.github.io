import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * The candle-lit table as a 3D scene drawn like a storybook illustration: flat
 * banded shading, ink outlines and painted textures, lit by the candle and the
 * moon. Units are metres; the table top is y = 0 and you sit at +z.
 */

export interface Stage {
  /** Paints the front cover from a canvas (title, emblem). Call again after redrawing it. */
  setCover(art: HTMLCanvasElement): void;
  /** Paints what you see when the cover swings open: the first page and the endpaper. */
  setPages(firstPage: HTMLCanvasElement, endpaper: HTMLCanvasElement): void;
  /** The picture in the frame on the wall. */
  setPortrait(art: HTMLCanvasElement): void;
  /** The opening shot: the camera glides in from the back of the room to your seat at the table. */
  intro(): Promise<void>;
  open(): Promise<void>;
  close(): Promise<void>;
  /** Stops rendering while the book is being read. */
  setPaused(paused: boolean): void;
  /** Something turns up: the post owl, a letter on the wind, or a knock — the named one, or any. Ignored while one is under way. */
  visitor(kind?: 'owl' | 'mail' | 'knock'): void;
  /** The word on the little sign that hops along above the bug ("Catch it!"), in the visitor's language. */
  setBugHint(text: string): void;
  dispose(): void;
}

export interface StageOptions {
  onBookClick(): void;
  /** The pointer moved onto a prop (or the book, id "book"), or off everything (null). */
  onHover?(id: string | null, x: number, y: number): void;
  /** A prop was clicked; x/y are where its top is on screen, in CSS pixels of the canvas. */
  onPoke?(id: string, x: number, y: number): void;
  /** Something happened in the room by itself: a letter blew in, it landed, someone knocked. */
  onEvent?(kind: 'mail' | 'mail-owl' | 'owl-bump' | 'mail-land' | 'knock' | 'lights-on' | 'bug-jar'): void;
  reducedMotion: boolean;
}

const BOOK = { w: 0.21, d: 0.29, cover: 0.006, pages: 0.05 };
const CANDLE = new THREE.Vector3(0.25, 0, -0.27);
const OPEN_ANGLE = 2.96;

/* ---------- procedural textures ---------- */

const makeCanvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
};

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const woodCanvas = (): HTMLCanvasElement => {
  // Painted, not photographed: flat boards with a few confident brush strokes of grain.
  const S = 1024;
  const [c, g] = makeCanvas(S, S);
  const r = seeded(11);
  const planks = 5;
  const pw = S / planks;
  g.lineCap = 'round';
  for (let p = 0; p < planks; p++) {
    const x0 = p * pw;
    const hue = 22 + r() * 8;
    const light = 30 + r() * 9;
    g.fillStyle = `hsl(${hue}, 52%, ${light}%)`;
    g.fillRect(x0, 0, pw, S);

    // Broad washes of lighter and darker paint.
    for (let i = 0; i < 9; i++) {
      g.fillStyle = r() > 0.5 ? `hsla(${hue + 6}, 60%, ${light + 9}%, 0.28)` : `hsla(${hue - 4}, 50%, ${light - 9}%, 0.28)`;
      const w = 18 + r() * 46;
      g.fillRect(x0 + r() * (pw - w), 0, w, S);
    }

    // Grain: long hand-drawn strokes that wobble and break off.
    const freq = 0.003 + r() * 0.004;
    for (let i = 0; i < 16; i++) {
      const gx = x0 + 10 + r() * (pw - 20);
      const phase = r() * 6.28;
      const amp = 2 + r() * 5;
      g.strokeStyle = `hsla(${hue - 6}, 55%, ${light - 14 - r() * 6}%, ${0.45 + r() * 0.35})`;
      g.lineWidth = 2 + r() * 3.5;
      let y = r() * 200 - 100;
      while (y < S) {
        const len = 160 + r() * 420;
        g.beginPath();
        for (let k = 0; k <= len; k += 20) {
          const yy = y + k;
          const xx = gx + Math.sin(yy * freq + phase) * amp;
          if (k === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
        }
        g.stroke();
        y += len + 30 + r() * 120;
      }
    }

    // A knot or two, drawn as a few rings.
    if (r() > 0.4) {
      const kx = x0 + pw * (0.3 + r() * 0.4);
      const ky = 80 + r() * (S - 160);
      g.strokeStyle = `hsla(${hue - 6}, 55%, ${light - 16}%, 0.8)`;
      for (let k = 1; k <= 3; k++) {
        g.lineWidth = 3.5 - k * 0.6;
        g.beginPath();
        g.ellipse(kx, ky, k * 7, k * 13, 0, 0, Math.PI * 2);
        g.stroke();
      }
    }

    // Inked gap between the boards.
    g.fillStyle = 'rgba(40, 18, 8, 0.95)';
    g.fillRect(x0 - 1, 0, 5, S);
  }
  return c;
};

const noiseCanvas = (size: number, base: string, alpha: number, seed: number): HTMLCanvasElement => {
  const [c, g] = makeCanvas(size, size);
  const r = seeded(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < size * size * 0.35; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * alpha})` : `rgba(0,0,0,${r() * alpha})`;
    const s = 1 + r() * 2.5;
    g.fillRect(r() * size, r() * size, s, s);
  }
  return c;
};

/** Uneven washes of paint, multiplied over flat colours so nothing looks like plastic. */
const brushCanvas = (): HTMLCanvasElement => {
  const S = 256;
  const [c, g] = makeCanvas(S, S);
  const r = seeded(77);
  g.fillStyle = '#f4f4f4';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const x = r() * S;
    const y = r() * S;
    const rad = 18 + r() * 50;
    const dark = r() > 0.45;
    // Drawn three times so the blobs wrap seamlessly.
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        const grad = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
        grad.addColorStop(0, dark ? 'rgba(120,110,120,0.16)' : 'rgba(255,255,255,0.3)');
        grad.addColorStop(1, 'rgba(128,128,128,0)');
        g.fillStyle = grad;
        g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      }
    }
  }
  g.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    g.strokeStyle = r() > 0.5 ? 'rgba(90,80,90,0.1)' : 'rgba(255,255,255,0.22)';
    g.lineWidth = 2 + r() * 5;
    const x = r() * S;
    const y = r() * S;
    const a = -0.5 + r() * 0.4;
    const len = 20 + r() * 50;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  return c;
};

const beamCanvas = (): HTMLCanvasElement => {
  const [c, g] = makeCanvas(64, 256);
  const down = g.createLinearGradient(0, 0, 0, 256);
  // Fades in below the window head, so the shaft has no hard top edge against the wall.
  down.addColorStop(0, 'rgba(255,255,255,0)');
  down.addColorStop(0.22, 'rgba(255,255,255,0.5)');
  down.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = down;
  g.fillRect(0, 0, 64, 256);
  // Soft edges left and right.
  g.globalCompositeOperation = 'destination-in';
  const across = g.createLinearGradient(0, 0, 64, 0);
  across.addColorStop(0, 'rgba(0,0,0,0)');
  across.addColorStop(0.3, 'rgba(0,0,0,1)');
  across.addColorStop(0.7, 'rgba(0,0,0,1)');
  across.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = across;
  g.fillRect(0, 0, 64, 256);
  return c;
};

/**
 * A snowy post owl seen head-on, wings spread: painted flat, because it lives outside the glass.
 * With the letter in its beak, or after it has let go.
 */
const owlCanvas = (withLetter: boolean): HTMLCanvasElement => {
  const [c, g] = makeCanvas(512, 340);
  const ink = '#2a1810';
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // Wings: rows of feathers, shaded towards the tips.
  for (const sx of [-1, 1]) {
    g.save();
    g.translate(256, 150);
    g.scale(sx, 1);
    const wing = g.createLinearGradient(40, 0, 240, 0);
    wing.addColorStop(0, '#f2f4fa');
    wing.addColorStop(1, '#b9c2d6');
    g.beginPath();
    g.moveTo(44, -14);
    g.bezierCurveTo(110, -96, 200, -92, 244, -40);
    g.quadraticCurveTo(222, -22, 232, 6);
    g.quadraticCurveTo(204, -2, 204, 30);
    g.quadraticCurveTo(176, 16, 170, 50);
    g.quadraticCurveTo(144, 32, 132, 64);
    g.quadraticCurveTo(108, 44, 92, 70);
    g.quadraticCurveTo(70, 52, 44, 60);
    g.closePath();
    g.fillStyle = wing;
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = ink;
    g.stroke();
    g.strokeStyle = '#6a7390';
    g.lineWidth = 4;
    for (const [x1, y1, x2, y2] of [[84, -36, 108, 48], [118, -54, 148, 38], [152, -62, 186, 24], [186, -62, 216, 4], [70, -8, 76, 46]]) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    g.restore();
  }
  // Tail.
  g.fillStyle = '#c9d0e0';
  g.strokeStyle = ink;
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(226, 260);
  g.lineTo(256, 322);
  g.lineTo(286, 260);
  g.closePath();
  g.fill();
  g.stroke();
  // Body.
  const body = g.createRadialGradient(236, 120, 20, 256, 170, 130);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(1, '#cfd6e6');
  g.beginPath();
  g.ellipse(256, 176, 74, 104, 0, 0, Math.PI * 2);
  g.fillStyle = body;
  g.fill();
  g.lineWidth = 8;
  g.stroke();
  // Flecks on the breast.
  g.fillStyle = '#5f6884';
  for (const [x, y] of [[226, 206], [256, 214], [286, 206], [240, 236], [272, 236], [256, 258], [214, 232], [298, 232]]) {
    g.beginPath();
    g.moveTo(x - 7, y - 3);
    g.quadraticCurveTo(x, y + 8, x + 7, y - 3);
    g.quadraticCurveTo(x, y + 1, x - 7, y - 3);
    g.fill();
  }
  // Ear tufts and the facial disc.
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(256 + sx * 30, 92);
    g.lineTo(256 + sx * 62, 62);
    g.lineTo(256 + sx * 58, 104);
    g.closePath();
    g.fillStyle = '#e4e9f3';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = ink;
    g.stroke();
  }
  g.beginPath();
  g.ellipse(256, 124, 62, 50, 0, 0, Math.PI * 2);
  g.fillStyle = '#f7f9fd';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = '#8a93ad';
  g.stroke();
  // Eyes: wide amber, a little crossed — it has just met a window.
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.arc(256 + sx * 28, 118, 23, 0, Math.PI * 2);
    g.fillStyle = '#ffb820';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = ink;
    g.stroke();
    g.beginPath();
    g.arc(256 + sx * 23, 120, 11, 0, Math.PI * 2);
    g.fillStyle = ink;
    g.fill();
    g.beginPath();
    g.arc(256 + sx * 27, 114, 3.6, 0, Math.PI * 2);
    g.fillStyle = '#fff';
    g.fill();
  }
  g.beginPath();
  g.moveTo(244, 140);
  g.lineTo(268, 140);
  g.lineTo(256, 162);
  g.closePath();
  g.fillStyle = '#e99a2a';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = ink;
  g.stroke();
  if (withLetter) {
    g.save();
    g.translate(256, 178);
    g.rotate(-0.14);
    g.fillStyle = '#f6ead0';
    g.lineWidth = 6;
    g.fillRect(-44, -14, 88, 54);
    g.strokeRect(-44, -14, 88, 54);
    g.beginPath();
    g.moveTo(-44, -14);
    g.lineTo(0, 14);
    g.lineTo(44, -14);
    g.stroke();
    g.beginPath();
    g.arc(0, 16, 9, 0, Math.PI * 2);
    g.fillStyle = '#b01c14';
    g.fill();
    g.stroke();
    g.restore();
  }
  return c;
};

/** One long line of green terminal text on a dark screen, made to scroll sideways. */
const tickerCanvas = (text: string): HTMLCanvasElement => {
  const [c, g] = makeCanvas(2048, 256);
  g.fillStyle = '#062010';
  g.fillRect(0, 0, 2048, 256);
  g.fillStyle = '#5dff8a';
  g.font = '800 92px ui-monospace, Menlo, Consolas, monospace';
  g.textBaseline = 'middle';
  // Fit the line to the canvas exactly, so the wrap-round has no jump.
  const scale = 2048 / g.measureText(text).width;
  g.setTransform(scale, 0, 0, 1, 0, 0);
  g.fillText(text, 0, 132);
  g.setTransform(1, 0, 0, 1, 0, 0);
  // Faint scan lines.
  g.fillStyle = 'rgba(0, 0, 0, 0.22)';
  for (let y = 0; y < 256; y += 6) g.fillRect(0, y, 2048, 2);
  return c;
};

const labelCanvas = (text: string, bg: string, fg: string, w = 128, h = 64): HTMLCanvasElement => {
  const [c, g] = makeCanvas(w, h);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = fg;
  g.lineWidth = 4;
  g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = fg;
  g.font = `800 ${Math.round(h * 0.56)}px ui-monospace, Menlo, Consolas, monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  return c;
};

/** A glowing rune with no frame or background, for floating inside the crystal ball. */
const runeCanvas = (text: string): HTMLCanvasElement => {
  const [c, g] = makeCanvas(256, 256);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '800 112px ui-monospace, Menlo, Consolas, monospace';
  g.shadowColor = 'rgba(255, 255, 255, 0.9)';
  g.shadowBlur = 22;
  g.fillStyle = '#ffffff';
  g.fillText(text, 128, 134);
  g.shadowBlur = 0;
  g.lineWidth = 5;
  g.strokeStyle = 'rgba(20, 50, 110, 0.55)';
  g.strokeText(text, 128, 134);
  g.fillText(text, 128, 134);
  return c;
};

/** What the enchanted laptop shows: code, a green run, or a red one. */
const screenCanvas = (mode: 0 | 1 | 2): HTMLCanvasElement => {
  const [c, g] = makeCanvas(512, 320);
  const r = seeded(51 + mode);
  g.fillStyle = mode === 2 ? '#2a0d12' : '#0d1626';
  g.fillRect(0, 0, 512, 320);
  g.font = '700 22px ui-monospace, Menlo, Consolas, monospace';
  g.textBaseline = 'top';
  if (mode === 0) {
    const palette = ['#7fd4ff', '#ffd27a', '#b8ff9a', '#ff9ac0', '#c9b6ff'];
    for (let row = 0; row < 10; row++) {
      let x = 22 + (row > 0 && row < 9 ? 26 : 0) + (row > 2 && row < 7 ? 26 : 0);
      const y = 20 + row * 28;
      const words = 2 + Math.floor(r() * 4);
      for (let k = 0; k < words; k++) {
        const w = 26 + r() * 86;
        g.fillStyle = palette[Math.floor(r() * palette.length)];
        g.fillRect(x, y + 4, w, 14);
        x += w + 12;
      }
    }
  } else {
    g.fillStyle = mode === 1 ? '#8dffa0' : '#ff8a8a';
    g.fillText(mode === 1 ? '$ npm test' : '$ npm run build', 22, 22);
    g.fillStyle = '#c8d4f0';
    for (let row = 0; row < 5; row++) {
      g.fillStyle = mode === 1 ? '#8dffa0' : row === 3 ? '#ff8a8a' : '#c8d4f0';
      g.fillText(mode === 1 ? '✓' : row === 3 ? '✗' : '·', 22, 62 + row * 30);
      g.fillStyle = 'rgba(200, 212, 240, 0.75)';
      g.fillRect(52, 68 + row * 30, 120 + r() * 230, 13);
    }
    g.fillStyle = mode === 1 ? '#8dffa0' : '#ff8a8a';
    g.font = '800 34px ui-monospace, Menlo, Consolas, monospace';
    g.fillText(mode === 1 ? 'ALL GREEN' : 'IT WORKED ON MY MACHINE', 22, 250, 470);
  }
  return c;
};

/** A cork board of sticky notes: To do, Doing, Done. */
/** The sprint board. `caught` adds a red BUG card for every bug the visitor has caught. */
const kanbanCanvas = (caught = 0): HTMLCanvasElement => {
  const [c, g] = makeCanvas(512, 360);
  const r = seeded(61);
  g.fillStyle = '#b98a54';
  g.fillRect(0, 0, 512, 360);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(90, 55, 20, 0.18)' : 'rgba(255, 225, 170, 0.14)';
    g.fillRect(r() * 512, r() * 360, 2 + r() * 3, 2 + r() * 3);
  }
  g.font = '800 24px ui-monospace, Menlo, Consolas, monospace';
  g.textAlign = 'center';
  g.fillStyle = '#3a2412';
  ['TO DO', 'DOING', 'DONE'].forEach((label, i) => g.fillText(label, 88 + i * 168, 36));
  const notes = ['#ffe36a', '#ff9ac0', '#8fe0ff', '#b8ff9a', '#ffc27a'];
  const rows = [3, 2, 4];
  rows.forEach((count, col) => {
    for (let k = 0; k < count; k++) {
      const x = 30 + col * 168 + (r() - 0.5) * 12;
      const y = 54 + k * 72 + (r() - 0.5) * 8;
      g.save();
      g.translate(x + 58, y + 30);
      g.rotate((r() - 0.5) * 0.14);
      g.fillStyle = 'rgba(40, 20, 5, 0.3)';
      g.fillRect(-56, -27, 116, 62);
      g.fillStyle = notes[Math.floor(r() * notes.length)];
      g.fillRect(-58, -30, 116, 62);
      g.fillStyle = 'rgba(40, 30, 20, 0.6)';
      for (let l = 0; l < 3; l++) g.fillRect(-48, -18 + l * 15, 50 + r() * 44, 5);
      if (col === 2) {
        g.strokeStyle = '#1f8a3a';
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(22, 4);
        g.lineTo(34, 16);
        g.lineTo(52, -12);
        g.stroke();
      }
      g.restore();
    }
  });
  // New work: one card per caught bug, in the free slots; past that, a tally on the last one.
  const slots = [[0, 3], [1, 2], [1, 3]];
  for (let n = 0; n < Math.min(caught, slots.length); n++) {
    const [col, k] = slots[n];
    g.save();
    g.translate(30 + col * 168 + 58, 54 + k * 72 + 30);
    g.rotate(n % 2 ? 0.06 : -0.05);
    g.fillStyle = 'rgba(40, 20, 5, 0.3)';
    g.fillRect(-56, -27, 116, 62);
    g.fillStyle = '#ff6a5a';
    g.fillRect(-58, -30, 116, 62);
    g.fillStyle = '#fff';
    g.font = '800 26px ui-monospace, Menlo, Consolas, monospace';
    g.textAlign = 'center';
    const last = n === slots.length - 1 && caught > slots.length;
    g.fillText(last ? `BUG ×${caught - slots.length + 1}` : `BUG #${n + 1}`, 0, 10);
    g.restore();
  }
  return c;
};

/** Light pouring upward: bright at the bottom, gone at the top, even all the way round. */
const pillarCanvas = (): HTMLCanvasElement => {
  const [c, g] = makeCanvas(64, 256);
  const up = g.createLinearGradient(0, 256, 0, 0);
  // Starts from nothing at the very bottom, so the glow has no straight lower edge.
  up.addColorStop(0, 'rgba(255,255,255,0)');
  up.addColorStop(0.14, 'rgba(255,255,255,0.8)');
  up.addColorStop(0.45, 'rgba(255,255,255,0.32)');
  up.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = up;
  g.fillRect(0, 0, 64, 256);
  // Soft sides: it is a glow, not a tube.
  g.globalCompositeOperation = 'destination-in';
  const across = g.createLinearGradient(0, 0, 64, 0);
  across.addColorStop(0, 'rgba(0,0,0,0)');
  across.addColorStop(0.5, 'rgba(0,0,0,1)');
  across.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = across;
  g.fillRect(0, 0, 64, 256);
  return c;
};

const pageEdgeCanvas = (): HTMLCanvasElement => {
  const [c, g] = makeCanvas(64, 256);
  const r = seeded(5);
  g.fillStyle = '#eadcb8';
  g.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 2) {
    g.fillStyle = `rgba(110, 80, 40, ${0.08 + r() * 0.22})`;
    g.fillRect(0, y, 64, 1);
  }
  return c;
};

const skyCanvas = (): HTMLCanvasElement => {
  const [c, g] = makeCanvas(512, 640);
  const r = seeded(3);
  const sky = g.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#070d2c');
  sky.addColorStop(0.6, '#18286a');
  sky.addColorStop(1, '#3a4690');
  g.fillStyle = sky;
  g.fillRect(0, 0, 512, 640);
  for (let i = 0; i < 90; i++) {
    const s = r() * 1.8 + 0.4;
    g.fillStyle = `rgba(255, 248, 220, ${0.3 + r() * 0.7})`;
    g.beginPath();
    g.arc(r() * 512, r() * 520, s, 0, Math.PI * 2);
    g.fill();
  }
  const mx = 340;
  const my = 190;
  const halo = g.createRadialGradient(mx, my, 20, mx, my, 190);
  halo.addColorStop(0, 'rgba(255, 240, 190, 0.55)');
  halo.addColorStop(1, 'rgba(255, 240, 190, 0)');
  g.fillStyle = halo;
  g.fillRect(0, 0, 512, 640);
  const moon = g.createRadialGradient(mx - 14, my - 14, 4, mx, my, 56);
  moon.addColorStop(0, '#fffdf0');
  moon.addColorStop(1, '#f2dc98');
  g.fillStyle = moon;
  g.beginPath();
  g.arc(mx, my, 54, 0, Math.PI * 2);
  g.fill();
  // Soft maria so it reads as a moon rather than a lamp.
  g.fillStyle = 'rgba(190, 160, 90, 0.22)';
  for (const [dx, dy, rad] of [[-16, -8, 13], [14, 12, 9], [8, -22, 7], [-8, 22, 6]]) {
    g.beginPath();
    g.arc(mx + dx, my + dy, rad, 0, Math.PI * 2);
    g.fill();
  }

  // Far hills, and a castle on the nearest one — every tale needs a kingdom.
  g.fillStyle = '#0d1640';
  g.beginPath();
  g.moveTo(0, 640);
  g.lineTo(0, 470);
  g.bezierCurveTo(120, 420, 220, 500, 512, 440);
  g.lineTo(512, 640);
  g.fill();

  const near = '#050819';
  g.fillStyle = near;
  g.beginPath();
  g.moveTo(0, 640);
  g.lineTo(0, 560);
  g.bezierCurveTo(140, 520, 230, 440, 320, 452);
  g.bezierCurveTo(410, 466, 470, 540, 512, 530);
  g.lineTo(512, 640);
  g.fill();

  const tower = (x: number, w: number, h: number) => {
    g.fillRect(x, 458 - h, w, h + 12);
    g.beginPath();
    g.moveTo(x - 5, 458 - h);
    g.lineTo(x + w / 2, 458 - h - w * 1.7);
    g.lineTo(x + w + 5, 458 - h);
    g.fill();
    // Pennant.
    g.fillRect(x + w / 2 - 1, 458 - h - w * 1.7 - 14, 2, 14);
    g.fillRect(x + w / 2, 458 - h - w * 1.7 - 14, 10, 6);
  };
  g.fillRect(258, 404, 96, 60);
  for (let x = 258; x < 352; x += 12) g.fillRect(x, 395, 7, 10);
  tower(246, 22, 92);
  tower(296, 26, 136);
  tower(342, 20, 78);
  g.fillStyle = '#ffd67a';
  for (const [x, y] of [[254, 392], [306, 352], [306, 388], [349, 400], [280, 428], [322, 430]]) g.fillRect(x, y, 5, 8);

  // Pines on the slope.
  g.fillStyle = near;
  for (const [x, y, sz] of [[60, 548, 34], [100, 536, 26], [150, 520, 30], [420, 500, 30], [462, 524, 38], [200, 492, 22]]) {
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(x - sz * (0.5 - k * 0.1), y - k * sz * 0.45);
      g.lineTo(x, y - sz - k * sz * 0.45);
      g.lineTo(x + sz * (0.5 - k * 0.1), y - k * sz * 0.45);
      g.fill();
    }
  }
  return c;
};

const toadstoolCanvas = (): HTMLCanvasElement => {
  const [c, g] = makeCanvas(256, 128);
  const r = seeded(13);
  const red = g.createLinearGradient(0, 0, 0, 128);
  red.addColorStop(0, '#e23a22');
  red.addColorStop(1, '#a81c12');
  g.fillStyle = red;
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#fff6e6';
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    g.ellipse(r() * 256, 8 + r() * 104, 5 + r() * 9, 4 + r() * 6, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  return c;
};

/** A thin enchanted circle: what appears on the table round the thing under the pointer. */
const ringCanvas = (): HTMLCanvasElement => {
  const [c, g] = makeCanvas(256, 256);
  g.translate(128, 128);
  g.strokeStyle = 'rgba(255, 214, 120, 0.95)';
  g.shadowColor = 'rgba(255, 190, 80, 0.9)';
  g.shadowBlur = 10;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, 108, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 1.5;
  g.setLineDash([10, 9]);
  g.beginPath();
  g.arc(0, 0, 94, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = 'rgba(255, 236, 170, 1)';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.beginPath();
    g.arc(Math.cos(a) * 108, Math.sin(a) * 108, i % 2 ? 3 : 5, 0, Math.PI * 2);
    g.fill();
  }
  return c;
};

const glowCanvas = (inner: string, outer: string): HTMLCanvasElement => {
  const [c, g] = makeCanvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
};

const waxGlowCanvas = (): HTMLCanvasElement => {
  const [c, g] = makeCanvas(8, 128);
  // v = 1 is the top of the candle: the flame shines through the upper wax.
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, '#777777');
  grad.addColorStop(0.7, '#111111');
  grad.addColorStop(1, '#000000');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 128);
  return c;
};

const colorTex = (c: HTMLCanvasElement, repeat?: [number, number]): THREE.CanvasTexture => {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
};

const dataTex = (c: HTMLCanvasElement, repeat?: [number, number]): THREE.CanvasTexture => {
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
};

/* ---------- helpers ---------- */

const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const shadow = <T extends THREE.Object3D>(o: T, cast = true, receive = true): T => {
  o.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) {
      m.castShadow = cast;
      m.receiveShadow = receive;
    }
  });
  return o;
};

/** An arch: a rectangle with a half-circle on top, starting at y = 0. */
const archShape = (w: number, rectH: number): THREE.Shape => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, rectH);
  s.absarc(0, rectH, w / 2, 0, Math.PI, false);
  s.lineTo(-w / 2, 0);
  return s;
};

export const createStage = (canvas: HTMLCanvasElement, opts: StageOptions): Stage => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  // Phones, tablets and small machines get a lighter picture: fewer pixels, a smaller candle
  // shadow, and shadows redrawn every other frame. A normal desktop is drawn in full.
  const lowPower = (() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    return window.matchMedia('(pointer: coarse)').matches
      || Math.min(window.screen.width, window.screen.height) < 600
      || (nav.hardwareConcurrency ?? 8) <= 4
      || (nav.deviceMemory ?? 8) <= 4;
  })();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Light falls in a few soft-edged steps, like gouache, instead of a smooth photographic gradient.
  const RAMP = 64;
  const rampData = new Uint8Array(RAMP);
  const band = (x: number, edge: number) => THREE.MathUtils.smoothstep(x, edge - 0.035, edge + 0.035);
  for (let i = 0; i < RAMP; i++) {
    const x = i / (RAMP - 1);
    // The floor is what a surface facing away from a lamp still gets: low, so shade reads as shade.
    rampData[i] = Math.round(255 * (0.27 + 0.25 * band(x, 0.28) + 0.23 * band(x, 0.55) + 0.25 * band(x, 0.82)));
  }
  const ramp = new THREE.DataTexture(rampData, RAMP, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.LinearFilter;
  ramp.needsUpdate = true;

  const brush = colorTex(brushCanvas(), [1, 1]);
  /** For small flat-coloured things, where the brushwork only reads as dirt. */
  const plain = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  plain.needsUpdate = true;

  type PaintParams = THREE.MeshToonMaterialParameters & {
    roughness?: number; metalness?: number; clearcoat?: number; clearcoatRoughness?: number;
    /** Set false for surfaces that should not get an ink outline. */
    outline?: boolean;
    /** Painted highlight, 0–1: glazed, wet or polished things. */
    gloss?: number;
    /** Cool light along the silhouette, 0–1. Off for big flat surfaces. */
    rim?: number;
  };
  /**
   * A painted material: banded light, washes of brushwork over flat colour, a cool
   * rim along the silhouette and, for shiny things, a hard little highlight.
   */
  const toon = ({ roughness, metalness, clearcoat, clearcoatRoughness, outline, gloss, rim, ...rest }: PaintParams): THREE.MeshToonMaterial => {
    const shine = gloss ?? (metalness ? 0.9 : clearcoat ? 0.8 : 0);
    const edge = rim ?? 0.4;
    const m = new THREE.MeshToonMaterial({ ...rest, map: rest.map ?? brush, gradientMap: ramp });
    if (outline === false) m.userData.outlineParameters = { visible: false };
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `
        {
          vec3 pn = normalize(normal);
          vec3 pv = normalize(vViewPosition);
          float rimK = pow(1.0 - clamp(dot(pv, pn), 0.0, 1.0), 2.4);
          outgoingLight += vec3(0.5, 0.6, 1.0) * rimK * ${edge.toFixed(3)} * 0.55;
          float hi = smoothstep(0.9, 0.935, dot(pn, normalize(vec3(-0.38, 0.62, 0.68))));
          float hi2 = smoothstep(0.972, 0.985, dot(pn, normalize(vec3(0.5, 0.45, 0.74))));
          outgoingLight += vec3(1.0, 0.96, 0.86) * (hi + hi2 * 0.6) * ${shine.toFixed(3)} * 0.7;
        }
        #include <opaque_fragment>`,
      );
    };
    m.customProgramCacheKey = () => `paint-${edge}-${shine}`;
    return m;
  };

  /**
   * The house style, which every object on the stage follows — a gouache storybook plate:
   *  - solids are toon(): banded light, a brush wash, a brown ink outline and a cool rim;
   *  - one palette: warm browns for wood, brass for metal, iron/indigo enamel for machines,
   *    parchment for paper, and a few saturated accents (tomato red, leaf green, royal blue);
   *  - all glass is glassMat(): a tinted, outlined shell with a painted highlight;
   *  - only pictures (the sky, labels, screens) and light sources are unlit flat colour.
   */
  const glassMat = (tint: string, opacity = 0.3) =>
    toon({ color: tint, transparent: true, opacity, rim: 1, gloss: 1, side: THREE.DoubleSide, depthWrite: false });

  const ink = new OutlineEffect(renderer, { defaultThickness: 0.0042, defaultColor: [0.13, 0.07, 0.05], defaultAlpha: 1 });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0914');
  scene.fog = new THREE.Fog('#0d0914', 3.2, 8.5);

  // Soft image-based light so glazed and metal surfaces have something to reflect.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0;

  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 20);

  /* ----- room ----- */
  const wood = woodCanvas();
  // A cottage wall of old upright boards.
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4),
    toon({
      map: colorTex(wood, [4.5, 2.2]),
      color: '#6c6a8c',
      roughness: 0.95,
      outline: false,
      rim: 0,
    }),
  );
  wall.position.set(0, 1.2, -1.3);
  wall.receiveShadow = true;
  scene.add(wall);

  const darkWood = toon({ color: '#2a170f', roughness: 0.7 });

  // Side walls and a floor, so the room is closed when the camera pulls back.
  for (const sign of [-1, 1]) {
    const side = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4),
      toon({ map: colorTex(wood, [3.4, 2.2]), color: '#5a5878', outline: false, rim: 0 }),
    );
    side.position.set(sign * 2.05, 1.2, 1.2);
    side.rotation.y = -sign * Math.PI / 2;
    side.receiveShadow = true;
    scene.add(side);
  }
  const floorBoards = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 6),
    toon({ map: colorTex(wood, [3, 4]), color: '#4a3a44', outline: false, rim: 0 }),
  );
  floorBoards.rotation.x = -Math.PI / 2;
  floorBoards.position.set(0, -0.82, 1.2);
  scene.add(floorBoards);
  // Barrels and crates in the corners beside the table.
  const barrelWood = toon({ color: '#7a4a26' });
  const hoop = toon({ color: '#3a3038', gloss: 0.5 });
  for (const [x, z, h] of [[-1.82, -0.55, 0.74], [-1.86, 0.15, 0.6], [1.84, -0.4, 0.74], [1.8, 0.35, 0.56]]) {
    const barrel = new THREE.Group();
    const profile = [[0, 0], [0.2, 0], [0.25, h * 0.5], [0.2, h], [0, h]].map(([px, py]) => new THREE.Vector2(px, py));
    barrel.add(new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(profile.slice(1, 4)).getPoints(10).concat([new THREE.Vector2(0, h)]), 24), barrelWood));
    for (const k of [0.22, 0.78]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.228, 0.012, 8, 28), hoop);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = h * k;
      barrel.add(ring);
    }
    barrel.position.set(x, -0.82, z);
    scene.add(shadow(barrel));
  }
  for (const [x, z, sz, ry] of [[-1.72, 0.75, 0.42, 0.3], [1.74, 0.95, 0.46, -0.25], [1.78, 0.95, 0.3, 0.5]]) {
    const crate = new THREE.Mesh(new RoundedBoxGeometry(sz, sz, sz, 2, 0.012), toon({ color: '#8a5a2c' }));
    crate.position.set(x, -0.82 + sz / 2 + (sz === 0.3 ? 0.46 : 0), z);
    crate.rotation.y = ry;
    scene.add(shadow(crate));
  }

  const windowGroup = new THREE.Group();
  /** The left half of the window is a casement leaf, hinged on its outer edge, that swings into the room. The cat sits on the right half, clear of its sweep. */
  const windowSash = new THREE.Group();
  {
    const w = 0.42;
    const rectH = 0.28;
    const skyGeo = new THREE.ShapeGeometry(archShape(w, rectH), 32);
    const pos = skyGeo.attributes.position;
    const uv = skyGeo.attributes.uv;
    const total = rectH + w / 2;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / total);
    const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: colorTex(skyCanvas()), toneMapped: false, fog: false }));
    sky.position.z = 0.004;
    windowGroup.add(sky);

    const outer = archShape(w + 0.07, rectH + 0.02);
    const hole = new THREE.Path(archShape(w, rectH).getPoints(32).map((p) => new THREE.Vector2(p.x, p.y + 0.03)));
    outer.holes.push(hole);
    const frame = new THREE.Mesh(
      new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 32 }),
      darkWood,
    );
    frame.position.set(0, -0.03, 0);
    windowGroup.add(frame);
    sky.position.y = 0;

    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.016, total, 0.02), darkWood);
    barV.position.set(0, total / 2, 0.02);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(w, 0.016, 0.02), darkWood);
    barH.position.set(0, rectH * 0.78, 0.02);
    const sill = new THREE.Mesh(new RoundedBoxGeometry(w + 0.16, 0.03, 0.17, 2, 0.008), darkWood);
    sill.position.set(0, -0.04, 0.075);
    // The mullion and the right-hand bar are fixed; only the left leaf moves.
    barH.scale.x = 0.5;
    barH.position.x = w / 4;
    windowSash.position.set(-w / 2, 0, 0.02);
    const leafBar = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 0.014, 0.016, 0.018), darkWood);
    leafBar.position.set(w / 4 - 0.007, rectH * 0.78, 0);
    const leafStile = new THREE.Mesh(new THREE.BoxGeometry(0.012, total - 0.014, 0.016), darkWood);
    leafStile.position.set(w / 2 - 0.016, total / 2, 0);
    const pane = new THREE.Shape();
    pane.moveTo(0, 0);
    pane.lineTo(w / 2 - 0.01, 0);
    pane.lineTo(w / 2 - 0.01, total - 0.004);
    pane.absarc(w / 2, rectH, w / 2 - 0.004, Math.PI / 2 + 0.05, Math.PI, false);
    pane.lineTo(0, 0);
    const leafGlass = new THREE.Mesh(
      new THREE.ShapeGeometry(pane, 20),
      new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    );
    leafGlass.material.userData.outlineParameters = { visible: false };
    windowSash.add(leafBar, leafStile, leafGlass);
    windowGroup.add(barV, barH, windowSash, sill);
  }
  windowGroup.position.set(-0.85, 0.36, -1.29);
  scene.add(shadow(windowGroup, false, true));

  const shelf = new THREE.Group();
  {
    const board = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.022, 0.14, 2, 0.005), darkWood);
    shelf.add(board);
    const r = seeded(9);
    const colors = ['#5b2434', '#27463a', '#7a5a22', '#283a66', '#7c2f20', '#4a3a66', '#2f5560'];
    let x = -0.2;
    colors.forEach((color, i) => {
      const bw = 0.022 + r() * 0.02;
      const bh = 0.13 + r() * 0.06;
      const b = new THREE.Mesh(
        new RoundedBoxGeometry(bw, bh, 0.1, 2, 0.004),
        toon({ color, roughness: 0.6 }),
      );
      b.position.set(x + bw / 2, 0.011 + bh / 2, 0);
      if (i === 5) { b.rotation.z = -0.22; b.position.x += 0.012; }
      shelf.add(b);
      x += bw + (i === 4 ? 0.02 : 0.003);
    });
  }
  shelf.position.set(1.02, 0.6, -1.22);
  scene.add(shadow(shelf));

  /* ----- table ----- */
  const tableMat = toon({
    map: colorTex(wood, [2.3, 1.25]),
    roughness: 0.6,
    rim: 0,
    metalness: 0,
  });
  const table = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.06, 1.7, 3, 0.012), tableMat);
  table.position.set(0, -0.03, -0.15);
  table.receiveShadow = true;
  scene.add(table);

  /* ----- the book ----- */
  const leatherMat = toon({ color: '#8a1c2b', gloss: 0.35, rim: 0.6 });
  const paperMat = toon({ color: '#f1e3c2', roughness: 0.9 });
  const edgeMat = toon({ map: colorTex(pageEdgeCanvas(), [1, 1]), roughness: 0.85 });

  const book = new THREE.Group();
  const backCover = new THREE.Mesh(new RoundedBoxGeometry(BOOK.w, BOOK.cover, BOOK.d, 3, 0.0028), leatherMat);
  backCover.position.y = BOOK.cover / 2;

  // Box faces: +x, -x, +y, -y, +z, -z. The page block shows cut edges on three sides.
  const firstPageMat = toon({ color: '#f1e3c2', roughness: 0.9 });
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(BOOK.w - 0.014, BOOK.pages, BOOK.d - 0.016),
    [edgeMat, paperMat, firstPageMat, paperMat, edgeMat, edgeMat],
  );
  pages.position.set(0, BOOK.cover + BOOK.pages / 2, 0);

  const spine = new THREE.Mesh(
    new RoundedBoxGeometry(0.008, BOOK.pages + BOOK.cover * 2, BOOK.d, 3, 0.0036),
    leatherMat,
  );
  spine.position.set(-BOOK.w / 2 + 0.003, BOOK.cover + BOOK.pages / 2, 0);

  // Gold bands on the spine.
  const gold = toon({ color: '#f0c04e', roughness: 0.32, metalness: 1 });
  for (const z of [-0.105, -0.085, 0.085, 0.105]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.0086, BOOK.pages + BOOK.cover * 2 - 0.004, 0.003), gold);
    band.position.set(-BOOK.w / 2 + 0.003, BOOK.cover + BOOK.pages / 2, z);
    book.add(band);
  }

  // The front cover hangs on a hinge along the spine.
  const hinge = new THREE.Group();
  // A hair above the page block: coplanar faces flicker while the cover swings.
  hinge.position.set(-BOOK.w / 2 + 0.004, BOOK.cover + BOOK.pages + 0.0012, 0);
  const coverArt = toon({ color: '#6d1622', roughness: 0.68 });
  const endpaper = toon({ color: '#e7d3a6', roughness: 0.9 });
  const frontCover = new THREE.Mesh(
    new RoundedBoxGeometry(BOOK.w, BOOK.cover, BOOK.d, 3, 0.0028),
    [leatherMat, leatherMat, coverArt, endpaper, leatherMat, leatherMat],
  );
  frontCover.position.set(BOOK.w / 2 - 0.004, BOOK.cover / 2, 0);
  hinge.add(frontCover);

  // Brass corners and a clasp, as an old tome should have.
  const brassTrim = toon({ color: '#f0bf4c', roughness: 0.36, metalness: 1, side: THREE.DoubleSide });
  const coverX = BOOK.w / 2 - 0.004;
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const tri = new THREE.Shape();
    const L = 0.034;
    tri.moveTo(0, 0);
    tri.lineTo(-sx * L, 0);
    tri.lineTo(0, -sy * L);
    tri.lineTo(0, 0);
    const corner = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.0016, bevelEnabled: false }), brassTrim);
    corner.rotation.x = -Math.PI / 2;
    corner.position.set(coverX + sx * (BOOK.w / 2 + 0.0006), BOOK.cover - 0.0004, -sy * (BOOK.d / 2 + 0.0006));
    hinge.add(corner);
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 12, 8), brassTrim);
    stud.position.set(coverX + sx * (BOOK.w / 2 - 0.009), BOOK.cover + 0.0012, -sy * (BOOK.d / 2 - 0.009));
    hinge.add(stud);
  }
  const strap = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.003, 0.026, 2, 0.001), leatherMat);
  strap.position.set(coverX + BOOK.w / 2 - 0.016, BOOK.cover + 0.0012, 0);
  const strapDrop = new THREE.Mesh(new RoundedBoxGeometry(0.003, BOOK.pages * 0.7, 0.026, 2, 0.001), leatherMat);
  strapDrop.position.set(coverX + BOOK.w / 2 + 0.0018, -BOOK.pages * 0.35 + BOOK.cover, 0);
  const buckle = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.004, 0.032, 2, 0.0012), brassTrim);
  buckle.position.set(coverX + BOOK.w / 2 - 0.03, BOOK.cover + 0.002, 0);
  const gem = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 16, 12),
    toon({ color: '#1fa85a', roughness: 0.08, clearcoat: 1, emissive: '#0c5a2c', emissiveIntensity: 0.6 }),
  );
  gem.scale.y = 0.6;
  gem.position.set(coverX + BOOK.w / 2 - 0.03, BOOK.cover + 0.0042, 0);
  hinge.add(strap, strapDrop, buckle, gem);

  // A ribbon bookmark trailing out of the pages.
  const ribbon = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.0012, 0.06),
    toon({ color: '#e0b04a', roughness: 0.5 }),
  );
  ribbon.position.set(0.03, 0.0012, BOOK.d / 2 + 0.022);
  ribbon.rotation.y = 0.2;

  book.add(backCover, pages, spine, hinge, ribbon);
  book.position.set(-0.02, 0, -0.1);
  book.rotation.y = 0.16;
  book.scale.setScalar(1.15);
  scene.add(shadow(book));

  /* ----- candle ----- */
  const candle = new THREE.Group();
  const brass = toon({ color: '#e2ad45', roughness: 0.3, metalness: 1 });
  const dishProfile = [
    [0, 0], [0.05, 0], [0.058, 0.004], [0.06, 0.012], [0.056, 0.013], [0.05, 0.007], [0.026, 0.006],
    [0.025, 0.02], [0.022, 0.022], [0.0205, 0.012], [0, 0.012],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const dish = new THREE.Mesh(new THREE.LatheGeometry(dishProfile, 48), brass);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 12, 28), brass);
  ring.position.set(0.07, 0.014, 0);
  candle.add(dish, ring);

  const WAX_H = 0.135;
  const WAX_R = 0.0195;
  const waxMat = toon({
    gloss: 0.5,
    color: '#f2e2bd',
    roughness: 0.42,
    emissive: '#ff8a2e',
    emissiveMap: dataTex(waxGlowCanvas()),
    emissiveIntensity: 0.45,
  });
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(WAX_R, WAX_R * 1.03, WAX_H, 40, 1), waxMat);
  wax.position.y = 0.012 + WAX_H / 2;
  const poolMat = toon({ color: '#ffe9bf', roughness: 0.2, emissive: '#ff9c3c', emissiveIntensity: 0.5 });
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(WAX_R * 0.8, WAX_R * 0.98, 0.003, 32), poolMat);
  pool.position.y = 0.012 + WAX_H - 0.0005;
  candle.add(wax, pool);
  // Drips down the side.
  const dripR = seeded(17);
  for (let i = 0; i < 5; i++) {
    const a = dripR() * Math.PI * 2;
    const len = 0.012 + dripR() * 0.03;
    const drip = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 12, 10), waxMat);
    drip.scale.set(1, len / 0.0068, 0.7);
    drip.position.set(Math.cos(a) * WAX_R, 0.012 + WAX_H - len / 2 - 0.002, Math.sin(a) * WAX_R);
    candle.add(drip);
  }
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0009, 0.0009, 0.011, 6),
    new THREE.MeshBasicMaterial({ color: '#1a100a' }),
  );
  const flameY = 0.012 + WAX_H;
  wick.position.y = flameY + 0.0055;
  candle.add(wick);

  // The flame: a teardrop coloured from a blue root through white-hot to orange.
  const flamePts: THREE.Vector2[] = [];
  const FLAME_H = 0.036;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    flamePts.push(new THREE.Vector2(0.0072 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (1 - t * 0.25), t * FLAME_H));
  }
  const flameGeo = new THREE.LatheGeometry(flamePts, 24);
  {
    const p = flameGeo.attributes.position;
    const colors = new Float32Array(p.count * 3);
    const cBase = new THREE.Color('#6f8cff');
    const cCore = new THREE.Color('#fff6cf');
    const cTip = new THREE.Color('#ff8a1e');
    const tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / FLAME_H;
      if (t < 0.22) tmp.lerpColors(cBase, cCore, t / 0.22);
      else tmp.lerpColors(cCore, cTip, Math.pow((t - 0.22) / 0.78, 1.4));
      colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    flameGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  const flame = new THREE.Mesh(
    flameGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.96, toneMapped: false, fog: false }),
  );
  flame.position.y = flameY + 0.004;
  candle.add(flame);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255, 214, 140, 0.9)', 'rgba(255, 150, 60, 0.28)')),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    fog: false,
  }));
  halo.scale.setScalar(0.13);
  halo.position.y = flameY + 0.022;
  candle.add(halo);

  candle.position.copy(CANDLE);
  // The flame sits right above the candle, so its own shadow would be a black disc on the table.
  scene.add(shadow(candle, false, true));

  // Gentle falloff: an illustrator's candle lights the whole table, not just a hot spot.
  const candleLight = new THREE.PointLight('#ffb56a', 1, 7, 1);
  candleLight.position.set(CANDLE.x, flameY + 0.03, CANDLE.z);
  candleLight.castShadow = true;
  candleLight.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  candleLight.shadow.camera.near = 0.03;
  candleLight.shadow.camera.far = 6;
  candleLight.shadow.bias = -0.0025;
  candleLight.shadow.normalBias = 0.004;
  candleLight.shadow.radius = 6;
  scene.add(candleLight);
  const LIGHT_BASE = 0.42;
  const lightHome = candleLight.position.clone();

  /* ----- a bottle of something magical ----- */
  const potion = new THREE.Group();
  const bottleProfile = [
    [0, 0], [0.03, 0], [0.038, 0.006], [0.042, 0.03], [0.036, 0.058], [0.016, 0.074], [0.014, 0.1],
    [0.0175, 0.104], [0.0175, 0.108], [0.012, 0.108],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const liquidProfile = [
    [0, 0.004], [0.027, 0.004], [0.034, 0.009], [0.038, 0.03], [0.034, 0.05], [0, 0.05],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const liquidMat = toon({ gloss: 1, color: '#2fbf5a', emissive: '#2bff78', emissiveIntensity: 0.9, roughness: 0.25 });
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(liquidProfile, 40), liquidMat);
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(bottleProfile, 48),
    glassMat('#d9fff0', 0.34),
  );
  const cork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0135, 0.0115, 0.02, 20),
    toon({ color: '#9a6b3c', roughness: 0.9 }),
  );
  cork.position.y = 0.112;
  const twine = new THREE.Mesh(
    new THREE.TorusGeometry(0.0155, 0.0016, 8, 28),
    toon({ color: '#c9a66a', roughness: 1 }),
  );
  twine.rotation.x = Math.PI / 2;
  twine.position.y = 0.09;
  potion.add(liquid, glass, cork, twine);
  potion.position.set(0.38, 0, -0.04);
  shadow(potion);
  glass.castShadow = false;
  liquid.castShadow = false;
  scene.add(potion);

  const potionLight = new THREE.PointLight('#5dff8a', 0.12, 1.2, 1);
  potionLight.position.set(potion.position.x, 0.045, potion.position.z);
  scene.add(potionLight);

  // Sparks drifting up from the bottle.
  const sparkTex = colorTex(glowCanvas('rgba(220, 255, 200, 1)', 'rgba(110, 255, 150, 0.4)'));
  const steam = [0, 1, 2, 3].map((i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sparkTex, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
    }));
    sp.userData.phase = i / 4;
    scene.add(sp);
    return sp;
  });

  /* ----- quill and inkwell ----- */
  const writing = new THREE.Group();
  const pewter = toon({ color: '#5a5a70', roughness: 0.34, metalness: 1 });
  const wellProfile = [
    [0, 0], [0.028, 0], [0.032, 0.006], [0.03, 0.03], [0.018, 0.04], [0.014, 0.05], [0.0175, 0.053],
    [0.0175, 0.057], [0.0115, 0.057], [0.0115, 0.045], [0, 0.045],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  writing.add(new THREE.Mesh(new THREE.LatheGeometry(wellProfile, 40), pewter));
  const quill = new THREE.Group();
  const vaneShape = new THREE.Shape();
  vaneShape.moveTo(0, 0.05);
  vaneShape.bezierCurveTo(0.032, 0.075, 0.03, 0.17, 0.002, 0.225);
  vaneShape.bezierCurveTo(-0.02, 0.17, -0.024, 0.09, 0, 0.05);
  const vane = new THREE.Mesh(
    new THREE.ShapeGeometry(vaneShape, 24),
    toon({ color: '#f4efe2', roughness: 0.85, side: THREE.DoubleSide }),
  );
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0009, 0.0016, 0.225, 8),
    toon({ color: '#e8dcc0', roughness: 0.5 }),
  );
  shaft.position.y = 0.1125;
  quill.add(vane, shaft);
  quill.scale.setScalar(0.72);
  quill.position.y = 0.032;
  quill.rotation.set(0.25, 0.7, -0.5);
  writing.add(quill);
  // Left of where the opened cover comes to rest.
  writing.position.set(-0.52, 0, -0.38);
  scene.add(shadow(writing));

  /* ----- toadstools on a tuft of moss ----- */
  const grove = new THREE.Group();
  const moss = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 28, 16),
    toon({ color: '#2f5c2a', roughness: 1 }),
  );
  moss.scale.set(1, 0.2, 0.75);
  grove.add(moss);
  const capMat = toon({ gloss: 0.7, map: colorTex(toadstoolCanvas()), roughness: 0.45, side: THREE.DoubleSide });
  const stemMat = toon({ color: '#f1e6cf', roughness: 0.8 });
  for (const [x, z, h, rad, tilt] of [[0, 0, 0.085, 0.04, 0.08], [-0.058, 0.02, 0.05, 0.026, -0.2], [0.052, 0.025, 0.06, 0.024, 0.22]]) {
    const m = new THREE.Group();
    const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.26, rad * 0.36, h, 16), stemMat);
    stemMesh.position.y = h / 2;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(rad, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.scale.y = 0.72;
    cap.position.y = h - rad * 0.12;
    const gills = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.98, 28), stemMat);
    gills.rotation.x = Math.PI / 2;
    gills.position.y = h - rad * 0.12;
    m.add(stemMesh, cap, gills);
    m.position.set(x, 0.012, z);
    m.rotation.z = tilt;
    grove.add(m);
  }
  grove.position.set(0.98, 0, -0.74);
  scene.add(shadow(grove));

  /* ----- a stack of books with a tomato on top ----- */
  const stack = new THREE.Group();
  const stackBook = (w: number, h: number, d: number, color: string, y: number, rot: number) => {
    const g = new THREE.Group();
    const cover = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.004), toon({ color, roughness: 0.55 }));
    const block = new THREE.Mesh(new THREE.BoxGeometry(w - 0.008, h - 0.01, d - 0.012), edgeMat);
    block.position.x = 0.006;
    g.add(cover, block);
    g.position.y = y + h / 2;
    g.rotation.y = rot;
    return g;
  };
  stack.add(stackBook(0.2, 0.036, 0.27, '#23463a', 0, 0.1), stackBook(0.17, 0.03, 0.235, '#27325c', 0.036, -0.22));

  // The hero himself, after the character sheet: a stout tomato with a mane of dark hair tied back in a
  // ponytail, a full beard and moustache, heavy brows, a wine-red cape with a gold clasp, and boots.
  // He stands on the books; poke him and he hops.
  const tomato = new THREE.Group();
  const blob = (r: number, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  };
  const skin = toon({ color: '#e5472c', gloss: 0.4, rim: 0.5 });
  const skinShade = toon({ color: '#c2381f', rim: 0.15 });
  const hairMat = toon({ color: '#5a2e18', rim: 0.12, emissive: '#3a1608', emissiveIntensity: 0.7 });
  const hairLight = toon({ color: '#8a5230', rim: 0.1, emissive: '#3a1608', emissiveIntensity: 0.6 });
  const capeMat = toon({ color: '#8a2a3c', rim: 0.5, side: THREE.DoubleSide });
  const capeDark = toon({ color: '#5c1728', rim: 0.2, side: THREE.DoubleSide });
  const bootMat = toon({ color: '#6b3a1c', gloss: 0.3 });
  const soleMat = toon({ color: '#2a1810', rim: 0 });
  const leaf = toon({ color: '#4c9a48', roughness: 0.6, side: THREE.DoubleSide });
  const BY = 0.052; // centre of the body
  /** What he wears by day and takes off under the hood: the hair, the cape, the leaves. */
  const heroDay = new THREE.Group();

  // The body: a real tomato, a little wider than tall, with soft lobes.
  const tomatoBody = new THREE.Mesh(new THREE.SphereGeometry(0.04, 44, 30), skin);
  {
    const pos = tomatoBody.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const lobe = 1 + 0.028 * Math.cos(Math.atan2(z, x) * 5 + 0.6) * (1 - Math.abs(y) / 0.04);
      pos.setXYZ(i, x * lobe * 1.06, y * 0.97, z * lobe);
    }
    tomatoBody.geometry.computeVertexNormals();
  }
  tomatoBody.position.y = BY;
  tomato.add(tomatoBody);

  // Boots with soles, short arms, round hands.
  for (const sx of [-1, 1]) {
    const sole = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0145, 0.0045, 16), soleMat);
    sole.position.set(sx * 0.0175, 0.0022, 0.009);
    sole.scale.z = 1.45;
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.0078, 0.012, 4, 10), skin);
    arm.position.set(sx * 0.0455, 0.041, 0.008);
    arm.rotation.z = sx * 0.95;
    tomato.add(
      blob(0.0138, bootMat, sx * 0.0175, 0.0105, 0.009, 1, 0.78, 1.45), sole,
      arm, blob(0.0108, skin, sx * 0.0535, 0.0335, 0.012),
    );
  }

  // The cape: it hangs from the shoulders in folds, under a rolled collar, pinned with a gold clasp.
  const capeGeo = new THREE.LatheGeometry(
    [[0.039, 0.033], [0.0415, 0.027], [0.0455, 0.019], [0.05, 0.011], [0.054, 0.005]].map(([x, y]) => new THREE.Vector2(x, y)),
    72,
  );
  {
    const pos = capeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const fall = (0.033 - y) / 0.028; // 0 at the collar, 1 at the hem
      const fold = 1 + 0.075 * fall * Math.sin(Math.atan2(z, x) * 9);
      pos.setXYZ(i, x * fold, y, z * fold);
    }
    capeGeo.computeVertexNormals();
  }
  const mantle = new THREE.Mesh(capeGeo, capeMat);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.0388, 0.0048, 10, 36), capeDark);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.0325;
  const clasp = new THREE.Mesh(new THREE.CylinderGeometry(0.0088, 0.0088, 0.004, 20), gold);
  clasp.rotation.x = Math.PI / 2;
  clasp.rotation.x = Math.PI / 2 - 0.35;
  clasp.position.set(0, 0.0275, 0.0445);
  heroDay.add(mantle, collar, clasp, blob(0.0048, gold, 0, 0.0282, 0.0462, 1, 1, 0.5));

  // Hair and beard are each ONE smooth shell wrapped round the body, cut to shape — not a heap of lumps,
  // so the ink line draws a clean hairline and a clean beard instead of a tangle.
  // `keep(az, y)` says where the shell exists (az: 0 = straight ahead, ±π = the back; y from the body's
  // centre); elsewhere it is tucked inside the body. `swell` pushes it out to give it volume.
  const heroShell = (radius: number, mat: THREE.Material, keep: (az: number, y: number) => boolean, swell: (az: number, y: number) => number) => {
    const geo = new THREE.SphereGeometry(radius, 96, 64);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const az = Math.atan2(x, z);
      const k = keep(az, y) ? 1 + swell(az, y) : 0.62;
      pos.setXYZ(i, x * k, y * k, z * k);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.position.y = BY;
    return m;
  };
  const step = THREE.MathUtils.smoothstep;
  // A neat cut: short on top and at the sides, clear of the forehead and the ears, longer only at the
  // back where it is drawn into the ponytail.
  const hairline = (az: number) => {
    const front = Math.max(0, Math.cos(az));       // 1 straight ahead … 0 at the sides and behind
    const back = Math.max(0, -Math.cos(az));       // 1 straight behind
    return 0.018 + 0.017 * Math.pow(front, 0.8) - 0.03 * Math.pow(back, 1.3);
  };
  const hairShell = heroShell(0.0438, hairMat,
    (az, y) => y > hairline(az),
    (az, y) => 0.03                                                   // close-cropped
      + 0.05 * step(y, 0.024, 0.04)                                   // a little height on top
      - 0.04 * Math.exp(-((az / 0.16) ** 2)) * step(y, 0.03, 0.04)    // a centre parting
      + 0.012 * Math.sin(az * 6 + y * 80));                           // combed back
  heroDay.add(hairShell);
  // A lighter sweep either side of the parting.
  for (const sx of [-1, 1]) {
    const shine = blob(0.006, hairLight, sx * 0.019, BY + 0.0445, 0.006, 1.9, 0.3, 1.2);
    shine.rotation.z = -sx * 0.5;
    heroDay.add(shine);
  }
  // Gathered at the nape into a ponytail through a gold ring.
  const hairRing = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0032, 8, 22), gold);
  hairRing.position.set(0, BY + 0.004, -0.047);
  hairRing.rotation.x = 0.55;
  const ponytail = new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [0.006, -0.003], [0.0105, -0.013], [0.0095, -0.028], [0.005, -0.04], [0, -0.046]].map(([x, y]) => new THREE.Vector2(x, y)), 20),
    hairMat,
  );
  ponytail.position.set(0, BY + 0.004, -0.049);
  ponytail.rotation.x = -0.32;
  heroDay.add(hairRing, ponytail);

  // The beard: trimmed close along the jaw, a little fuller at the chin, with a clean edge.
  const BEARD_HALF = 1.05;
  const beardShell = heroShell(0.0436, hairMat,
    (az, y) => Math.abs(az) < BEARD_HALF
      && y < -0.004 + 0.02 * Math.pow(Math.abs(az) / BEARD_HALF, 2.6)
      && y > -0.031 + 0.02 * Math.pow(Math.abs(az) / BEARD_HALF, 2.2),
    (az, y) => 0.03 + 0.055 * Math.exp(-((az / 0.55) ** 2)) * step(-y, 0.006, 0.028));
  tomato.add(beardShell);

  // The face: steady eyes under heavy brows, a nose, a moustache, a smile in the beard.
  const eyeWhite = toon({ color: '#fff3dc', rim: 0, map: plain });
  const irisMat = new THREE.MeshBasicMaterial({ color: '#5a2e12' });
  const pupilMat = new THREE.MeshBasicMaterial({ color: '#1d1210' });
  const glintMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false });
  for (const sx of [-1, 1]) {
    const brow = new THREE.Mesh(new RoundedBoxGeometry(0.021, 0.0072, 0.0064, 2, 0.0026), hairMat);
    brow.position.set(sx * 0.015, BY + 0.0312, 0.0296);
    brow.rotation.set(0, -sx * 0.28, sx * 0.34);
    const tash = blob(0.008, hairMat, sx * 0.0092, BY + 0.0035, 0.0425, 1.6, 0.55, 0.7);
    tash.rotation.z = -sx * 0.36;
    tomato.add(
      blob(0.0098, eyeWhite, sx * 0.015, BY + 0.0188, 0.0335, 1.2, 0.96, 0.5),
      blob(0.0056, irisMat, sx * 0.0132, BY + 0.0184, 0.0384, 1, 1, 0.45),
      blob(0.003, pupilMat, sx * 0.013, BY + 0.0184, 0.0406, 1, 1, 0.45),
      blob(0.0014, glintMat, sx * 0.013 + 0.0021, BY + 0.0208, 0.0417),
      // A heavy upper lid: the look of someone who has seen this bug before.
      blob(0.01, skinShade, sx * 0.015, BY + 0.0258, 0.0325, 1.22, 0.5, 0.52),
      brow, tash,
    );
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.0046, 0.0011, 6, 14, Math.PI), new THREE.MeshBasicMaterial({ color: '#f6c9a8' }));
  smile.position.set(0, BY - 0.0105, 0.0492);
  smile.rotation.z = Math.PI;
  // No drawn mouth: under a moustache like that, the beard does the smiling.
  smile.visible = false;
  tomato.add(blob(0.0072, skin, 0, BY + 0.0115, 0.0425, 1, 0.92, 1), smile);

  // The green star and its stalk on top.
  for (let i = 0; i < 6; i++) {
    const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.0088, 0.036, 6), leaf);
    sepal.scale.z = 0.36;
    const ang = (i / 6) * Math.PI * 2 + 0.3;
    sepal.position.set(Math.cos(ang) * 0.014, BY + 0.0445, Math.sin(ang) * 0.014);
    sepal.rotation.set(0, -ang, -Math.PI / 2 + 0.26, 'YXZ');
    heroDay.add(sepal);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0048, 0.024, 8), leaf);
  stem.position.set(0.002, BY + 0.056, 0);
  stem.rotation.z = 0.22;
  tomato.add(heroDay, stem);

  // Lights out, he is a hacker: a black hood and cloak thrown on over everything, and eyes that glow.
  // A little self-light, or black cloth on a black room would simply vanish.
  const hoodMat = toon({ color: '#1d1b2a', rim: 0.6, emissive: '#232a4a', emissiveIntensity: 1, side: THREE.DoubleSide });
  const hoodTrim = new THREE.MeshBasicMaterial({ color: '#5dff8a', toneMapped: false, fog: false });
  const heroHood = new THREE.Group();
  const hoodShell = new THREE.Mesh(new THREE.SphereGeometry(0.0462, 28, 18, Math.PI * 1.5 - 2.3, 4.6, 0, 2.2), hoodMat);
  hoodShell.position.y = BY;
  // The point of the hood, flopped back.
  const hoodPeak = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.05, 14), hoodMat);
  hoodPeak.position.set(0, BY + 0.05, -0.02);
  hoodPeak.rotation.x = -0.85;
  const hoodCloak = new THREE.Mesh(new THREE.CylinderGeometry(0.0445, 0.053, 0.042, 28, 1, true), hoodMat);
  hoodCloak.position.y = 0.026;
  // The brim of the hood, shading the brow.
  const hoodBrim = new THREE.Mesh(new THREE.TorusGeometry(0.033, 0.0075, 10, 28, Math.PI), hoodMat);
  hoodBrim.position.set(0, BY + 0.024, 0.026);
  hoodBrim.rotation.x = -0.3;
  // What makes it a hoodie: a glowing edge to the hood, a zip down the front, two drawstrings.
  const hoodEdge = new THREE.Mesh(new THREE.TorusGeometry(0.0335, 0.0018, 6, 28, Math.PI), hoodTrim);
  hoodEdge.position.set(0, BY + 0.024, 0.0335);
  hoodEdge.rotation.x = -0.3;
  const hoodZip = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.036, 0.002), hoodTrim);
  hoodZip.position.set(0, 0.026, 0.0495);
  hoodZip.rotation.x = -0.2;
  heroHood.add(hoodShell, hoodPeak, hoodCloak, hoodBrim, hoodEdge, hoodZip);
  for (const sx of [-1, 1]) {
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.026, 6), new THREE.MeshBasicMaterial({ color: '#e8e4f0', toneMapped: false, fog: false }));
    string.position.set(sx * 0.012, 0.036, 0.0485);
    string.rotation.z = sx * 0.12;
    const tip = blob(0.0028, hoodTrim, sx * 0.0136, 0.023, 0.05);
    heroHood.add(string, tip);
  }
  heroHood.visible = false;
  const heroGlow = new THREE.Group();
  const heroEyeMat = new THREE.MeshBasicMaterial({ color: '#6dff9a', toneMapped: false, fog: false });
  for (const sx of [-1, 1]) heroGlow.add(blob(0.0078, heroEyeMat, sx * 0.0145, BY + 0.0192, 0.0372, 1.2, 0.6, 0.4));
  heroGlow.visible = false;
  tomato.add(heroHood, heroGlow);
  tomato.scale.setScalar(1.55);
  tomato.rotation.y = 0.35;
  tomato.position.set(0.015, 0.066, 0.01);
  stack.add(tomato);
  stack.position.set(-0.3, 0, -0.58);
  scene.add(shadow(stack));

  /* ----- a lived-in room: curios on a shelf, a portrait, a lantern, bunting ----- */
  const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return m;
  };
  const jar = (color: string, h: number, r: number, x: number, label: string) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, h, 20), toon({ color, emissive: color, emissiveIntensity: 0.3 }));
    body.position.y = h / 2;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.82, h * 0.22, 16), toon({ color: '#a8773f' }));
    lid.position.y = h * 1.1;
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(r * 1.7, h * 0.46),
      new THREE.MeshBasicMaterial({ map: colorTex(labelCanvas(label, '#f4e8c8', '#3a2418')) }),
    );
    tag.position.set(0, h * 0.5, r + 0.0015);
    g.add(body, lid, tag);
    g.position.set(x, 0.011, 0.005);
    return g;
  };

  const curio = new THREE.Group();
  curio.add(new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.022, 0.15, 2, 0.005), darkWood));
  curio.add(box(0.02, 0.07, 0.1, darkWood, -0.25, -0.045, -0.02), box(0.02, 0.07, 0.1, darkWood, 0.25, -0.045, -0.02));

  // Crystal ball.
  const orbMat = toon({ gloss: 1, rim: 0.9, color: '#8fd8ff', emissive: '#3f9dff', emissiveIntensity: 0.9 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.046, 32, 24), orbMat);
  orb.position.set(-0.22, 0.011 + 0.064, 0.01);
  const orbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.042, 0.024, 24), brass);
  orbBase.position.set(-0.22, 0.011 + 0.012, 0.01);
  const orbLight = new THREE.PointLight('#6ab8ff', 0.12, 1.4, 1);
  orbLight.position.copy(orb.position);
  const orbGroup = new THREE.Group();
  const orbGlyph = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(runeCanvas('</>')), transparent: true, depthWrite: false, depthTest: false, toneMapped: false, fog: false,
  }));
  orbGlyph.renderOrder = 5;
  orbGlyph.scale.set(0.07, 0.07, 1);
  orbGlyph.position.set(-0.22, 0.011 + 0.064, 0.01);
  orbGroup.add(orb, orbBase, orbLight, orbGlyph);
  curio.add(orbGroup);

  // Hourglass.
  const hourglass = new THREE.Group();
  const sandGlass = glassMat('#eaf6ff', 0.4);
  for (const dir of [1, -1]) {
    const bulb = new THREE.Mesh(new THREE.ConeGeometry(0.021, 0.036, 20), sandGlass);
    bulb.rotation.z = dir === 1 ? Math.PI : 0;
    bulb.position.y = 0.045 + dir * 0.018;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.006, 20), brass);
    cap.position.y = 0.045 + dir * 0.039;
    hourglass.add(bulb, cap);
  }
  const sand = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.02, 16), toon({ color: '#f0c860' }));
  sand.position.y = 0.019;
  hourglass.add(sand);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.078, 6), brass);
    post.position.set(Math.cos(a) * 0.023, 0.045, Math.sin(a) * 0.023);
    hourglass.add(post);
  }
  hourglass.position.set(-0.09, 0.011, 0.01);
  curio.add(hourglass);

  curio.add(jar('#e0c63c', 0.062, 0.024, 0.02, 'JS'), jar('#4f86d6', 0.085, 0.022, 0.088, 'TS'), jar('#d6557f', 0.052, 0.026, 0.158, 'CSS'));

  // Rolled scrolls, ends towards you.
  const parchmentMat = toon({ color: '#ecdcb0' });
  for (const [x, y] of [[0.235, 0.014], [0.268, 0.014], [0.252, 0.04]]) {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 16), parchmentMat);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(x, 0.011 + y, 0);
    curio.add(roll);
  }
  curio.position.set(0.3, 0.5, -1.22);
  scene.add(shadow(curio));

  // The hero's portrait in a gilt frame.
  const portrait = new THREE.Group();
  portrait.add(new THREE.Mesh(new RoundedBoxGeometry(0.21, 0.27, 0.024, 3, 0.008), toon({ color: '#e9b44c' })));
  const portraitMat = new THREE.MeshBasicMaterial({ color: '#f1dfb8' });
  const canvasPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.165, 0.225), portraitMat);
  canvasPlane.position.z = 0.0125;
  portrait.add(canvasPlane);
  portrait.position.set(-0.18, 0.55, -1.28);
  portrait.rotation.z = 0.03;
  scene.add(shadow(portrait, false, true));

  // A lantern on a chain.
  const lantern = new THREE.Group();
  const iron = toon({ color: '#2a2230' });
  const lanternGlow = new THREE.MeshBasicMaterial({ color: '#ffc56a', toneMapped: false, fog: false });
  lantern.add(box(0.062, 0.095, 0.062, lanternGlow, 0, -0.06, 0));
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) lantern.add(box(0.008, 0.105, 0.008, iron, x * 0.033, -0.06, z * 0.033));
  lantern.add(box(0.085, 0.01, 0.085, iron, 0, -0.112, 0), box(0.066, 0.006, 0.066, iron, 0, -0.06, 0), box(0.074, 0.008, 0.074, iron, 0, -0.01, 0));
  for (const [x, z] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) lantern.add(box(0.006, 0.1, 0.006, iron, x * 0.032, -0.06, z * 0.032));
  const lanternRing = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0028, 8, 20), iron);
  lanternRing.position.y = 0.042;
  lantern.add(lanternRing);
  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.04, 4), iron);
  lanternCap.rotation.y = Math.PI / 4;
  lanternCap.position.y = 0.012;
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.6, 6), iron);
  chain.position.y = 0.33;
  const lanternLight = new THREE.PointLight('#ffb050', 0.22, 2.2, 1);
  lanternLight.position.y = -0.06;
  lantern.add(lanternCap, chain, lanternLight);
  lantern.position.set(-1.14, 0.72, -1.05);
  scene.add(lantern);

  // Bunting along the wall — strung from beside the window to the corner, never across the glass.
  const bunting = new THREE.Group();
  const FLAGS = 12;
  const flagColors = ['#d8402a', '#e9b44c', '#3f8a5a', '#3b62b8', '#9a5bd6'];
  const flags: THREE.Mesh[] = [];
  for (let i = 0; i < FLAGS; i++) {
    const tri = new THREE.Shape();
    tri.moveTo(-0.05, 0);
    tri.lineTo(0.05, 0);
    tri.lineTo(0, -0.11);
    tri.lineTo(-0.05, 0);
    const flag = new THREE.Mesh(new THREE.ShapeGeometry(tri), toon({ color: flagColors[i % flagColors.length], side: THREE.DoubleSide }));
    flags.push(flag);
    bunting.add(flag);
  }
  const cord = new THREE.Mesh(new THREE.BufferGeometry(), iron);
  bunting.add(cord);
  bunting.position.z = -1.22;
  scene.add(bunting);
  const hangBunting = (x0: number, x1: number) => {
    const sag = (k: number) => 0.87 - Math.sin(k * Math.PI) * 0.08;
    flags.forEach((flag, i) => {
      const k = (i + 0.5) / FLAGS;
      flag.position.set(x0 + k * (x1 - x0), sag(k), 0);
    });
    cord.geometry.dispose();
    cord.geometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(Array.from({ length: 17 }, (_, i) => new THREE.Vector3(x0 + (i / 16) * (x1 - x0), sag(i / 16), 0))),
      32, 0.003, 6,
    );
  };

  /* ----- more things on the table ----- */
  // A treasure chest at the back; click it and it opens.
  const chest = new THREE.Group();
  const chestWood = toon({ color: '#8a4f24' });
  chest.add(new THREE.Mesh(new RoundedBoxGeometry(0.21, 0.09, 0.13, 2, 0.006), chestWood));
  for (const x of [-0.07, 0.07]) chest.add(box(0.018, 0.094, 0.134, brass, x, 0, 0));
  chest.add(box(0.03, 0.036, 0.008, brass, 0, 0.02, 0.068), box(0.006, 0.013, 0.002, toon({ color: '#1c1210', rim: 0 }), 0, 0.017, 0.0725));
  const groove = toon({ color: '#4a2812', rim: 0 });
  const stud = (x: number, y: number, z: number, parent: THREE.Object3D) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 12, 8), gold);
    m.position.set(x, y, z);
    parent.add(m);
  };
  for (const y of [-0.014, 0.016]) chest.add(box(0.2, 0.0028, 0.002, groove, 0, y, 0.0656));
  for (const x of [-0.07, 0.07]) for (const y of [-0.03, 0.0, 0.03]) stud(x, y, 0.068, chest);
  for (const x of [-0.096, 0.096]) chest.add(box(0.024, 0.024, 0.024, brass, x, -0.035, 0.055));
  const chestLid = new THREE.Group();
  const lidShell = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.21, 24, 1, false, 0, Math.PI), chestWood);
  lidShell.rotation.z = Math.PI / 2;
  lidShell.position.z = 0.065;
  // The lid is closed underneath, so nothing shows through it when it stands open.
  chestLid.add(lidShell, box(0.206, 0.004, 0.126, toon({ color: '#5a3016', rim: 0 }), 0, 0.001, 0.065));
  for (const x of [-0.07, 0.07]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.018, 24, 1, false, 0, Math.PI), brass);
    band.rotation.z = Math.PI / 2;
    band.position.set(x, 0, 0.065);
    chestLid.add(band);
  }
  for (const x of [-0.07, 0.07]) for (const a of [0.5, 1.2, 1.9, 2.6]) stud(x, Math.sin(a) * 0.068, 0.065 + Math.cos(a) * 0.068, chestLid);
  for (const a of [0.75, 1.57, 2.4]) {
    const plank = box(0.202, 0.0028, 0.003, groove, 0, Math.sin(a) * 0.0655, 0.065 + Math.cos(a) * 0.0655);
    plank.rotation.x = Math.PI / 2 - a;
    chestLid.add(plank);
  }
  chestLid.position.set(0, 0.045, -0.065);
  const treasure = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#ffd45a', toneMapped: false, fog: false }),
  );
  treasure.scale.set(1.05, 0.28, 0.62);
  treasure.position.y = 0.03;
  const chestLight = new THREE.PointLight('#ffd060', 0, 1.6, 1);
  chestLight.position.y = 0.12;
  chest.add(chestLid, treasure, chestLight);
  chest.position.set(0.02, 0.045, -0.74);
  chest.rotation.y = 0.18;
  scene.add(shadow(chest));
  // A few coins that rolled out.
  const coins = new THREE.Group();
  for (const [x, z, ry] of [[0.16, 0.06, 0], [0.19, 0.1, 0.4], [0.13, 0.11, 1], [0.2, 0.03, 2], [0.165, 0.085, 0.7]]) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.004, 16), gold);
    coin.position.set(x, 0.002 + (ry === 0.7 ? 0.004 : 0), z);
    coin.rotation.y = ry;
    coins.add(coin);
  }
  coins.position.set(0.02, 0, -0.74);
  scene.add(shadow(coins));

  // A wizard's hat.
  const hat = new THREE.Group();
  const felt = toon({ color: '#5a3aa8', rim: 0.8 });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.008, 32), felt);
  brim.position.y = 0.004;
  const crownCone = new THREE.Mesh(new THREE.ConeGeometry(0.066, 0.21, 28), felt);
  crownCone.position.set(0.008, 0.112, 0);
  crownCone.rotation.z = -0.12;
  const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.007, 8, 32), gold);
  hatBand.rotation.x = Math.PI / 2;
  hatBand.position.y = 0.018;
  hat.add(brim, crownCone, hatBand);
  const hatTip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.075, 16), felt);
  hatTip.position.set(0.046, 0.212, 0);
  hatTip.rotation.z = -1.05;
  hat.add(hatTip, box(0.03, 0.024, 0.006, gold, 0, 0.018, 0.066), box(0.016, 0.011, 0.007, felt, 0, 0.018, 0.0665));
  for (const [a, y] of [[0.5, 0.06], [1.5, 0.1], [2.5, 0.05], [-0.4, 0.12], [-1.3, 0.075], [3.3, 0.13]]) {
    const r = 0.066 * (1 - (y - 0.007) / 0.21) + 0.001;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.0075), gold);
    star.position.set(Math.sin(a) * r + 0.008 - y * 0.12, y, Math.cos(a) * r);
    star.scale.z = 0.4;
    star.rotation.y = a;
    hat.add(star);
  }
  hat.scale.setScalar(0.72);
  // Rests on the lid, but belongs to the chest: when the lid swings up the hat floats clear of it.
  hat.position.set(0.03, 0.109, -0.003);
  hat.rotation.y = 0.4;
  const hatY = hat.position.y;
  shadow(hat);
  chest.add(hat);

  // Glowing crystals.
  const crystals = new THREE.Group();
  const crystalMat = toon({ gloss: 1, rim: 0.9, color: '#9ff3ff', emissive: '#49d8ff', emissiveIntensity: 0.8 });
  for (const [x, z, sz, rz, rx] of [[0, 0, 0.03, 0.1, 0], [0.035, 0.01, 0.02, -0.5, 0.2], [-0.03, 0.015, 0.022, 0.55, -0.1], [0.008, 0.035, 0.016, 0.2, 0.6]]) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(sz), crystalMat);
    shard.scale.y = 2.4;
    shard.position.set(x, sz * 1.7, z);
    shard.rotation.set(rx, 0.4, rz);
    crystals.add(shard);
  }
  const crystalLight = new THREE.PointLight('#6fe8ff', 0.1, 1.2, 1);
  crystalLight.position.y = 0.06;
  crystals.add(crystalLight);
  crystals.position.set(0.78, 0, -0.36);
  scene.add(shadow(crystals));

  // A letter rolled up with a ribbon.
  const letter = new THREE.Group();
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.2, 20), parchmentMat);
  roll.rotation.z = Math.PI / 2;
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 24), toon({ color: '#c8281e' }));
  tie.rotation.y = Math.PI / 2;
  letter.add(roll, tie);
  letter.position.set(-1.02, 0.017, -0.28);
  letter.rotation.y = 0.9;
  scene.add(shadow(letter));

  // A ginger cat sitting on the windowsill, tail hanging over the edge.
  const cat = new THREE.Group();
  const ginger = toon({ color: '#f07f1c', rim: 0.35, emissive: '#7a3206', emissiveIntensity: 0.5 });
  const creamFur = toon({ color: '#fff1dc', rim: 0.6 });
  const earPink = toon({ color: '#ff9aa8', rim: 0 });
  const ball = (r: number, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  };
  // A pear-shaped sitting body, front legs planted, haunches either side.
  const catBody = new THREE.Mesh(
    new THREE.LatheGeometry(
      [[0, 0], [0.04, 0.002], [0.052, 0.022], [0.05, 0.05], [0.038, 0.082], [0.026, 0.104], [0, 0.112]].map(([x, y]) => new THREE.Vector2(x, y)),
      28,
    ),
    ginger,
  );
  catBody.scale.z = 0.86;
  cat.add(catBody, ball(0.026, creamFur, 0, 0.064, 0.026, 0.8, 1.35, 0.55));
  const stripe = toon({ color: '#b85a12', rim: 0 });
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.0105, 0.04, 4, 10), ginger);
    leg.position.set(sx * 0.016, 0.034, 0.038);
    cat.add(
      ball(0.026, ginger, sx * 0.04, 0.024, 0.004, 1, 1, 1.1),
      leg,
      ball(0.0125, creamFur, sx * 0.016, 0.01, 0.047, 1.05, 0.75, 1.3),
    );
  }
  // Tabby flanks, and a red collar with a little bell.
  for (const sx of [-1, 1]) {
    for (const [y, r] of [[0.04, 0.05], [0.058, 0.047], [0.076, 0.04]]) cat.add(ball(0.008, stripe, sx * (r - 0.0015), y, 0.006, 0.3, 0.5, 1.7));
  }
  const catCollar = new THREE.Mesh(new THREE.TorusGeometry(0.0265, 0.0042, 8, 24), toon({ color: '#c8281e', gloss: 0.4 }));
  catCollar.rotation.x = Math.PI / 2;
  catCollar.position.set(0, 0.105, 0.004);
  catCollar.scale.y = 0.9;
  cat.add(catCollar, ball(0.0072, gold, 0, 0.098, 0.031));
  // A big round head: that is where a storybook cat keeps its charm.
  const catHead = new THREE.Group();
  catHead.add(
    ball(0.046, ginger, 0, 0, 0, 1.1, 0.94, 0.95),
    ball(0.016, creamFur, -0.01, -0.014, 0.034, 1.1, 0.8, 0.8), ball(0.016, creamFur, 0.01, -0.014, 0.034, 1.1, 0.8, 0.8),
    ball(0.011, creamFur, 0, -0.025, 0.03),
    ball(0.005, earPink, 0, -0.005, 0.048, 1.2, 0.8, 1),
  );
  // Tabby marks on the forehead.
  for (const dx of [-0.012, 0, 0.012]) catHead.add(ball(0.006, stripe, dx, 0.031 - Math.abs(dx) * 0.2, 0.03, 0.45, 1.3, 0.4));
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 4), ginger);
    ear.position.set(sx * 0.03, 0.04, 0);
    ear.rotation.set(0, Math.PI / 4, -sx * 0.3);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.026, 4), earPink);
    inner.position.set(sx * 0.03, 0.038, 0.007);
    inner.rotation.copy(ear.rotation);
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.022, 4), ginger);
    tuft.position.set(sx * 0.05, -0.012, 0.006);
    tuft.rotation.z = -sx * (Math.PI / 2 + 0.35);
    catHead.add(ear, inner, tuft);
    for (const dy of [-0.004, 0.004]) {
      const whisker = box(0.036, 0.0011, 0.0011, new THREE.MeshBasicMaterial({ color: '#fff6e6' }), sx * 0.04, -0.014 + dy, 0.036);
      whisker.rotation.z = sx * dy * 30;
      catHead.add(whisker);
    }
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#c8ff5a', toneMapped: false, fog: false });
  const catEyes = [-1, 1].map((sx) => {
    const eye = new THREE.Group();
    eye.add(new THREE.Mesh(new THREE.SphereGeometry(0.0095, 14, 12), eyeMat));
    eye.add(box(0.0034, 0.0135, 0.002, new THREE.MeshBasicMaterial({ color: '#16101a' }), 0, 0, 0.0088));
    eye.add(ball(0.0022, new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false }), 0.003, 0.0035, 0.0088));
    eye.position.set(sx * 0.018, 0.006, 0.036);
    catHead.add(eye);
    return eye;
  });
  catHead.position.set(0, 0.142, 0.012);
  // The tail stands up beside the body in a question mark, as a pleased cat carries it.
  const catTail = new THREE.Group();
  const tailPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.04, 0, 0.002), new THREE.Vector3(0.068, 0.018, 0.01),
    new THREE.Vector3(0.074, 0.058, 0.016), new THREE.Vector3(0.062, 0.093, 0.018), new THREE.Vector3(0.044, 0.106, 0.018),
  ]);
  catTail.add(new THREE.Mesh(new THREE.TubeGeometry(tailPath, 32, 0.0105, 10), ginger));
  catTail.add(ball(0.012, creamFur, 0.044, 0.106, 0.018));
  catTail.position.set(0.02, 0.012, -0.03);
  cat.add(catHead, catTail);
  // Well forward on the sill: the whole cat sits in front of the glass and its bars, touching neither.
  cat.position.set(0.09, -0.025, 0.09);
  windowGroup.add(cat);

  // A cauldron quietly bubbling at the back.
  const cauldron = new THREE.Group();
  const potIron = toon({ color: '#33303c', gloss: 0.5 });
  const potProfile = [
    [0, 0.012], [0.06, 0.012], [0.086, 0.03], [0.096, 0.07], [0.086, 0.108], [0.076, 0.116], [0.084, 0.124],
    [0.07, 0.124], [0.07, 0.11], [0, 0.11],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  cauldron.add(new THREE.Mesh(new THREE.LatheGeometry(potProfile, 40), potIron));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.006, 0.03, 8), potIron);
    leg.position.set(Math.cos(a) * 0.055, 0.012, Math.sin(a) * 0.055);
    cauldron.add(leg);
  }
  const brewMat = new THREE.MeshBasicMaterial({ color: '#7dff5a', toneMapped: false, fog: false });
  const brewTop = new THREE.Mesh(new THREE.CircleGeometry(0.07, 32), brewMat);
  brewTop.rotation.x = -Math.PI / 2;
  brewTop.position.y = 0.112;
  cauldron.add(brewTop);
  const bubbles = [0, 1, 2, 3, 4].map((i) => {
    const bub = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 10), brewMat);
    bub.userData.phase = i / 5;
    bub.position.set(Math.cos(i * 2.4) * 0.036, 0.114, Math.sin(i * 2.4) * 0.036);
    cauldron.add(bub);
    return bub;
  });
  const cauldronLight = new THREE.PointLight('#7dff5a', 0.14, 1.3, 1);
  cauldronLight.position.y = 0.2;
  cauldron.add(cauldronLight);
  cauldron.position.set(-0.6, 0, -0.9);
  scene.add(shadow(cauldron));

  // A wand left lying about.
  const wand = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.24, 10), toon({ color: '#5a3320' }));
  stick.rotation.z = Math.PI / 2;
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? 0.03 : 0.013;
    const a = (Math.PI * i) / 5;
    if (i === 0) starShape.moveTo(Math.sin(a) * rad, Math.cos(a) * rad);
    else starShape.lineTo(Math.sin(a) * rad, Math.cos(a) * rad);
  }
  const wandStar = new THREE.Mesh(
    new THREE.ExtrudeGeometry(starShape, { depth: 0.006, bevelEnabled: false }),
    toon({ color: '#ffe07a', emissive: '#ffc93a', emissiveIntensity: 0.9, gloss: 1 }),
  );
  wandStar.rotation.x = -Math.PI / 2;
  wandStar.position.set(0.135, -0.003, 0);
  wand.add(stick, wandStar);
  wand.position.set(0.6, 0.008, 0.1);
  wand.rotation.y = 0.9;
  scene.add(shadow(wand));

  /* ----- the tools of the trade, fairy-tale edition ----- */
  // An enchanted laptop: the magic mirror of this kingdom.
  const laptop = new THREE.Group();
  const shell = toon({ color: '#4a5068', gloss: 0.4 });
  laptop.add(new THREE.Mesh(new RoundedBoxGeometry(0.27, 0.012, 0.185, 3, 0.005), shell));
  const deck = box(0.235, 0.002, 0.1, toon({ color: '#252838', rim: 0 }), 0, 0.007, -0.022);
  const pad = box(0.08, 0.002, 0.045, toon({ color: '#5a6080', rim: 0 }), 0, 0.007, 0.06);
  laptop.add(deck, pad);
  const lid = new THREE.Group();
  const lidPanel = new THREE.Mesh(new RoundedBoxGeometry(0.27, 0.18, 0.008, 3, 0.004), shell);
  lidPanel.position.y = 0.09;
  const screens = ([0, 1, 2] as const).map((mode) => colorTex(screenCanvas(mode)));
  const screenMat = new THREE.MeshBasicMaterial({ map: screens[0], toneMapped: false, fog: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.245, 0.153), screenMat);
  screen.position.set(0, 0.092, 0.0046);
  lid.add(lidPanel, screen);
  lid.position.set(0, 0.006, -0.09);
  lid.rotation.x = -0.3;
  const screenLight = new THREE.PointLight('#7fd4ff', 0.16, 1.3, 1);
  screenLight.position.set(0, 0.1, 0.12);
  laptop.add(lid, screenLight);
  laptop.position.set(0.5, 0.006, -0.6);
  laptop.rotation.y = -0.42;
  scene.add(shadow(laptop));

  // The rubber duck every debugger confides in.
  const duck = new THREE.Group();
  const duckYellow = toon({ color: '#ffd23a', gloss: 0.7, rim: 0.7 });
  const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.034, 24, 18), duckYellow);
  duckBody.scale.set(1.25, 0.86, 1);
  duckBody.position.y = 0.029;
  const duckTail = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.03, 12), duckYellow);
  duckTail.position.set(-0.04, 0.045, 0);
  duckTail.rotation.z = 0.9;
  const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.023, 20, 16), duckYellow);
  duckHead.position.set(0.026, 0.066, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.022, 10), toon({ color: '#ff7a1a', gloss: 0.5 }));
  beak.rotation.z = -Math.PI / 2;
  beak.scale.z = 1.5;
  beak.position.set(0.052, 0.062, 0);
  duck.add(duckBody, duckTail, duckHead, beak);
  for (const z of [-0.011, 0.011]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0036, 8, 8), new THREE.MeshBasicMaterial({ color: '#1a1014' }));
    eye.position.set(0.042, 0.072, z);
    duck.add(eye);
  }
  duck.position.set(0.4, 0, -0.36);
  duck.rotation.y = -0.6;
  duck.scale.setScalar(0.82);
  scene.add(shadow(duck));

  // A clicky keyboard.
  const keyboard = new THREE.Group();
  keyboard.add(new THREE.Mesh(new RoundedBoxGeometry(0.31, 0.016, 0.115, 3, 0.006), toon({ color: '#2f3348', gloss: 0.3 })));
  const KEY_COLS = 12;
  const KEY_ROWS = 4;
  const keycaps = new THREE.InstancedMesh(
    new RoundedBoxGeometry(0.019, 0.009, 0.019, 2, 0.003),
    toon({ color: '#ffffff', map: plain, outline: false, rim: 0, gloss: 0.25 }),
    KEY_COLS * KEY_ROWS,
  );
  const keyDummy = new THREE.Object3D();
  const keyColor = new THREE.Color();
  const placeKeys = (wave: number) => {
    for (let row = 0; row < KEY_ROWS; row++) {
      for (let col = 0; col < KEY_COLS; col++) {
        const i = row * KEY_COLS + col;
        const dip = wave > 0 ? Math.max(0, Math.sin(wave * 9 - col * 0.55 - row * 0.3)) * Math.max(0, 1 - wave) : 0;
        keyDummy.position.set((col - (KEY_COLS - 1) / 2) * 0.0238, 0.0125 - dip * 0.004, (row - (KEY_ROWS - 1) / 2) * 0.0238);
        keyDummy.updateMatrix();
        keycaps.setMatrixAt(i, keyDummy.matrix);
        const accent = (row === 0 && col === 0) || (row === 2 && col === 11);
        if (dip > 0.2) keyColor.setHSL((col / KEY_COLS + wave) % 1, 0.9, 0.62);
        else keyColor.set(accent ? '#ff5b36' : (row + col) % 7 === 0 ? '#e9b44c' : '#f1e6cf');
        keycaps.setColorAt(i, keyColor);
      }
    }
    keycaps.instanceMatrix.needsUpdate = true;
    if (keycaps.instanceColor) keycaps.instanceColor.needsUpdate = true;
  };
  placeKeys(0);
  keyboard.add(keycaps);
  keyboard.position.set(-0.52, 0.007, -0.1);
  keyboard.rotation.y = 0.2;
  keyboard.scale.setScalar(0.8);
  scene.add(shadow(keyboard));

  // Floppy disks: ancient relics.
  const floppies = new THREE.Group();
  const shutter = toon({ color: '#8a8aa0', gloss: 0.8 });
  ['#3b62b8', '#d8402a', '#e9b44c'].forEach((color, i) => {
    const disk = new THREE.Group();
    disk.add(new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.005, 0.09, 2, 0.002), toon({ color })));
    disk.add(box(0.045, 0.0056, 0.03, shutter, 0.006, 0, -0.03), box(0.064, 0.0054, 0.03, paperMat, 0, 0, 0.026));
    disk.position.set(i * 0.008, 0.0025 + i * 0.0052, -i * 0.006);
    disk.rotation.y = i * 0.35 - 0.2;
    floppies.add(disk);
  });
  floppies.position.set(0.7, 0, -0.44);
  scene.add(shadow(floppies));

  // The elixir of productivity.
  const mug = new THREE.Group();
  const glaze = toon({ color: '#d8402a', gloss: 0.8, side: THREE.DoubleSide });
  const mugProfile = [
    [0, 0], [0.034, 0], [0.039, 0.004], [0.041, 0.02], [0.041, 0.084], [0.0395, 0.088], [0.0375, 0.086],
    [0.0372, 0.02], [0.034, 0.01], [0, 0.009],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  mug.add(new THREE.Mesh(new THREE.LatheGeometry(mugProfile, 48), glaze));
  const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.0058, 12, 24, Math.PI), glaze);
  mugHandle.rotation.z = -Math.PI / 2;
  mugHandle.position.set(0.04, 0.047, 0);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.0372, 32), toon({ color: '#3a1a0a', gloss: 0.9, rim: 0 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.076;
  mug.add(mugHandle, coffee);
  mug.position.set(0.54, 0, -0.2);
  mug.rotation.y = -0.5;
  scene.add(shadow(mug));
  const mugSteam = [0, 1].map((i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: colorTex(glowCanvas('rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)')), transparent: true, depthWrite: false, opacity: 0, fog: false,
    }));
    sp.userData.phase = i / 2;
    scene.add(sp);
    return sp;
  });

  // The sprint board, pinned to the wall.
  const board = new THREE.Group();
  board.add(new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.29, 0.02, 2, 0.006), darkWood));
  const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.26), new THREE.MeshBasicMaterial({ map: colorTex(kanbanCanvas()) }));
  boardFace.position.z = 0.0105;
  board.add(boardFace);
  board.position.set(0.86, 0.36, -1.28);
  board.rotation.z = -0.02;
  scene.add(shadow(board, false, true));

  /* ----- tall cases in the corners, stacked with a developer's hoard ----- */
  const leds: THREE.MeshBasicMaterial[] = [];
  const caseWood = toon({ color: '#6a3f24', rim: 0.1 });
  const caseRand = seeded(73);
  const spineColors = ['#5b2434', '#27463a', '#7a5a22', '#283a66', '#7c2f20', '#4a3a66', '#2f5560', '#8a4a1c'];
  const led = (color: string, x: number, y: number, z: number, parent: THREE.Object3D) => {
    const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false, fog: false });
    mat.userData.on = new THREE.Color(color);
    leds.push(mat);
    parent.add(box(0.009, 0.009, 0.003, mat, x, y, z));
  };
  const bookRow = (count: number): THREE.Group => {
    const g = new THREE.Group();
    let x = 0;
    for (let i = 0; i < count; i++) {
      const w = 0.02 + caseRand() * 0.02;
      const h = 0.13 + caseRand() * 0.07;
      const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.13, 2, 0.004), toon({ color: spineColors[Math.floor(caseRand() * spineColors.length)], rim: 0.12 }));
      b.position.set(x + w / 2, h / 2, 0);
      if (i === count - 1 && count > 2) { b.rotation.z = 0.2; b.position.x += 0.012; }
      g.add(b);
      x += w + 0.003;
    }
    return g;
  };
  const makeServer = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.2, 0.15, 2, 0.006), toon({ color: '#2b3042', gloss: 0.3 })));
    for (let row = 0; row < 4; row++) {
      g.add(box(0.105, 0.03, 0.004, toon({ color: '#3a4158', rim: 0 }), 0, 0.066 - row * 0.044, 0.076));
      led(row % 2 ? '#ffb03a' : '#5dff8a', -0.038, 0.066 - row * 0.044, 0.079, g);
      led('#5dff8a', -0.022, 0.066 - row * 0.044, 0.079, g);
    }
    g.position.y = 0.1;
    return g;
  };
  // The old monitor runs a ticker: one long line that scrolls past, wrapping round.
  const crtOn = colorTex(tickerCanvas('> hello, world_    > hire --senior tomato    > coffee && code    > git commit -m "magic"    '));
  crtOn.wrapS = THREE.RepeatWrapping;
  crtOn.repeat.x = 0.2;
  const crtScreen = new THREE.MeshBasicMaterial({ map: crtOn, toneMapped: false, fog: false });
  const makeCrt = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.16, 0.15, 3, 0.012), toon({ color: '#d8cfb8' })));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.105), crtScreen);
    face.position.set(-0.008, 0.006, 0.0755);
    g.add(face, box(0.11, 0.02, 0.1, toon({ color: '#b8ae96' }), 0, -0.09, 0));
    led('#5dff8a', 0.082, -0.062, 0.076, g);
    g.position.y = 0.1;
    return g;
  };
  const makeCactus = () => {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.028, 0.05, 20), toon({ color: '#c8643a' }));
    pot.position.y = 0.025;
    const green = toon({ color: '#3f9a4a', rim: 0.8 });
    const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.07, 6, 14), green);
    trunk.position.y = 0.1;
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.03, 4, 10), green);
    arm.position.set(0.03, 0.1, 0);
    arm.rotation.z = -0.6;
    const arm2 = arm.clone();
    arm2.position.set(-0.028, 0.085, 0);
    arm2.rotation.z = 0.7;
    const flower = ball(0.008, toon({ color: '#ff6aa0', rim: 0 }), 0, 0.158, 0);
    g.add(pot, trunk, arm, arm2, flower);
    return g;
  };
  const makeTrophy = () => {
    const g = new THREE.Group();
    const cup = [[0.012, 0.05], [0.014, 0.06], [0.03, 0.075], [0.04, 0.11], [0.042, 0.13], [0.038, 0.13], [0.036, 0.112], [0, 0.085]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(cup, 28), toon({ color: '#f0c04e', gloss: 1, side: THREE.DoubleSide })));
    g.add(box(0.05, 0.02, 0.05, toon({ color: '#3a2418' }), 0, 0.01, 0), box(0.014, 0.04, 0.014, gold, 0, 0.035, 0));
    return g;
  };
  const makeRouter = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.028, 0.09, 2, 0.006), toon({ color: '#e8dcc0', gloss: 0.4 })));
    for (const x of [-0.055, 0.055]) {
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 0.11, 8), toon({ color: '#2b3042' }));
      antenna.position.set(x, 0.065, -0.03);
      antenna.rotation.z = x > 0 ? -0.2 : 0.2;
      g.add(antenna);
    }
    ['#5dff8a', '#5dff8a', '#ffb03a', '#7fd4ff'].forEach((c, i) => led(c, -0.03 + i * 0.02, 0.002, 0.046, g));
    g.position.y = 0.014;
    return g;
  };
  const robot = new THREE.Group();
  {
    const metal = toon({ color: '#4fb6cf', gloss: 0.6, rim: 0.8 });
    const dark = toon({ color: '#2b3042' });
    robot.add(new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.08, 0.055, 2, 0.008), metal));
    const head = new THREE.Mesh(new RoundedBoxGeometry(0.066, 0.05, 0.052, 2, 0.008), metal);
    head.position.y = 0.072;
    robot.add(head, box(0.004, 0.03, 0.004, dark, 0, 0.11, 0), ball(0.008, toon({ color: '#ff5b36', gloss: 1 }), 0, 0.128, 0));
    led('#ffe36a', -0.014, 0.076, 0.027, robot);
    led('#ffe36a', 0.014, 0.076, 0.027, robot);
    robot.add(box(0.03, 0.004, 0.002, dark, 0, 0.058, 0.027));
    for (const sx of [-1, 1]) {
      robot.add(box(0.014, 0.05, 0.016, dark, sx * 0.046, -0.004, 0), box(0.02, 0.03, 0.03, dark, sx * 0.02, -0.055, 0));
    }
    robot.add(box(0.03, 0.02, 0.002, new THREE.MeshBasicMaterial({ color: '#5dff8a', toneMapped: false }), 0, 0.004, 0.0285));
  }

  const makeCase = (sign: 1 | -1): THREE.Group => {
    const g = new THREE.Group();
    const W = 0.56;
    const Hh = 1.02;
    const D = 0.24;
    g.add(box(W, Hh, 0.02, toon({ color: '#3f2414', rim: 0 }), 0, Hh / 2, -D / 2));
    g.add(box(0.03, Hh, D, caseWood, -W / 2, Hh / 2, 0), box(0.03, Hh, D, caseWood, W / 2, Hh / 2, 0));
    const levels = [0.07, 0.36, 0.65, 0.94];
    levels.forEach((y) => g.add(box(W + 0.03, 0.026, D + 0.02, caseWood, 0, y, 0)));
    const put = (item: THREE.Object3D, level: number, x: number, z = 0.02) => {
      item.position.x += x;
      item.position.y += levels[level] + 0.013;
      item.position.z += z;
      g.add(item);
    };
    if (sign === -1) {
      put(bookRow(6), 0, -0.24);
      put(makeCactus(), 0, 0.17);
      put(makeCrt(), 1, -0.1);
      put(bookRow(3), 1, 0.08);
      put(makeServer(), 2, -0.14);
      put(makeTrophy(), 2, 0.05);
      put(bookRow(3), 2, 0.12);
    } else {
      robot.position.set(0, 0.07, 0);
      put(robot, 0, -0.16, 0.04);
      put(bookRow(6), 0, -0.06);
      put(makeRouter(), 1, -0.14, 0.04);
      put(makeCactus(), 1, 0.03);
      put(bookRow(3), 1, 0.11);
      put(bookRow(5), 2, -0.24);
      put(makeServer(), 2, 0.14);
    }
    g.position.set(sign * 1.42, 0, -1.14);
    g.rotation.y = -sign * 0.42;
    scene.add(shadow(g));
    return g;
  };
  const caseLeft = makeCase(-1);
  const caseRight = makeCase(1);
  const robotY = robot.position.y;

  // A jar of bugs, safely caught. Bugs: under control.
  const bugJar = new THREE.Group();
  const jarGlass = new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.056, 0.006], [0.056, 0.1], [0.046, 0.112], [0.046, 0.122]].map(([x, y]) => new THREE.Vector2(x, y)), 40),
    glassMat('#eafcff', 0.26),
  );
  const jarLid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.016, 28), toon({ color: '#c8a23a', gloss: 0.9 }));
  jarLid.position.y = 0.128;
  for (let i = 0; i < 5; i++) {
    // Air holes: the bugs are contained, not mistreated.
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.004, 10), new THREE.MeshBasicMaterial({ color: '#2a1810' }));
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(Math.cos(i * 1.257) * 0.026, 0.1365, Math.sin(i * 1.257) * 0.026);
    bugJar.add(hole);
  }
  const jarTag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.07, 0.035),
    new THREE.MeshBasicMaterial({ map: colorTex(labelCanvas('BUGS', '#f4e8c8', '#a3261c')) }),
  );
  jarTag.position.set(0, 0.062, 0.0572);
  bugJar.add(jarGlass, jarLid, jarTag);
  const bugColors = ['#c8281e', '#2f8a3a', '#1f1a22', '#d8862a', '#3b62b8'];
  const bugs = bugColors.map((color, i) => {
    const bug = new THREE.Group();
    const shell = ball(0.0095, toon({ color, gloss: 0.9 }), 0, 0, 0, 1.25, 0.7, 0.9);
    const head = ball(0.005, toon({ color: '#16101a' }), 0.012, 0, 0);
    bug.add(shell, head);
    for (const side of [-1, 1]) {
      for (const dx of [-0.006, 0, 0.006]) {
        bug.add(box(0.0012, 0.0012, 0.009, new THREE.MeshBasicMaterial({ color: '#16101a' }), dx, -0.003, side * 0.009));
      }
    }
    // Each keeps to its own ring on the jar floor, so they never pile into one another or the glass.
    bug.userData = { phase: i * 1.3, speed: (i % 2 ? -1 : 1) * (0.5 + (i % 3) * 0.2), radius: [0.01, 0.021, 0.032, 0.021, 0.032][i] };
    bugJar.add(bug);
    return bug;
  });
  bugJar.position.set(0.2, 0, -0.56);
  scene.add(shadow(bugJar));
  jarGlass.castShadow = false;

  // A mechanical computer: gears, pistons and a combustion engine where the CPU should be.
  const engine = new THREE.Group();
  const copper = toon({ color: '#b5642a', gloss: 0.8 });
  const steel = toon({ color: '#6a7088', gloss: 0.7 });
  const gearGeo = (outer: number, teeth: number, depth = 0.01): THREE.ExtrudeGeometry => {
    const shape = new THREE.Shape();
    const steps = teeth * 4;
    for (let i = 0; i <= steps; i++) {
      const tooth = i % 4 < 2;
      const rad = tooth ? outer : outer * 0.8;
      const a = (i / steps) * Math.PI * 2;
      if (i === 0) shape.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else shape.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, outer * 0.22, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    return geo;
  };
  // An ordinary PC tower — except the side window shows gears where the fans should be,
  // and there is a small combustion engine bolted to the lid.
  const caseMat = toon({ color: '#343848', gloss: 0.35 });
  const caseDark = toon({ color: '#1c1e28', rim: 0 });
  const TOWER = { w: 0.32, h: 0.34, d: 0.16 };
  // The case is a real box with one side glazed: lid, floor, far side, both ends, and a near side
  // with the window cut out of it — so what you see through the glass has depth.
  const winW = 0.22;
  const winH = 0.24;
  const winX = -0.03;
  const winY = 0.175;
  const D2 = TOWER.d / 2;
  engine.add(
    box(TOWER.w, TOWER.h, 0.012, caseMat, 0, TOWER.h / 2, -D2 + 0.006),
    box(TOWER.w, 0.014, TOWER.d, caseMat, 0, TOWER.h - 0.007, 0),
    box(TOWER.w, 0.014, TOWER.d, caseMat, 0, 0.007, 0),
    box(0.014, TOWER.h, TOWER.d, caseMat, TOWER.w / 2 - 0.007, TOWER.h / 2, 0),
    box(0.014, TOWER.h, TOWER.d, caseMat, -TOWER.w / 2 + 0.007, TOWER.h / 2, 0),
    box(TOWER.w / 2 - (winX + winW / 2), TOWER.h, 0.01, caseMat, (TOWER.w / 2 + winX + winW / 2) / 2, TOWER.h / 2, D2 - 0.005),
    box(winX - winW / 2 + TOWER.w / 2, TOWER.h, 0.01, caseMat, (-TOWER.w / 2 + winX - winW / 2) / 2, TOWER.h / 2, D2 - 0.005),
    box(winW, TOWER.h - (winY + winH / 2), 0.01, caseMat, winX, (TOWER.h + winY + winH / 2) / 2, D2 - 0.005),
    box(winW, winY - winH / 2, 0.01, caseMat, winX, (winY - winH / 2) / 2, D2 - 0.005),
  );
  for (const [fx, fz] of [[-0.12, -0.05], [0.12, -0.05], [-0.12, 0.05], [0.12, 0.05]]) engine.add(box(0.03, 0.012, 0.03, caseDark, fx, -0.004, fz));

  // Inside, at the back: a riveted plate glowing with the heat of the works.
  const backZ = -D2 + 0.013;
  engine.add(box(TOWER.w - 0.03, TOWER.h - 0.03, 0.004, toon({ color: '#4a2c16', rim: 0 }), 0, TOWER.h / 2, backZ));
  const innerGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(winW + 0.04, winH + 0.04),
    new THREE.MeshBasicMaterial({ color: '#ff9a3c', transparent: true, opacity: 0.32, toneMapped: false, fog: false }),
  );
  innerGlow.position.set(winX, winY, backZ + 0.0025);
  engine.add(innerGlow);
  for (let ix = 0; ix < 6; ix++) {
    for (const iy of [0, 1]) engine.add(ball(0.004, brass, winX - 0.1 + ix * 0.04, winY + (iy ? 0.105 : -0.105), backZ + 0.004));
  }

  // Two trains of gears, one behind the other, each on its own axle…
  const gz = D2 - 0.034;
  const gzBack = -0.022;
  const gearA = new THREE.Mesh(gearGeo(0.058, 14, 0.01), brass);
  gearA.position.set(winX - 0.04, winY + 0.035, gz);
  const gearB = new THREE.Mesh(gearGeo(0.041, 10, 0.01), copper);
  gearB.position.set(winX + 0.052, winY - 0.012, gz);
  const gearC = new THREE.Mesh(gearGeo(0.029, 7, 0.01), steel);
  gearC.position.set(winX - 0.015, winY - 0.075, gz);
  const flywheel = new THREE.Mesh(gearGeo(0.024, 6, 0.01), brass);
  flywheel.position.set(winX + 0.068, winY + 0.075, gz);
  const pcGearD = new THREE.Mesh(gearGeo(0.072, 18, 0.01), steel);
  pcGearD.position.set(winX + 0.028, winY - 0.03, gzBack);
  const pcGearE = new THREE.Mesh(gearGeo(0.038, 9, 0.01), brass);
  pcGearE.position.set(winX - 0.078, winY - 0.072, gzBack);
  const pcGearF = new THREE.Mesh(gearGeo(0.046, 11, 0.01), copper);
  pcGearF.position.set(winX - 0.062, winY + 0.068, gzBack);
  for (const g of [gearA, gearB, gearC, flywheel, pcGearD, pcGearE, pcGearF]) {
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, g.position.z - backZ + 0.012, 10), steel);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(g.position.x, g.position.y, (g.position.z + backZ) / 2 + 0.006);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.006, 12), brass);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(g.position.x, g.position.y, g.position.z + 0.008);
    engine.add(axle, hub);
  }
  engine.add(pcGearD, pcGearE, pcGearF);

  // …a glowing boiler in the corner, banded in copper, piped up to the exhaust on the lid…
  const pcBoiler = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 18), new THREE.MeshBasicMaterial({ color: '#ffb04a', toneMapped: false, fog: false }));
  pcBoiler.position.set(winX + 0.074, winY - 0.082, -0.012);
  for (const tilt of [0, Math.PI / 2]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0035, 8, 24), copper);
    band.position.copy(pcBoiler.position);
    band.rotation.y = tilt;
    engine.add(band);
  }
  const pipe = (points: number[][], radius = 0.0058) => new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))), 40, radius, 8),
    copper,
  );
  engine.add(
    pcBoiler,
    pipe([[winX + 0.074, winY - 0.052, -0.012], [winX + 0.09, winY + 0.02, -0.05], [winX + 0.03, winY + 0.108, -0.055], [winX - 0.07, winY + 0.112, -0.05], [-0.115, TOWER.h - 0.012, -0.03]]),
    pipe([[winX + 0.046, winY - 0.092, -0.012], [winX - 0.02, winY - 0.108, -0.05], [winX - 0.1, winY - 0.1, -0.052], [winX - 0.102, winY + 0.0, -0.055]], 0.0045),
    // a valve wheel on the pipe, and a row of little lamps
    ball(0.0075, brass, winX + 0.09, winY + 0.02, -0.05),
  );
  const pcValve = new THREE.Mesh(gearGeo(0.015, 8, 0.004), toon({ color: '#c8281e', gloss: 0.5 }));
  pcValve.position.set(winX + 0.09, winY + 0.02, -0.04);
  engine.add(pcValve);
  for (let i = 0; i < 4; i++) led(i % 2 ? '#ffb03a' : '#5dff8a', winX - 0.096 + i * 0.016, winY - 0.112, D2 - 0.02, engine);

  // …and a pane of glass over it all, in a brass frame.
  const pcGlass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat('#cfe8ff', 0.13));
  pcGlass.position.set(winX, winY, D2 - 0.001);
  pcGlass.castShadow = false;
  const pcGlint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.03, winH * 1.5),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false, fog: false }),
  );
  pcGlint.material.userData.outlineParameters = { visible: false };
  pcGlint.position.set(winX - 0.04, winY, D2);
  pcGlint.rotation.z = -0.5;
  pcGlint.scale.y = 0.62;
  engine.add(pcGlass, pcGlint);
  for (const [bx, by, bw, bh] of [[winX, winY + winH / 2, winW + 0.012, 0.008], [winX, winY - winH / 2, winW + 0.012, 0.008], [winX - winW / 2, winY, 0.008, winH], [winX + winW / 2, winY, 0.008, winH]]) {
    engine.add(box(bw, bh, 0.008, brass, bx, by, TOWER.d / 2 + 0.003));
  }
  // Front panel (the narrow end): power button, drive bay, ports, activity light.
  const fx0 = TOWER.w / 2 + 0.001;
  const powerButton = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 16), brass);
  powerButton.rotation.z = Math.PI / 2;
  powerButton.position.set(fx0, 0.3, 0);
  engine.add(powerButton, box(0.004, 0.03, 0.11, caseDark, fx0, 0.245, 0), box(0.005, 0.004, 0.08, brass, fx0 + 0.001, 0.245, 0));
  for (const pz of [-0.03, 0, 0.03]) engine.add(box(0.004, 0.008, 0.018, caseDark, fx0, 0.2, pz));
  for (let i = 0; i < 6; i++) engine.add(box(0.004, 0.004, 0.11, caseDark, fx0, 0.15 - i * 0.016, 0));
  led('#5dff8a', fx0 + 0.001, 0.3, 0.035, engine);
  led('#ffb03a', fx0 + 0.001, 0.3, -0.035, engine);
  // Pressure gauge where the logo badge would be.
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), new THREE.MeshBasicMaterial({ color: '#f4e8c8' }));
  dial.position.set(0.125, 0.3, TOWER.d / 2 + 0.002);
  const dialRing = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0035, 8, 20), brass);
  dialRing.position.copy(dial.position);
  const needle = new THREE.Group();
  needle.add(box(0.002, 0.013, 0.001, new THREE.MeshBasicMaterial({ color: '#c8281e' }), 0, 0.006, 0));
  needle.position.set(0.125, 0.3, TOWER.d / 2 + 0.0035);

  // The engine on the lid: block, three cylinders with their pistons, an exhaust stack.
  engine.add(box(0.16, 0.024, 0.1, steel, 0.02, TOWER.h + 0.012, 0));
  const PISTON_Y = TOWER.h + 0.075;
  const pistons = [-0.03, 0.02, 0.07].map((x, i) => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.046, 16), copper);
    sleeve.position.set(x, TOWER.h + 0.047, 0);
    const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 10), steel);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.009, 12), brass);
    cap.position.y = 0.03;
    const piston = new THREE.Group();
    piston.add(pistonRod, cap);
    piston.position.set(x, PISTON_Y, 0);
    piston.userData.phase = (i / 3) * Math.PI * 2;
    engine.add(sleeve, piston);
    return piston;
  });
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.13, 12), steel);
  exhaust.position.set(-0.115, TOWER.h + 0.06, -0.03);
  exhaust.rotation.z = 0.12;
  engine.add(dial, dialRing, needle, gearA, gearB, gearC, flywheel, exhaust);
  engine.scale.setScalar(0.6);
  engine.position.set(-0.84, 0.006, -0.62);
  engine.rotation.y = 0.34;
  scene.add(shadow(engine));
  innerGlow.castShadow = false;
  const engineHome = engine.position.clone();
  const smokeTex = colorTex(glowCanvas('rgba(235,235,245,0.75)', 'rgba(200,200,215,0.28)'));
  const puffs = [0, 1, 2].map((i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
    sp.userData.phase = i / 3;
    scene.add(sp);
    return sp;
  });

  // The CV itself, as a sealed scroll at your elbow: click it to take a copy.
  const cvScroll = new THREE.Group();
  const scrollPaper = toon({ color: '#f3e2b4', emissive: '#6a4a14', emissiveIntensity: 0.35 });
  const scrollRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.26, 28), scrollPaper);
  scrollRoll.rotation.z = Math.PI / 2;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.31, 12), darkWood);
  rod.rotation.z = Math.PI / 2;
  cvScroll.add(scrollRoll, rod, ball(0.012, gold, -0.16, 0, 0), ball(0.012, gold, 0.16, 0, 0));
  const scrollRibbon = new THREE.Mesh(new THREE.TorusGeometry(0.0285, 0.006, 10, 28), toon({ color: '#c8281e', gloss: 0.5 }));
  scrollRibbon.rotation.y = Math.PI / 2;
  const waxSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.008, 20), toon({ color: '#b01c14', gloss: 0.9 }));
  waxSeal.position.set(0, 0.028, 0.004);
  const scrollTag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.084, 0.032),
    new THREE.MeshBasicMaterial({ map: colorTex(labelCanvas('CV.PDF', '#f4e8c8', '#a3261c', 256, 96)), side: THREE.DoubleSide, fog: false, toneMapped: false }),
  );
  scrollTag.position.set(-0.07, 0.024, 0.028);
  scrollTag.rotation.x = -0.95;
  cvScroll.add(scrollRibbon, waxSeal, scrollTag);
  cvScroll.position.set(0.25, 0.027, 0.1);
  cvScroll.rotation.y = -0.22;
  const scrollY = cvScroll.position.y;
  scene.add(shadow(cvScroll));

  // What comes out of the book when it opens: a column of light.
  const pillar = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(pillarCanvas()), color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false,
    // Drawn over everything: where the page or the standing cover cut into it, the glow got straight edges.
    depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  pillar.renderOrder = 6;
  pillar.center.set(0.5, 0);
  pillar.position.set(book.position.x + 0.03, 0.02, book.position.z);
  scene.add(pillar);
  const blast = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255, 250, 225, 1)', 'rgba(255, 210, 120, 0.5)')),
    transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  blast.renderOrder = 6;
  blast.position.set(book.position.x + 0.03, 0.1, book.position.z);
  scene.add(blast);
  const bookHome = book.position.clone();
  const bookTurn = book.rotation.y;

  /* ----- the book glows while it waits to be opened ----- */
  const bookGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.84),
    new THREE.MeshBasicMaterial({
      map: colorTex(glowCanvas('rgba(255, 226, 150, 0.95)', 'rgba(255, 190, 80, 0.4)')),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0.5,
    }),
  );
  bookGlow.rotation.x = -Math.PI / 2;
  bookGlow.position.set(book.position.x, 0.003, book.position.z);
  scene.add(bookGlow);
  const bookLight = new THREE.PointLight('#ffd98a', 0.16, 0.9, 1);
  bookLight.position.set(book.position.x, 0.28, book.position.z + 0.05);
  scene.add(bookLight);
  const twinkleTex = colorTex(glowCanvas('rgba(255, 250, 220, 1)', 'rgba(255, 215, 120, 0.45)'));
  const twinkles = Array.from({ length: 9 }, (_, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: twinkleTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
    }));
    sp.userData.i = i;
    scene.add(sp);
    return sp;
  });

  /* ----- light ----- */
  const hemi = new THREE.HemisphereLight('#a8a4ee', '#7a4a3a', 1.0);
  scene.add(hemi);
  const moon = new THREE.SpotLight('#8aa2ff', 1.1, 7, 0.6, 1, 1);
  moon.position.set(-1.5, 1.5, -1.0);
  moon.target.position.set(0.05, 0, 0);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.bias = -0.002;
  moon.shadow.radius = 5;
  scene.add(moon, moon.target);

  // A soft warm fill from where you sit, so shadows read as colour rather than black.
  const fill = new THREE.DirectionalLight('#ffd2a8', 0.5);
  fill.position.set(0.4, 0.9, 1.4);
  scene.add(fill);

  // Moonlight falling through the window onto the table.
  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  beamGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2));
  beamGeo.setIndex([0, 2, 1, 2, 3, 1]);
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
    map: colorTex(beamCanvas()), color: '#9db4ff', transparent: true, opacity: 0.5, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false,
  }));
  scene.add(beam);
  const placeBeam = () => {
    const wx = windowGroup.position.x;
    const p = beamGeo.attributes.position as THREE.BufferAttribute;
    p.setXYZ(0, wx - 0.17, 0.8, -1.27);
    p.setXYZ(1, wx + 0.17, 0.8, -1.27);
    p.setXYZ(2, wx + 0.1, 0.0, -0.1);
    p.setXYZ(3, wx + 0.75, 0.0, -0.25);
    p.needsUpdate = true;
    beamGeo.computeBoundingSphere();
  };

  // Halos around everything that glows.
  const aura = (color: string, size: number, parent: THREE.Object3D, y: number) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: colorTex(glowCanvas('rgba(255,255,255,0.55)', 'rgba(255,255,255,0.16)')),
      color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
    }));
    sp.scale.setScalar(size);
    sp.position.y = y;
    parent.add(sp);
    return sp;
  };
  const cauldronAura = aura('#7dff5a', 0.3, cauldron, 0.14);
  const wandAura = aura('#ffd45a', 0.12, wand, 0);
  wandAura.position.x = 0.135;
  const scrollAura = aura('#ffd45a', 0.3, cvScroll, 0.02);
  const laptopAura = aura('#7fd4ff', 0.36, lid, 0.09);
  const orbAura = aura('#6ab8ff', 0.2, orbGroup, 0.075);
  orbAura.position.x = -0.22;
  const crystalAura = aura('#6fe8ff', 0.2, crystals, 0.05);
  const lanternAura = aura('#ffb050', 0.34, lantern, -0.06);
  const potionAura = aura('#5dff8a', 0.2, potion, 0.035);

  /* ----- dust in the candle light ----- */
  const MOTES = 26;
  const moteHome = new Float32Array(MOTES * 3);
  const moteRand = seeded(41);
  for (let i = 0; i < MOTES; i++) {
    moteHome.set([(moteRand() - 0.5) * 1.6, 0.05 + moteRand() * 0.7, -0.9 + moteRand() * 1.4], i * 3);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(moteHome.slice(), 3));
  moteGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MOTES * 3).fill(1), 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    map: colorTex(glowCanvas('rgba(255, 236, 190, 1)', 'rgba(255, 200, 120, 0.35)')),
    size: 0.02,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: '#d9ff8f',
    fog: false,
  }));
  scene.add(motes);

  scene.traverse((o) => {
    const mat = (o as THREE.Mesh).material;
    (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => {
      if ((m as THREE.MeshBasicMaterial).isMeshBasicMaterial || m.transparent) m.userData.outlineParameters = { visible: false };
    });
  });

  /* ----- things on the table you can poke ----- */
  interface Toy { id: string; root: THREE.Object3D; poke(): void; bounce: boolean; hoverK: number; base: number; anchor: THREE.Object3D }
  const toys: Toy[] = [];
  /** `anchor` is the part the label, the halo and the speech bubble attach to, when it is not the whole thing. */
  const addToy = (id: string, root: THREE.Object3D, poke: () => void, bounce = true, anchor?: THREE.Object3D) => {
    toys.push({ id, root, poke, bounce, hoverK: 0, base: root.scale.x, anchor: anchor ?? root });
  };
  let now = 0;
  let candleLit = true;
  let litK = 1;
  let smokeAt = -10;
  let tomatoAt = -10;
  let groveAt = -10;
  let potionAt = -10;
  let quillAt = -10;
  let starAt = -10;
  let brew = 0;
  const BREWS = ['#2bff78', '#b46bff', '#3fc8ff', '#ffb03a', '#ff5fa2'];
  const tomatoY = tomato.position.y;
  const mushrooms = grove.children.slice(1);

  const smoke = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(230,230,240,0.7)', 'rgba(200,200,215,0.25)')), transparent: true, depthWrite: false, opacity: 0, fog: false,
  }));
  scene.add(smoke);

  const shootingStar = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255,255,255,1)', 'rgba(200,220,255,0.5)')),
    transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, rotation: -0.5,
  }));
  shootingStar.scale.set(0.09, 0.012, 1);
  shootingStar.position.z = 0.012;
  windowGroup.add(shootingStar);

  addToy('candle', candle, () => { candleLit = !candleLit; if (!candleLit) smokeAt = now; }, false);
  addToy('tomato', tomato, () => { tomatoAt = now; });
  addToy('grove', grove, () => { groveAt = now; }, false);
  addToy('writing', writing, () => { quillAt = now; });
  addToy('windowGroup', windowGroup, () => { starAt = now; }, false);
  addToy('potion', potion, () => {
    potionAt = now;
    brew = (brew + 1) % BREWS.length;
    liquidMat.emissive.set(BREWS[brew]);
    liquidMat.color.set(BREWS[brew]).multiplyScalar(0.75);
    potionLight.color.set(BREWS[brew]);
    steam.forEach((sp) => sp.material.color.set(BREWS[brew]).lerp(new THREE.Color('#ffffff'), 0.4));
  });

  let chestOpen = false;
  let chestK = 0;
  let lanternOn = true;
  let lanternK = 1;
  let hatAt = -10;
  let orbAt = -10;
  let orbHue = 0;
  const ORBS = ['#3f9dff', '#ff6ad5', '#7dff8a', '#ffc24a'];
  let catAt = -10;
  let cauldronAt = -10;
  let wandAt = -10;
  addToy('cat', cat, () => { catAt = now; }, false);
  addToy('cauldron', cauldron, () => { cauldronAt = now; }, false);
  addToy('wand', wand, () => { wandAt = now; });
  let robotAt = -10;
  let crtIsOn = true;
  addToy('robot', robot, () => { robotAt = now; });
  addToy('caseLeft', caseLeft, () => { crtIsOn = !crtIsOn; crtScreen.color.set(crtIsOn ? '#ffffff' : '#1a2a1e'); }, false);
  addToy('caseRight', caseRight, () => { robotAt = now; }, false);
  let engineAt = -10;
  let engineAngle = 0;
  let lastT = 0;
  addToy('engine', engine, () => { engineAt = now; }, false);
  let scrollAt = -10;
  addToy('cvScroll', cvScroll, () => { scrollAt = now; });
  let sips = 0;
  let coffeeK = 1;
  let mugAt = -10;
  addToy('mug', mug, () => { sips = (sips + 1) % 5; mugAt = now; });
  let bugsAt = -10;
  addToy('bugJar', bugJar, () => { bugsAt = now; }, false);
  let duckAt = -10;
  let keysAt = -10;
  let screenMode = 0;
  const SCREEN_GLOW = ['#7fd4ff', '#8dffa0', '#ff8a8a'];
  addToy('duck', duck, () => { duckAt = now; });
  addToy('keyboard', keyboard, () => { keysAt = now; }, false);
  addToy('laptop', laptop, () => {
    screenMode = (screenMode + 1) % screens.length;
    screenMat.map = screens[screenMode];
    screenLight.color.set(SCREEN_GLOW[screenMode]);
    laptopAura.material.color.set(SCREEN_GLOW[screenMode]);
  }, false);
  addToy('chest', chest, () => { chestOpen = !chestOpen; }, false);
  addToy('lantern', lantern, () => { lanternOn = !lanternOn; }, false);
  // The portrait swings on its nail when touched (and the scene hangs a new pose in the frame).
  let portraitAt = -10;
  addToy('portrait', portrait, () => { portraitAt = now; }, false);
  addToy('hat', hat, () => { hatAt = now; });
  addToy('crystals', crystals, () => { orbAt = now; });
  addToy('orbGroup', orbGroup, () => {
    orbAt = now;
    orbHue = (orbHue + 1) % ORBS.length;
    orbMat.emissive.set(ORBS[orbHue]);
    orbMat.color.set(ORBS[orbHue]).lerp(new THREE.Color('#ffffff'), 0.45);
    orbLight.color.set(ORBS[orbHue]);
  }, false);

  /* ----- lights out: a pull cord that shuts the window and leaves only what glows ----- */
  const shutterMat = toon({ map: colorTex(wood, [0.5, 0.7]), color: '#8a6a4a', side: THREE.DoubleSide, rim: 0 });
  const shutters = [-1, 1].map((sign) => {
    const w = 0.42;
    const rectH = 0.28;
    const half = new THREE.Shape();
    half.moveTo(-w / 2, 0);
    half.lineTo(0, 0);
    half.lineTo(0, rectH + w / 2);
    half.absarc(0, rectH, w / 2, Math.PI / 2, Math.PI, false);
    half.lineTo(-w / 2, 0);
    const geo = new THREE.ShapeGeometry(half, 24);
    // Hinged on the outer edge, so it can fold shut from there.
    geo.translate(w / 2, 0, 0);
    const leafMesh = new THREE.Mesh(geo, shutterMat);
    leafMesh.position.set(sign * (-w / 2), 0, 0.009);
    leafMesh.visible = false;
    windowGroup.add(leafMesh);
    return { mesh: leafMesh, sign };
  });

  const pullCord = new THREE.Group();
  const cordPull = new THREE.Group();
  const cordSwing = new THREE.Group();
  const cordString = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0036, 1, 6), toon({ color: '#e9d7ae', rim: 0, emissive: '#6a5020', emissiveIntensity: 0.6 }));
  cordString.position.y = 0.5;
  const cordBead = new THREE.Mesh(new THREE.SphereGeometry(0.026, 24, 16), toon({ color: '#ffd45a', emissive: '#ffb020', emissiveIntensity: 0.9, gloss: 1 }));
  const cordTassel = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.075, 16), toon({ color: '#e0321e', emissive: '#7a1408', emissiveIntensity: 0.7, gloss: 0.3 }));
  cordTassel.position.y = -0.055;
  // A soft pulsing glow, so the cord is the first thing the eye finds — in the dark most of all.
  const cordAura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255, 236, 170, 0.9)', 'rgba(255, 190, 80, 0.3)')),
    transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  cordAura.scale.setScalar(0.22);
  // The string is too thin to hit: an unseen handle round the bead takes the pointer.
  const cordGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.3, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  cordGrip.material.userData.outlineParameters = { visible: false };
  cordGrip.position.y = 0.02;
  cordPull.add(cordString, cordBead, cordTassel, cordAura);
  // The grip stays put while the bead bounces, so the pointer never loses it.
  pullCord.add(cordGrip);
  cordPull.position.y = -1;
  cordSwing.position.y = 1;
  cordSwing.add(cordPull);
  pullCord.add(cordSwing);
  pullCord.scale.setScalar(0.7);
  scene.add(pullCord);
  const keyGlow = new THREE.PointLight('#7a5cff', 0, 0.9, 1);
  keyGlow.position.y = 0.07;
  keyboard.add(keyGlow);
  const keyAura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255,255,255,0.5)', 'rgba(255,255,255,0.14)')),
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  keyAura.scale.set(0.62, 0.3, 1);
  keyAura.position.y = 0.03;
  keyboard.add(keyAura);
  // Fur, hair and paper carry a little self-light by day so they read as warm. They are not lamps:
  // with the lights out it has to go, or they shine in the dark with nothing lighting them.
  const pretend = [ginger, hairMat, scrollPaper].map((mat) => ({ mat, base: mat.emissiveIntensity }));
  // What really glows gets a real light of its own.
  const scrollLight = new THREE.PointLight('#ffd45a', 0.1, 0.8, 1);
  scrollLight.position.y = 0.06;
  cvScroll.add(scrollLight);
  const cordLight = new THREE.PointLight('#ffc040', 0.1, 0.9, 1);
  cordBead.add(cordLight);
  const fogDay = new THREE.Color('#0d0914');
  const WHITE = new THREE.Color('#ffffff');
  let darkOn = false;
  let darkK = 0;
  let darkT = 0;
  let cordAt = -10;
  // The cord hangs on a spring: `cordAng` is how far the bead is from rest (down is negative), `cordVel` its speed.
  let cordAng = 0;
  let cordVel = 0;
  let cordT = 0;
  const catHeadAt = new THREE.Vector3();
  addToy('cord', pullCord, () => { darkOn = !darkOn; cordAt = now; cordVel -= 1.9; tomatoAt = now; hoodPuffAt = now; }, false, cordBead);

  // Pictures and labels are flat colour; in the dark they must fade like everything that is not a lamp.
  const papers: { mat: THREE.MeshBasicMaterial; base: THREE.Color }[] = [];
  scene.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
    // …except the label on the CV scroll: that is the one thing in the room that must always be readable.
    if (mat && mat !== scrollTag.material && (mat as THREE.Material).type === 'MeshBasicMaterial' && mat.toneMapped && !mat.transparent && !papers.some((x) => x.mat === mat)) {
      papers.push({ mat, base: mat.color.clone() });
    }
  });

  /* ----- lights out, a bug comes out: catch it and it becomes a card on the board and a guest of the jar ----- */
  const rbBug = new THREE.Group();
  const rbBody = new THREE.Group();
  rbBody.add(
    ball(0.0095, toon({ color: '#ff4a2a', emissive: '#ff3b1a', emissiveIntensity: 1.1, gloss: 0.9 }), 0, 0, 0, 1.25, 0.7, 0.9),
    ball(0.005, toon({ color: '#16101a' }), 0.012, 0, 0),
  );
  for (const side of [-1, 1]) {
    for (const dx of [-0.006, 0, 0.006]) rbBody.add(box(0.0012, 0.0012, 0.009, new THREE.MeshBasicMaterial({ color: '#16101a' }), dx, -0.003, side * 0.009));
  }
  rbBody.scale.setScalar(1.9);
  const rbAura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255, 190, 150, 0.9)', 'rgba(255, 90, 50, 0.3)')),
    transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  rbAura.scale.setScalar(0.11);
  // It is small and quick: an unseen ball round it is what the pointer catches.
  const rbGrip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  rbGrip.material.userData.outlineParameters = { visible: false };
  // A sign that hops along above it, so nobody has to guess what the red dot is for.
  const rbHintCanvas = document.createElement('canvas');
  rbHintCanvas.width = 320;
  rbHintCanvas.height = 150;
  const rbHintTex = colorTex(rbHintCanvas);
  const paintBugHint = (text: string) => {
    const g = rbHintCanvas.getContext('2d')!;
    g.clearRect(0, 0, 320, 150);
    g.lineJoin = 'round';
    g.lineWidth = 8;
    g.strokeStyle = '#2a1810';
    g.fillStyle = '#ffd45a';
    // A pill with a pointer underneath.
    g.beginPath();
    g.roundRect(10, 8, 300, 96, 48);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(136, 102);
    g.lineTo(160, 140);
    g.lineTo(184, 102);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillRect(140, 92, 40, 14);
    g.fillStyle = '#2a1810';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = 58;
    do { g.font = `700 ${size}px Lora, Georgia, serif`; size -= 2; } while (g.measureText(text).width > 262 && size > 24);
    g.fillText(text, 160, 58);
    rbHintTex.needsUpdate = true;
  };
  paintBugHint('!');
  const rbHint = new THREE.Sprite(new THREE.SpriteMaterial({ map: rbHintTex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, fog: false }));
  rbHint.renderOrder = 8;
  rbHint.center.set(0.5, 0);
  rbHint.scale.set(0.115, 0.054, 1);
  rbBug.add(rbBody, rbAura, rbGrip, rbHint);
  const RB_AWAY = new THREE.Vector3(0, -40, 0);
  rbBug.position.copy(RB_AWAY);
  scene.add(rbBug);
  // The ticket it turns into: a red card that flies from the jar to the board.
  const rbCard = new THREE.Mesh(
    new THREE.PlaneGeometry(0.075, 0.05),
    new THREE.MeshBasicMaterial({ color: '#ff6a5a', side: THREE.DoubleSide, transparent: true, toneMapped: false, fog: false }),
  );
  rbCard.material.userData.outlineParameters = { visible: false };
  const rbCardAura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255, 220, 200, 0.9)', 'rgba(255, 110, 80, 0.35)')),
    transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  rbCardAura.scale.setScalar(0.2);
  rbCard.add(rbCardAura);
  rbCard.visible = false;
  scene.add(rbCard);
  const rbBoardAt = new THREE.Vector3();
  const RB_TO_JAR = 2.1;
  const RB_CARD = 1.6;
  /** hidden → run → caught (carried to the jar) → card (the ticket flies to the board) → hidden */
  const RB_GLOW = 3.8;
  const rbSlot = new THREE.Vector3();
  /** Where on the board the next card goes, matching the slots drawn by kanbanCanvas. */
  const RB_SLOTS = [[0, 3], [1, 2], [1, 3]];
  let rbState: 'hidden' | 'run' | 'caught' | 'card' | 'glow' = 'hidden';
  let rbNextAt = 0;
  let rbT0 = 0;
  let rbCaught = 0;
  let rbPauseUntil = 0;
  let boardFlashAt = -10;
  const rbGoal = new THREE.Vector3();
  const rbFrom = new THREE.Vector3();
  const rbJar = new THREE.Vector3();
  /** Set by layout(): an upright screen cuts the keyboard's end of the table off. */
  let rbTall = false;
  /** The clear strip of table in front of the keyboard, which the camera can see; on an upright screen, the one in front of the book. */
  const rbPick = (v: THREE.Vector3) => (rbTall
    ? v.set(-0.24 + Math.random() * 0.46, 0.012, 0.17 + Math.random() * 0.09)
    : v.set(-0.62 + Math.random() * 0.48, 0.012, 0.06 + Math.random() * 0.08));
  addToy('bug', rbBug, () => {
    if (rbState !== 'run') return;
    rbState = 'caught';
    rbT0 = now;
    rbFrom.copy(rbBug.position);
  }, false);

  /* ----- now and then the room does something by itself ----- */
  // A letter that blows in through the window, tumbles about the room and settles on the table.
  const mailEnv = new THREE.Group();
  const mailPaper = toon({ color: '#f6ead0', emissive: '#6a4a14', emissiveIntensity: 0.35 });
  pretend.push({ mat: mailPaper, base: mailPaper.emissiveIntensity });
  mailEnv.add(new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.005, 0.088, 2, 0.002), mailPaper));
  for (const sx of [-1, 1]) {
    const fold = box(0.078, 0.0012, 0.003, toon({ color: '#b89a60', rim: 0 }), sx * 0.032, 0.0031, -0.012);
    fold.rotation.y = sx * 0.58;
    mailEnv.add(fold);
  }
  const mailSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.014, 0.006, 18), toon({ color: '#b01c14', gloss: 0.9 }));
  mailSeal.position.set(0, 0.005, 0.008);
  const mailAura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255, 236, 170, 0.8)', 'rgba(255, 200, 90, 0.25)')),
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  mailAura.scale.setScalar(0.3);
  mailEnv.add(mailSeal, mailAura);
  const MAIL_AWAY = new THREE.Vector3(0, -40, 0);
  const MAIL_REST = new THREE.Vector3(-0.28, 0.012, 0.0);
  mailEnv.position.copy(MAIL_AWAY);
  scene.add(shadow(mailEnv));
  const mailPath = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()]);
  let mailState: 'idle' | 'fly' | 'rest' = 'idle';
  let mailT0 = 0;
  let mailSpin = 0;
  let mailPrevT = 0;
  let sashK = 0;
  let knockT0 = -10;
  /** No new visitor before this moment: one thing at a time. */
  let evNext = 0;
  /** Where the cat and the hero are looking, and how much (0–1). */
  const gazeAt = new THREE.Vector3();
  let gazeK = 0;
  let gazeUntil = -1;
  const heroAt = new THREE.Vector3();
  const heroLook = new THREE.Vector3();
  const heroSpot = new THREE.Vector3();
  let heroFollow = 0;
  let heroYawRest = 0.35;
  let hoodPuffAt = -10;
  let heroDark = false;
  const hoodPuff = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(210, 200, 235, 0.95)', 'rgba(120, 105, 160, 0.55)')), transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false, fog: false,
  }));
  hoodPuff.renderOrder = 7;
  scene.add(hoodPuff);
  const catLook = new THREE.Vector3();
  const catSpot = new THREE.Vector3();
  let catFollow = 0;
  const startMail = () => {
    const wx = windowGroup.position.x;
    // Through the opened left pane — from the owl's beak, if it was the owl that brought it.
    if (mailFromOwl) owl.getWorldPosition(mailFrom); else mailFrom.set(wx - 0.1, 0.72, -1.27);
    mailPath.points = [
      // Kept low enough to stay inside the picture the whole way round.
      mailFrom.clone(), new THREE.Vector3(wx + 0.02, 0.72, -1.05), new THREE.Vector3(wx + 0.3, 0.7, -0.82), new THREE.Vector3(0.42, 0.6, -0.6),
      new THREE.Vector3(0.48, 0.42, -0.22), new THREE.Vector3(0.04, 0.4, 0.02), new THREE.Vector3(-0.36, 0.3, -0.14),
      // The last stretch is a glide: out past its place, back again, and down flat.
      new THREE.Vector3(-0.2, 0.15, 0.05), new THREE.Vector3(-0.36, 0.085, -0.03), new THREE.Vector3(-0.24, 0.035, 0.012), MAIL_REST.clone(),
    ];
    mailState = 'fly';
    mailT0 = now;
    mailSpin = 0;
    opts.onEvent?.(mailFromOwl ? 'mail-owl' : 'mail');
    mailFromOwl = false;
  };
  // The post owl: it lives beyond the glass, so it is a painted card between the sky and the bars.
  const owlWithLetter = colorTex(owlCanvas(true));
  const owlBare = colorTex(owlCanvas(false));
  const owl = new THREE.Mesh(
    new THREE.PlaneGeometry(0.33, 0.22),
    new THREE.MeshBasicMaterial({ map: owlWithLetter, transparent: true, depthWrite: false, toneMapped: false, fog: false }),
  );
  owl.material.userData.outlineParameters = { visible: false };
  owl.visible = false;
  owl.position.z = 0.0075;
  windowGroup.add(owl);
  let owlT0 = -10;
  /** 0 away · 1 flying in · 2 against the glass · 3 back up at the opened pane · 4 letter thrown, watching · 5 leaving */
  let owlStage = 0;
  let mailFromOwl = false;
  const mailFrom = new THREE.Vector3();
  let bookNudgeAt = -1;
  let bookNudgeT0 = -10;
  const startOwl = () => {
    owlT0 = now;
    owlStage = 1;
    owl.material.map = owlWithLetter;
  };
  let autoNext = -1;
  const callVisitor = (kind?: 'owl' | 'mail' | 'knock') => {
    if (locked || now < evNext || mailState === 'fly' || owlStage > 0) return;
    // A letter needs an open window and a clear table; otherwise it has to be a knock.
    const letterCan = mailState === 'idle' && !darkOn && !opts.reducedMotion;
    const dice = Math.random();
    const pick = kind ?? (dice < 0.35 ? 'owl' : dice < 0.68 ? 'mail' : 'knock');
    if (letterCan && pick === 'owl') { evNext = now + 10; startOwl(); } else if (letterCan && pick === 'mail') { evNext = now + 7; startMail(); } else { evNext = now + 4.5; startKnock(); }
  };
  const startKnock = () => {
    knockT0 = now;
    // The door is out of the picture, to your left.
    gazeAt.set(-2.4, 0.45, 0.5);
    gazeUntil = now + 4.2;
    opts.onEvent?.('knock');
  };
  addToy('mail', mailEnv, () => {
    if (mailState !== 'rest') return;
    mailState = 'idle';
    mailEnv.position.copy(MAIL_AWAY);
  }, false);

  // One golden halo that sits behind whatever the pointer is over.
  const hoverHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: colorTex(glowCanvas('rgba(255, 236, 170, 0.5)', 'rgba(255, 200, 90, 0.18)')),
    transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  }));
  hoverHalo.renderOrder = -1;
  scene.add(hoverHalo);
  // …and, for things that stand on the table, a thin gold circle drawn on the wood around them.
  const hoverRing = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: colorTex(ringCanvas()), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
    }),
  );
  hoverRing.rotation.x = -Math.PI / 2;
  scene.add(hoverRing);
  let ringOn = false;
  let haloK = 0;
  const hoverBox = new THREE.Box3();
  const hoverSize = new THREE.Vector3();
  const hoverTop = new THREE.Vector3();

  /* ----- camera rig ----- */
  const camHome = new THREE.Vector3();
  const lookHome = new THREE.Vector3();
  const camRead = new THREE.Vector3(-0.02, 0.52, 0.2);
  const lookRead = new THREE.Vector3(-0.02, 0.02, -0.1);
  const camFar = new THREE.Vector3();
  const lookFar = new THREE.Vector3();
  let introK = opts.reducedMotion ? 1 : 0;
  let introTween: { start: number; dur: number; done: () => void } | null = null;
  const camNow = new THREE.Vector3();
  const lookNow = new THREE.Vector3();
  const pointer = new THREE.Vector2();
  const sway = new THREE.Vector2();

  const layout = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    rbTall = aspect < 0.8;
    if (aspect < 0.8) {
      // Portrait: stand further back so the whole table fits between the edges.
      camera.fov = 66;
      camHome.set(0, 0.62, 1.14);
      lookHome.set(0, 0.2, -0.4);
    } else {
      camera.fov = aspect < 1.3 ? 58 : 52;
      camHome.set(0, 0.36, 0.66);
      lookHome.set(0, 0.16, -0.4);
    }
    camera.updateProjectionMatrix();
    // Keep the window and the shelf inside the picture on narrow screens.
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect * (camHome.z + 1.3);
    windowGroup.position.x = -Math.min(0.66, Math.max(0.22, half - 0.34));
    placeBeam();
    hangBunting(windowGroup.position.x + 0.36, Math.max(windowGroup.position.x + 1.2, Math.min(1.45, half)));
    shelf.visible = false;
    const corner = Math.min(1.42, half - 0.12);
    caseLeft.position.x = -corner;
    caseRight.position.x = corner;
    caseLeft.visible = caseRight.visible = half > 1.2;
    // Along the wall, left to right: window, portrait, curio shelf. Each takes its place
    // only if there is room, so nothing is ever drawn across its neighbour.
    const windowRight = windowGroup.position.x + 0.31;
    portrait.visible = half > 1.05;
    portrait.position.x = windowRight + 0.16;
    const shelfLeft = portrait.visible ? portrait.position.x + 0.15 : windowRight + 0.02;
    const room = Math.min(shelfLeft + 0.68, half - 0.05) - shelfLeft;
    const fit = Math.max(0.5, Math.min(1, room / 0.68));
    curio.visible = room / 0.68 > 0.5;
    curio.scale.setScalar(fit);
    curio.position.x = shelfLeft + 0.33 * fit;
    curio.position.y = 0.5 + (1 - fit) * 0.12;
    board.position.x = Math.max(0.86, curio.position.x + 0.33 * fit + 0.26);
    board.visible = half > 1.25;
    lantern.position.x = windowGroup.position.x - 0.42;
    // The cord hangs right in front of you, in the upper right of the picture, whatever the screen.
    const reach = 0.62;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const ahead = lookHome.clone().sub(camHome).normalize().multiplyScalar(reach).add(camHome);
    pullCord.position.set(ahead.x + tanV * aspect * reach * 0.8, ahead.y + tanV * reach * 0.42, ahead.z);
    lantern.visible = half > 1.2;
  };

  /* ----- interaction ----- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hover = false;
  let locked = !opts.reducedMotion; // true during the opening shot and while the book is opening / open / closing
  let progress = 0; // 0 closed, 1 open
  /** True only while the book is being opened: that is when it strains, shakes and bursts. */
  let opening = false;
  let tween: { from: number; to: number; start: number; dur: number; done: () => void } | null = null;

  let hoverToy: Toy | null = null;
  const targets = () => [book, ...toys.map((toy) => toy.root)];

  /** What is under the pointer: the book, one of the toys, or nothing. */
  const pick = (e: PointerEvent | MouseEvent): 'book' | Toy | null => {
    const box = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(targets(), true).find((h) => (h.object as THREE.Mesh).isMesh);
    if (!hit) return null;
    for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
      if (o === book) return 'book';
      const toy = toys.find((x) => x.root === o);
      if (toy) return toy;
    }
    return null;
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }
    const what = locked ? null : pick(e);
    const before = hover ? 'book' : hoverToy;
    hover = what === 'book';
    hoverToy = what && what !== 'book' ? what : null;
    canvas.style.cursor = what ? 'pointer' : '';
    if (what !== before) {
      // Touching the cord makes it bob, so it answers the pointer before any click.
      if (what && what !== 'book' && what.id === 'cord') cordVel -= 0.55;
      const target = what === 'book' ? book : what ? what.anchor : null;
      if (target) {
        hoverBox.setFromObject(target);
        hoverBox.getSize(hoverSize);
        hoverBox.getCenter(hoverHalo.position);
        hoverHalo.scale.setScalar(Math.max(hoverSize.x, hoverSize.y, hoverSize.z) * 1.7);
        // Only what rests on the table top gets the circle; things on the wall keep the faint glow alone.
        ringOn = hoverBox.min.y < 0.03 && hoverBox.min.y > -0.05;
        hoverRing.position.set(hoverHalo.position.x, 0.004, hoverHalo.position.z);
        hoverRing.scale.setScalar(Math.max(hoverSize.x, hoverSize.z) * 1.55 + 0.05);
        hoverTop.set(hoverHalo.position.x, hoverBox.max.y, hoverHalo.position.z).project(camera);
        const rect = canvas.getBoundingClientRect();
        opts.onHover?.(what === 'book' ? 'book' : (what as Toy).id, ((hoverTop.x + 1) / 2) * rect.width, ((1 - hoverTop.y) / 2) * rect.height);
      } else {
        opts.onHover?.(null, 0, 0);
      }
    }
  };
  const onClick = (e: MouseEvent) => {
    if (locked) return;
    const what = pick(e);
    if (what === 'book') { opts.onBookClick(); return; }
    if (!what) return;
    what.poke();
    if (opts.onPoke) {
      // Anchor the speech bubble just above the thing that was poked.
      const bounds = new THREE.Box3().setFromObject(what.anchor);
      const top = new THREE.Vector3((bounds.min.x + bounds.max.x) / 2, bounds.max.y, (bounds.min.z + bounds.max.z) / 2).project(camera);
      const rect = canvas.getBoundingClientRect();
      opts.onPoke(what.id, ((top.x + 1) / 2) * rect.width, ((1 - top.y) / 2) * rect.height);
    }
  };
  const onLeave = () => { hover = false; hoverToy = null; canvas.style.cursor = ''; opts.onHover?.(null, 0, 0); };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  const ro = new ResizeObserver(layout);
  ro.observe(canvas);
  layout();

  /* ----- frame loop ----- */
  const clock = new THREE.Clock();
  let frame = 0;
  let paused = false;
  let peek = 0;
  let shadowFrame = 0;
  const still = opts.reducedMotion;

  const render = () => {
    const t = clock.getElapsedTime();

    if (tween) {
      const k = Math.min(1, (performance.now() - tween.start) / tween.dur);
      progress = tween.from + (tween.to - tween.from) * (opening ? k : ease(k));
      if (k >= 1) {
        const done = tween.done;
        tween = null;
        done();
      }
    }

    // The cover lifts a little under the pointer, as if inviting you in.
    peek += ((hover ? 1 : 0) - peek) * 0.12;
    // Opening is a three-beat scene: the book strains (charge), the cover flies open, light pours out (burst).
    const charge = opening ? THREE.MathUtils.clamp(progress / 0.44, 0, 1) : 0;
    const coverLin = opening
      ? THREE.MathUtils.clamp((progress - 0.44) / 0.42, 0, 1)
      : THREE.MathUtils.clamp((progress - 0.06) / 0.86, 0, 1);
    const coverK = opening ? 1 - Math.pow(1 - coverLin, 3) : coverLin;
    const burst = opening ? THREE.MathUtils.smoothstep(coverLin, 0, 0.3) * (1 - THREE.MathUtils.smoothstep(progress, 0.9, 1)) : 0;
    const strain = charge * (1 - coverLin);
    const rattle = still ? 0 : strain * Math.abs(Math.sin(t * 43)) * 0.07;
    hinge.rotation.z = Math.max(peek * 0.07 * (1 - progress), coverK * OPEN_ANGLE, rattle);
    strapDrop.visible = progress < 0.03;
    if (!still) {
      book.position.set(bookHome.x + Math.sin(t * 71) * 0.003 * strain, bookHome.y + Math.abs(Math.sin(t * 57)) * 0.004 * strain, bookHome.z + Math.sin(t * 63) * 0.002 * strain);
      book.rotation.set(Math.sin(t * 77) * 0.012 * strain, bookTurn, Math.sin(t * 89) * 0.014 * strain);
      // Left alone, the book gives a little hop now and then: remember me?
      if (bookNudgeAt < 0 && introK >= 1) bookNudgeAt = t + 9;
      if (bookNudgeAt > 0 && t > bookNudgeAt && !locked && !hover && progress === 0) { bookNudgeT0 = t; bookNudgeAt = t + 13 + Math.random() * 9; }
      const nudge = (t - bookNudgeT0) / 0.62;
      if (nudge >= 0 && nudge < 1 && progress === 0) {
        book.position.y += Math.sin(nudge * Math.PI) * 0.024;
        book.rotation.z += Math.sin(nudge * Math.PI * 2) * 0.05;
      }
    }

    if (!still) {
      sway.x += (pointer.x - sway.x) * 0.05;
      sway.y += (pointer.y - sway.y) * 0.05;
    }
    const breath = still ? 0 : Math.sin(t * 0.6) * 0.004;
    if (introTween) {
      const k = Math.min(1, (performance.now() - introTween.start) / introTween.dur);
      introK = k;
      if (k >= 1) {
        const done = introTween.done;
        introTween = null;
        locked = false;
        done();
      }
    }
    // Opening shot: from high at the back of the room, down to your seat at the table.
    const arrive = 1 - Math.pow(1 - introK, 3);
    // A short push-in, not a fly-over: from further back the edges of the set would show.
    camFar.set(camHome.x - 0.02, camHome.y + 0.03, camHome.z + 0.13);
    lookFar.set(lookHome.x, lookHome.y + 0.02, lookHome.z);
    const lean = opening ? ease(progress) : progress;
    camNow.copy(camFar).lerp(camHome, arrive).lerp(camRead, lean);
    lookNow.copy(lookFar).lerp(lookHome, arrive).lerp(lookRead, lean);
    const free = (1 - progress) * arrive;
    camera.position.set(camNow.x + sway.x * 0.07 * free, camNow.y - sway.y * 0.035 * free + breath * free, camNow.z);
    if (!still) {
      // The whole room shakes with it.
      const shake = strain * 0.006 + burst * 0.011;
      camera.position.x += Math.sin(t * 61) * shake;
      camera.position.y += Math.sin(t * 53 + 1.3) * shake;
    }
    camera.lookAt(lookNow.x + sway.x * 0.02 * free, lookNow.y, lookNow.z);

    if (!still) {
      const f = 1 + 0.035 * Math.sin(t * 6.3) + 0.02 * Math.sin(t * 13.7 + 1.3) + 0.03 * Math.sin(t * 2.1 + 0.4);
      candleLight.intensity = LIGHT_BASE * f;
      candleLight.position.set(
        lightHome.x + Math.sin(t * 7.3) * 0.0016,
        lightHome.y + Math.sin(t * 12.1) * 0.0012,
        lightHome.z + Math.cos(t * 5.9) * 0.0016,
      );
      flame.scale.set(1 + 0.06 * Math.sin(t * 13.1), 1 + 0.1 * Math.sin(t * 9.4 + 0.5), 1 + 0.06 * Math.cos(t * 11.7));
      flame.rotation.z = Math.sin(t * 3.3) * 0.07 + Math.sin(t * 8.7) * 0.03;
      halo.scale.setScalar(0.13 * (0.94 + 0.06 * f));
      waxMat.emissiveIntensity = 0.45 * f;
      potionLight.intensity = 0.12 + 0.03 * Math.sin(t * 1.7);

      const pos = moteGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < MOTES; i++) {
        const j = i * 3;
        pos.setXYZ(
          i,
          moteHome[j] + Math.sin(t * 0.21 + i) * 0.09,
          moteHome[j + 1] + Math.sin(t * 0.17 + i * 1.7) * 0.05,
          moteHome[j + 2] + Math.cos(t * 0.19 + i * 0.6) * 0.05,
        );
      }
      pos.needsUpdate = true;
      // Fireflies glow and fade, each to its own rhythm.
      const col = moteGeo.attributes.color as THREE.BufferAttribute;
      for (let i = 0; i < MOTES; i++) {
        const b = Math.pow(Math.max(0, Math.sin(t * (0.7 + (i % 5) * 0.13) + i * 2.1)), 2);
        col.setXYZ(i, b, b, b);
      }
      col.needsUpdate = true;
    } else {
      candleLight.intensity = LIGHT_BASE;
    }

    // --- toys ---
    now = t;
    toys.forEach((toy) => {
      toy.hoverK += ((toy === hoverToy ? 1 : 0) - toy.hoverK) * 0.18;
      // Small loose things lift a touch under the pointer; fixed things only get the halo,
      // because scaling them about their anchor would make them slide.
      if (toy.bounce) toy.root.scale.setScalar(toy.base * (1 + 0.04 * toy.hoverK));
    });
    haloK += ((hover || hoverToy ? 1 : 0) - haloK) * 0.2;
    hoverHalo.material.opacity = haloK * (ringOn ? 0.1 : 0.2);
    hoverRing.material.opacity = ringOn ? haloK * 0.75 : 0;
    if (!still) hoverRing.rotation.z = t * 0.5;
    [0].forEach(() => {
    });

    // Candle: blow it out and the moon takes over.
    // Lights out puts the candle out as well; it comes back with the light.
    litK += ((candleLit && !darkOn ? 1 : 0) - litK) * 0.09;
    flame.visible = litK > 0.03;
    flame.scale.multiplyScalar(Math.max(litK, 0.001));
    halo.material.opacity = litK;
    candleLight.intensity *= litK;
    waxMat.emissiveIntensity *= litK;
    poolMat.emissiveIntensity = 0.5 * litK;
    hemi.intensity = 1.12 + (1 - litK) * 0.7;
    beam.material.opacity = 0.75 + (1 - litK) * 0.25 + (still ? 0 : Math.sin(t * 0.7) * 0.04);
    moon.intensity = 1.1 + (1 - litK) * 2.2;
    const smokeK = (t - smokeAt) / 1.8;
    if (!candleLit && smokeK < 1) {
      smoke.position.set(CANDLE.x + Math.sin(smokeK * 6) * 0.012, flameY + 0.02 + smokeK * 0.16, CANDLE.z);
      smoke.scale.setScalar(0.03 + smokeK * 0.09);
      smoke.material.opacity = Math.sin(smokeK * Math.PI) * 0.5;
    } else {
      smoke.material.opacity = 0;
    }

    // Tomato hops and spins.
    const hop = (t - tomatoAt) / 0.75;
    if (hop >= 0 && hop < 1) {
      tomato.position.y = tomatoY + Math.sin(hop * Math.PI) * 0.075;
      // One full turn from wherever he was facing, so it neither snaps at the start nor at the end.
      tomato.rotation.y = heroYawRest + ease(hop) * Math.PI * 2;
    } else {
      tomato.position.y = tomatoY;
      tomato.getWorldPosition(heroAt);
      heroAt.y += 0.09;
      // The same rule as the cat: he looks at whatever is happening; lights out he stares at you,
      // and follows the pointer only when it comes close.
      if (gazeK > 0.02) {
        heroLook.copy(gazeAt);
      } else {
        heroSpot.copy(heroAt).project(camera);
        const nearPx = Math.hypot((pointer.x - heroSpot.x) * 0.5 * window.innerWidth, (-pointer.y - heroSpot.y) * 0.5 * window.innerHeight);
        heroFollow += ((nearPx < 200 ? 1 : 0) - heroFollow) * 0.1;
        heroLook.set(pointer.x, -pointer.y, 0.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(0.5).add(camera.position);
        heroLook.lerpVectors(camera.position, heroLook, heroFollow);
      }
      // The hop leaves him a whole turn round; take it off, or the easing below unwinds it as a second spin.
      tomato.rotation.y = Math.atan2(Math.sin(tomato.rotation.y), Math.cos(tomato.rotation.y));
      const heroWatch = Math.max(darkK, gazeK);
      const heroYaw = THREE.MathUtils.clamp(Math.atan2(heroLook.x - heroAt.x, heroLook.z - heroAt.z), -1.5, 1.5);
      tomato.rotation.y += (0.35 + (heroYaw - 0.35) * heroWatch - tomato.rotation.y) * 0.18;
      heroYawRest = tomato.rotation.y;
    }

    // Toadstools squash and spring back, one after another.
    mushrooms.forEach((m, i) => {
      const d = t - groveAt - i * 0.09;
      const w = d > 0 && d < 1.4 ? Math.exp(-4 * d) * Math.cos(d * 20) : 0;
      m.scale.set(1 + 0.16 * w, 1 - 0.3 * w, 1 + 0.16 * w);
    });

    // Quill shivers in the inkwell.
    const qd = t - quillAt;
    quill.rotation.z = -0.5 + (qd > 0 && qd < 1.1 ? Math.sin(qd * 24) * 0.2 * (1 - qd / 1.1) : 0);

    // Potion: a shake, a new colour and a burst of sparks.
    const pd = t - potionAt;
    const fizz = pd > 0 && pd < 2.6 ? 1 - pd / 2.6 : 0;
    potion.rotation.z = pd > 0 && pd < 0.6 ? Math.sin(pd * 42) * 0.13 * (1 - pd / 0.6) : 0;

    // A shooting star crosses the window.
    const sk = (t - starAt) / 0.8;
    if (sk >= 0 && sk < 1) {
      shootingStar.position.set(-0.13 + sk * 0.25, 0.42 - sk * 0.14, 0.012);
      shootingStar.material.opacity = Math.sin(sk * Math.PI);
    } else {
      shootingStar.material.opacity = 0;
    }

    // Chest lid, lantern, hat, crystal ball.
    chestK += ((chestOpen ? 1 : 0) - chestK) * 0.1;
    chestLid.rotation.x = -chestK * 1.25;
    chestLight.intensity = chestK * 0.3;
    lanternK += ((lanternOn ? 1 : 0) - lanternK) * 0.12;
    lanternLight.intensity = 0.22 * lanternK;
    lanternGlow.color.set('#3a2a20').lerp(new THREE.Color('#ffc56a'), lanternK);
    lanternAura.material.opacity = lanternK;
    lantern.rotation.z = still ? 0 : Math.sin(t * 0.9) * 0.035;
    const hh = (t - hatAt) / 0.7;
    hat.position.y = hatY + chestK * (0.15 + (still ? 0 : Math.sin(t * 1.8) * 0.008)) + (hh >= 0 && hh < 1 ? Math.sin(hh * Math.PI) * 0.09 : 0);
    hat.rotation.z = hh >= 0 && hh < 1 ? Math.sin(hh * Math.PI * 2) * 0.25 : 0;
    const flash = Math.max(0, 1 - (t - orbAt) / 1.2);
    orbMat.emissiveIntensity = 0.9 + flash * 1.6 + (still ? 0 : Math.sin(t * 1.3) * 0.15);
    orbLight.intensity = 0.12 + flash * 0.3;
    crystalMat.emissiveIntensity = 0.8 + flash * 1.4 + (still ? 0 : Math.sin(t * 2.1) * 0.2);
    crystalLight.intensity = 0.1 + flash * 0.25;
    crystalAura.scale.setScalar(0.2 + flash * 0.12);
    orbAura.scale.setScalar(0.2 + flash * 0.12);
    orbAura.material.color.copy(orbLight.color);
    potionAura.material.color.copy(potionLight.color);
    potionAura.scale.setScalar(0.2 + fizz * 0.14);
    if (!still) flags.forEach((flag, i) => { flag.rotation.z = Math.sin(t * 1.4 + i * 0.8) * 0.07; });

    // Cat: breathes, blinks, sways its tail; poke it and it tilts its head at you.
    const cd = t - catAt;
    const awake = cd > 0 && cd < 2.2 ? Math.sin((cd / 2.2) * Math.PI) : 0;
    // In the dark the cat stops looking about and fixes its eyes on you.
    catHead.getWorldPosition(catHeadAt);
    // What it watches: whatever is going on in the room, or — lights out — your pointer.
    if (gazeK > 0.02) {
      catLook.copy(gazeAt);
    } else {
      // Lights out it stares straight at you — unless the pointer comes within about 200 px, then it tracks that.
      catSpot.copy(catHeadAt).project(camera);
      const nearPx = Math.hypot((pointer.x - catSpot.x) * 0.5 * window.innerWidth, (-pointer.y - catSpot.y) * 0.5 * window.innerHeight);
      catFollow += ((nearPx < 200 ? 1 : 0) - catFollow) * 0.1;
      catLook.set(pointer.x, -pointer.y, 0.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(0.9).add(camera.position);
      catLook.lerpVectors(camera.position, catLook, catFollow);
    }
    const watch = Math.max(darkK, gazeK);
    const stareYaw = THREE.MathUtils.clamp(Math.atan2(catLook.x - catHeadAt.x, catLook.z - catHeadAt.z), -1.25, 1.25);
    const starePitch = THREE.MathUtils.clamp(-Math.atan2(catLook.y - catHeadAt.y, Math.hypot(catLook.x - catHeadAt.x, catLook.z - catHeadAt.z)), -0.6, 0.6);
    catHead.rotation.z = awake * 0.4 * (1 - watch);
    catHead.rotation.y += ((still ? 0 : Math.sin(t * 0.4) * 0.12) * (1 - watch) + stareYaw * watch - catHead.rotation.y) * 0.18;
    catHead.rotation.x += (starePitch * watch - catHead.rotation.x) * 0.18;
    catTail.rotation.y = still ? 0 : Math.sin(t * (1.1 + awake * 5)) * (0.05 + awake * 0.1);
    catBody.scale.y = 1 + (still ? 0 : Math.sin(t * 1.6) * 0.025);
    const blink = still || darkK > 0.5 ? 1 : (t % 4.2 < 0.14 ? 0.12 : 1);
    // Lights out: wide, glowing, and narrowed to a suspicious squint.
    catEyes.forEach((eye, i) => {
      // Narrow slits, slanted up at the outer corners: it does not trust you.
      eye.scale.set(1 + 0.35 * darkK, blink * (1 + 0.3 * darkK) * (1 - 0.66 * darkK), 1);
      eye.rotation.z = (i === 0 ? -1 : 1) * 0.32 * darkK;
    });

    // Cauldron: bubbles rise and pop; a poke makes it boil over for a moment.
    const boil = Math.max(0, 1 - (t - cauldronAt) / 2.4);
    bubbles.forEach((bub) => {
      const k = still ? 0.5 : (t * (0.45 + boil * 1.4) + bub.userData.phase) % 1;
      bub.scale.setScalar(0.3 + k * (1 + boil * 0.9));
      bub.position.y = 0.112 + k * (0.012 + boil * 0.07);
      bub.visible = k < 0.92;
    });
    cauldronLight.intensity = 0.14 + boil * 0.3;
    cauldronAura.scale.setScalar(0.3 + boil * 0.2);

    // Wand: a flash of the star.
    const zap = Math.max(0, 1 - (t - wandAt) / 0.9);
    wandAura.scale.setScalar(0.12 + zap * 0.3);
    wandStar.rotation.z = zap * Math.PI * 2;

    // Server and router lights flicker; the little robot hops when poked.
    if (!still) {
      leds.forEach((mat, i) => {
        const on = Math.sin(t * (2.2 + (i % 5) * 0.9) + i * 1.7) > -0.3;
        mat.color.copy(mat.userData.on as THREE.Color).multiplyScalar(on ? 1 : 0.18);
      });
    }
    const rb = (t - robotAt) / 0.8;
    robot.position.y = robotY + (rb >= 0 && rb < 1 ? Math.abs(Math.sin(rb * Math.PI * 2)) * 0.04 : 0);
    robot.rotation.y = rb >= 0 && rb < 1 ? Math.sin(rb * Math.PI * 4) * 0.5 : 0;

    // The mechanical computer idles; poke it and the engine revs.
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    const rev = Math.max(0, 1 - (t - engineAt) / 2.8);
    engineAngle += (still ? 0 : 0.7 + rev * 13) * dt;
    gearA.rotation.z = engineAngle;
    gearB.rotation.z = -engineAngle * (14 / 10) + 0.2;
    gearC.rotation.z = -engineAngle * (14 / 7);
    innerGlow.material.opacity = 0.3 + rev * 0.5 + (still ? 0 : Math.sin(t * 5) * 0.04);
    flywheel.rotation.z = -engineAngle * (14 / 6);
    pcGearD.rotation.z = -engineAngle * 0.62;
    pcGearE.rotation.z = engineAngle * 1.24 + 0.3;
    pcGearF.rotation.z = engineAngle * 0.97;
    pcValve.rotation.z = engineAngle * 0.4;
    pistons.forEach((piston) => { piston.position.y = PISTON_Y + Math.sin(engineAngle * 2 + piston.userData.phase) * 0.012; });
    needle.rotation.z = 0.9 - rev * 1.9 + (still ? 0 : Math.sin(t * 9) * 0.04 * (1 + rev * 3));
    engine.position.set(engineHome.x + Math.sin(t * 67) * 0.0022 * rev, engineHome.y + Math.abs(Math.sin(t * 49)) * 0.003 * rev, engineHome.z);
    puffs.forEach((sp) => {
      const k = still ? 0.4 : (t * (0.25 + rev * 1.1) + sp.userData.phase) % 1;
      sp.position.set(engineHome.x - 0.07 + k * 0.03, engineHome.y + 0.28 + k * 0.2, engineHome.z + 0.01);
      sp.scale.setScalar(0.03 + k * (0.08 + rev * 0.08));
      sp.material.opacity = Math.sin(k * Math.PI) * (0.14 + rev * 0.45);
    });

    // The CV scroll keeps glowing so it is never missed; a click makes it jump.
    const sc = (t - scrollAt) / 0.6;
    cvScroll.position.y = scrollY + (sc >= 0 && sc < 1 ? Math.sin(sc * Math.PI) * 0.06 : 0);
    cvScroll.rotation.x = sc >= 0 && sc < 1 ? sc * Math.PI * 2 : 0;
    scrollAura.scale.setScalar(0.3 + (still ? 0 : Math.sin(t * 2.6) * 0.05));

    // Bugs potter about inside their jar; rattle it and they scurry.
    const panic = Math.max(0, 1 - (t - bugsAt) / 2);
    bugs.forEach((bug) => {
      const u = bug.userData as { phase: number; speed: number; radius: number; y?: number };
      const a = (still ? 0 : t * u.speed * (1 + panic * 5)) + u.phase;
      bug.position.set(Math.cos(a) * u.radius, u.y ?? 0.0085, Math.sin(a) * u.radius);
      // Head first, whichever way round it is walking.
      bug.rotation.set(0, -a - (u.speed > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
    });
    bugJar.rotation.z = panic > 0.7 ? Math.sin(t * 46) * 0.08 * (panic - 0.7) / 0.3 : 0;

    // Duck: a squeaky hop.
    const dk = (t - duckAt) / 0.6;
    if (dk >= 0 && dk < 1) {
      duck.position.y = Math.sin(dk * Math.PI) * 0.05;
      duck.scale.y = duck.scale.x * (1 + Math.sin(dk * Math.PI * 3) * 0.18 * (1 - dk));
      duck.rotation.z = Math.sin(dk * Math.PI * 2) * 0.2;
    } else {
      duck.position.y = 0;
      duck.scale.y = duck.scale.x;
      duck.rotation.z = 0;
    }

    // Keyboard: a rainbow ripple across the keys.
    const kw = (t - keysAt) / 1.3;
    if (kw >= 0 && kw < 1.05) placeKeys(Math.min(kw, 1));

    // Laptop screen breathes; coffee steams.
    screenLight.intensity = 0.16 + (still ? 0 : Math.sin(t * 3.1) * 0.015);
    mugSteam.forEach((sp) => {
      const k = still ? 0.4 : (t * 0.17 + sp.userData.phase) % 1;
      sp.position.set(mug.position.x + Math.sin(k * 5 + sp.userData.phase * 9) * 0.012, 0.09 + k * 0.16, mug.position.z);
      sp.scale.setScalar(0.04 + k * 0.08);
      sp.material.opacity = Math.sin(k * Math.PI) * (0.08 + 0.2 * coffeeK);
    });
    // Each poke is a sip; the fifth one is a refill.
    coffeeK += (1 - sips / 4 - coffeeK) * 0.08;
    coffee.position.y = 0.014 + 0.062 * coffeeK;
    coffee.scale.setScalar(0.93 + 0.07 * coffeeK);
    const tip = (t - mugAt) / 0.7;
    mug.rotation.z = tip >= 0 && tip < 1 ? Math.sin(tip * Math.PI) * 0.35 : 0;
    mug.position.y = tip >= 0 && tip < 1 ? Math.sin(tip * Math.PI) * 0.03 : 0;

    // The closed book glows and twinkles; the glow fades as it opens.
    const closed = opening ? 1 - THREE.MathUtils.smoothstep(progress, 0.88, 1) : 1 - Math.min(1, progress * 2.5);
    // As the book strains, the room goes dark around it; then the burst lights everything.
    hemi.intensity *= 1 - 0.7 * strain + 0.12 * burst;
    fill.intensity = 0.5 * (1 - 0.8 * strain) + 0.1 * burst;
    candleLight.intensity *= 1 - strain * (0.45 + 0.35 * Math.abs(Math.sin(t * 31)));
    pillar.material.opacity = burst * 0.75;
    pillar.scale.set(0.5 + burst * 0.35, 0.7 + burst * 0.6, 1);
    blast.material.opacity = burst * 0.55;
    blast.scale.setScalar(0.25 + burst * 0.6);
    const pulse = still ? 0.8 : 0.72 + 0.28 * Math.sin(t * 2.2);
    bookGlow.material.opacity = Math.min(1, (0.34 + 0.2 * pulse + 0.22 * peek + charge * 0.5) * closed);
    bookGlow.scale.setScalar(1 + charge * 0.3 + burst * 0.4);
    bookLight.intensity = (0.1 + 0.08 * pulse + 0.1 * peek + charge * 0.35 + burst * 0.5) * closed;
    const rim = { color: [1, 0.78 + 0.1 * pulse, 0.3], thickness: 0.0042 + (0.0035 * pulse + 0.003 * peek + 0.006 * charge) * closed };
    const inkRim = { color: [0.13, 0.07, 0.05], thickness: 0.0042 };
    leatherMat.userData.outlineParameters = closed > 0.02 ? rim : inkRim;
    coverArt.userData.outlineParameters = closed > 0.02 ? rim : inkRim;
    twinkles.forEach((sp) => {
      const i = sp.userData.i as number;
      // Sparks circle the book, get sucked in as it strains, and are flung out by the burst.
      const a = (still ? 0 : t * (0.5 + charge * 4)) + (i / twinkles.length) * Math.PI * 2;
      const blink = Math.max(Math.pow(Math.max(0, Math.sin(t * 2.4 + i * 1.9)), 3), charge);
      const reach = 1 - 0.5 * strain + burst * 2.4;
      sp.position.set(
        bookHome.x + Math.cos(a) * 0.19 * reach,
        0.06 + 0.07 * (0.5 + 0.5 * Math.sin(a * 2 + i)) + burst * (0.25 + (i % 3) * 0.12),
        bookHome.z + Math.sin(a) * 0.24 * reach,
      );
      sp.scale.setScalar(0.012 + blink * 0.028);
      sp.material.opacity = (0.25 + blink * 0.75) * closed;
    });

    steam.forEach((s) => {
      const k = still ? 0.4 : (t * (0.22 + fizz * 0.5) + s.userData.phase) % 1;
      s.position.set(
        potion.position.x + Math.sin(k * 7 + s.userData.phase * 9) * 0.02,
        0.13 + k * 0.2,
        potion.position.z + Math.cos(k * 5 + s.userData.phase * 4) * 0.012,
      );
      s.scale.setScalar(0.022 * (1 - k * 0.5) * (1 + fizz * 1.6));
      s.material.opacity = Math.sin(k * Math.PI) * 0.9;
    });

    // --- the bug that only comes out in the dark ---
    if (rbState === 'hidden' && darkK > 0.7 && !locked && t > rbNextAt) {
      rbState = 'run';
      rbPick(rbBug.position);
      rbPick(rbGoal);
    }
    if (rbState === 'run') {
      if (darkK < 0.4) {
        // The light is back: it is gone before you see where.
        rbState = 'hidden';
        rbBug.position.copy(RB_AWAY);
        rbNextAt = t + 3;
      } else if (t > rbPauseUntil) {
        const dx = rbGoal.x - rbBug.position.x;
        const dz = rbGoal.z - rbBug.position.z;
        const far = Math.hypot(dx, dz);
        const step = Math.min(far, 0.0042);
        if (far < 0.006) {
          // There: a short think, then somewhere else.
          rbPick(rbGoal);
          rbPauseUntil = t + 0.25 + Math.random() * 0.9;
        } else {
          rbBug.position.x += (dx / far) * step;
          rbBug.position.z += (dz / far) * step;
          rbBody.rotation.y = -Math.atan2(dz, dx);
        }
        rbBody.position.y = Math.abs(Math.sin(t * 30)) * 0.0015;
      }
      rbAura.material.opacity = 0.55 + 0.2 * Math.sin(t * 6);
      rbHint.visible = true;
      rbHint.position.y = 0.03 + Math.abs(Math.sin(t * 4.5)) * 0.014;
    } else if (rbState === 'caught') {
      rbHint.visible = false;
      // Step one: lifted by the scruff, carried over the table in a slow arc, dropped into the jar.
      const k = Math.min(1, (t - rbT0) / RB_TO_JAR);
      bugJar.getWorldPosition(rbJar);
      const carry = THREE.MathUtils.smoothstep(k, 0.12, 0.9);
      rbBug.position.lerpVectors(rbFrom, rbJar, carry);
      rbBug.position.y = rbFrom.y + (0.07 - rbFrom.y) * carry + Math.sin(Math.min(1, k / 0.9) * Math.PI) * 0.3 + Math.min(k / 0.12, 1) * 0.03 * (1 - carry);
      rbBody.rotation.y += 0.22;
      rbBody.rotation.z = Math.sin(t * 22) * 0.4;
      rbAura.material.opacity = 0.9;
      if (k >= 1) {
        // Step two: the jar rattles, and a ticket comes out of it.
        rbState = 'card';
        rbT0 = t;
        rbBug.position.copy(RB_AWAY);
        rbBody.rotation.z = 0;
        opts.onEvent?.('bug-jar');
        bugsAt = now;
        const guest = bugs[0].clone();
        guest.userData = { phase: Math.random() * 6, speed: (bugs.length % 2 ? -1 : 1) * 0.8, radius: 0.012 + (bugs.length % 3) * 0.009, y: 0.022 + ((bugs.length - 5) % 4) * 0.012 };
        bugJar.add(guest);
        bugs.push(guest);
      }
    } else if (rbState === 'card') {
      // Step three: the ticket flies to the board and pins itself there; only then is it written up.
      const k = Math.min(1, (t - rbT0) / RB_CARD);
      bugJar.getWorldPosition(rbJar);
      rbJar.y += 0.16;
      // Straight to the slot it will occupy, not just to the middle of the board.
      const [slotCol, slotRow] = RB_SLOTS[Math.min(rbCaught, RB_SLOTS.length - 1)];
      rbSlot.set(((30 + slotCol * 168 + 58) / 512 - 0.5) * 0.37, (0.5 - (54 + slotRow * 72 + 30) / 360) * 0.26, 0.0125);
      rbBoardAt.copy(rbSlot);
      board.localToWorld(rbBoardAt);
      rbCard.material.opacity = 1;
      rbCard.visible = true;
      rbCard.position.lerpVectors(rbJar, rbBoardAt, ease(k));
      rbCard.position.y += Math.sin(k * Math.PI) * 0.18;
      rbCard.rotation.set(0, (1 - k) * 9, (1 - k) * 2);
      rbCard.scale.setScalar(0.5 + 0.62 * Math.sin(Math.min(1, k * 1.2) * Math.PI * 0.5));
      if (k >= 1) {
        // Pinned: now it glows on the board for a few seconds before it is just another card.
        rbState = 'glow';
        rbT0 = t;
        // From here it belongs to the board: same place, same tilt and same size as the card painted there,
        // so the glow sits exactly on it.
        board.add(rbCard);
        rbCard.position.copy(rbSlot);
        rbCard.rotation.set(0, 0, Math.min(rbCaught, RB_SLOTS.length - 1) % 2 ? -0.06 : 0.05);
        rbCard.scale.set((116 / 512) * 0.37 / 0.075, (62 / 360) * 0.26 / 0.05, 1);
        rbCaught += 1;
        const fresh = colorTex(kanbanCanvas(rbCaught));
        (boardFace.material as THREE.MeshBasicMaterial).map?.dispose();
        (boardFace.material as THREE.MeshBasicMaterial).map = fresh;
        boardFlashAt = t;
        // The next one takes its time: ten to twenty seconds.
        rbNextAt = t + 10 + Math.random() * 10;
        if (opts.onPoke) {
          const spot = rbBoardAt.clone();
          spot.y += 0.16;
          spot.project(camera);
          const rect = canvas.getBoundingClientRect();
          opts.onPoke('bugDone', ((spot.x + 1) / 2) * rect.width, ((1 - spot.y) / 2) * rect.height);
        }
      }
    }
    if (rbState === 'glow') {
      const k = Math.min(1, (t - rbT0) / RB_GLOW);
      const pulse = 0.5 + 0.5 * Math.sin(t * 7);
      // A bright card that pulses, then fades to show the written-up one underneath.
      rbCard.material.opacity = (1 - THREE.MathUtils.smoothstep(k, 0.25, 1)) * (0.75 + 0.25 * pulse);
      rbCardAura.material.opacity = (1 - k * k) * (0.6 + 0.4 * pulse);
      rbCardAura.scale.setScalar(0.2 + 0.07 * pulse);
      if (k >= 1) { rbState = 'hidden'; rbCard.visible = false; scene.add(rbCard); rbCard.scale.setScalar(1); rbCardAura.material.opacity = 0.8; rbCardAura.scale.setScalar(0.2); }
    }
    // The board swells and glows while the new card settles in.
    board.scale.setScalar(1 + 0.05 * Math.max(0, 1 - (t - boardFlashAt) / 0.9));
    const boardFlash = Math.max(0, 1 - (t - boardFlashAt) / 5);

    // --- things that happen by themselves, now and then, as well as when asked ---
    if (autoNext < 0 && introK >= 1) autoNext = t + 24;
    // Never while the book is open, opening or closing; afterwards the room waits a while before the next one.
    if (locked && autoNext > 0) autoNext = Math.max(autoNext, t + 15);
    if (autoNext > 0 && t > autoNext && !locked && !still && !document.hidden) {
      autoNext = t + 45 + Math.random() * 40;
      callVisitor();
    }
    // The owl: in from the night, smack into the glass, a dazed slide; the pane opens, it flutters back up,
    // tosses the letter in, watches it go, and leaves.
    if (owlStage > 0) {
      const u = t - owlT0;
      owl.visible = true;
      const flap = 1 + Math.sin(t * 16) * 0.14;
      const hang = Math.sin(t * 7) * 0.006;
      if (u < 1.3) {
        const k = u / 1.3;
        // Always inside the window opening: outside it there is only wall.
        owl.position.set(-0.13 + 0.03 * k, 0.4 - 0.1 * k * k + Math.sin(k * 9) * 0.01, 0.0075);
        owl.scale.set((0.1 + 0.8 * k * k) * flap, 0.1 + 0.8 * k * k, 1);
        owl.rotation.z = 0.25 * (1 - k);
      } else if (u < 2.4) {
        if (owlStage === 1) { owlStage = 2; opts.onEvent?.('owl-bump'); }
        const k = (u - 1.3) / 1.1;
        // Flattened against the pane, then peeling off and sliding down.
        const squash = Math.max(0, 1 - k * 4);
        owl.position.set(-0.1, 0.3 - 0.08 * k * k, 0.0075);
        owl.scale.set(0.9 * (1 + 0.3 * squash), 0.9 * (1 - 0.25 * squash), 1);
        owl.rotation.z = Math.sin(k * 14) * 0.14 * (1 - k);
      } else if (u < 3.3) {
        owlStage = Math.max(owlStage, 3);
        const k = ease((u - 2.4) / 0.9);
        owl.position.set(-0.1, 0.22 + 0.1 * k + hang, 0.0075);
        owl.scale.set(0.9 * flap, 0.9, 1);
        owl.rotation.z = 0;
      } else if (u < 4.3) {
        if (owlStage === 3) {
          // Lets go of the letter: from here the envelope is the real one, flying in from the beak.
          owlStage = 4;
          owl.material.map = owlBare;
          mailFromOwl = true;
          startMail();
        }
        owl.position.set(-0.1, 0.32 + hang, 0.0075);
        owl.scale.set(0.9 * flap, 0.9, 1);
      } else if (u < 5.6) {
        owlStage = 5;
        const k = (u - 4.3) / 1.3;
        owl.position.set(-0.1 + 0.02 * k, 0.32 + 0.1 * k, 0.0075);
        owl.scale.set(0.9 * (1 - 0.88 * k) * flap, 0.9 * (1 - 0.88 * k), 1);
        owl.rotation.z = 0.3 * k;
      } else {
        owlStage = 0;
        owl.visible = false;
      }
      if (owlStage < 4) { owl.getWorldPosition(gazeAt); gazeUntil = t + 1.5; }
    }
    const MAIL_FLIGHT = 6.6;
    if (mailState === 'fly') {
      const k = Math.min(1, (t - mailT0) / MAIL_FLIGHT);
      mailPath.getPoint(k * k * (3 - 2 * k), mailEnv.position);
      // Small at first, as if arriving from far off beyond the window.
      mailEnv.scale.setScalar(0.25 + 0.75 * THREE.MathUtils.smoothstep(k, 0, 0.2));
      // Tumbling in the draught, flattening out as it comes down.
      // The spin is added up, slower and slower, and the wobble dies away with it — so it settles
      // instead of whipping round at the end.
      const loose = 1 - THREE.MathUtils.smoothstep(k, 0.55, 0.97);
      mailSpin += Math.min(0.05, Math.max(0, t - mailPrevT)) * 3.1 * loose;
      mailEnv.rotation.set(Math.sin(t * 7.3) * 0.9 * loose, 0.3 + mailSpin, Math.sin(t * 5.1) * 0.7 * loose);
      gazeAt.copy(mailEnv.position);
      gazeUntil = t + 2.6;
      if (k >= 1) { mailState = 'rest'; mailEnv.rotation.set(0, 0.3 + mailSpin, 0); opts.onEvent?.('mail-land'); }
    }
    mailPrevT = t;
    mailAura.material.opacity = mailState === 'rest' ? 0.45 + 0.2 * Math.sin(t * 3) : 0;
    // The window swings open to let the letter in, and shuts behind it.
    const sashOpen = (mailState === 'fly' && t - mailT0 < 2.2) || (owlStage >= 2 && t - owlT0 > 2.3) ? 1 : 0;
    sashK += (sashOpen - sashK) * 0.08;
    windowSash.rotation.y = -1.3 * sashK;
    gazeK += ((t < gazeUntil ? 1 : 0) - gazeK) * 0.07;
    // A knock makes the hero start.
    const jolt = (t - knockT0) / 0.5;
    if (jolt >= 0 && jolt < 1) tomato.position.y = tomatoY + Math.sin(jolt * Math.PI) * 0.02;

    if (!still) crtOn.offset.x = (t * 0.045) % 1;

    const swing = t - portraitAt;
    portrait.rotation.z = 0.03 + (swing >= 0 && swing < 4 ? Math.sin(swing * 9) * 0.16 * Math.exp(-swing * 1.9) : 0);

    // The quick change: on with the hood as the light goes, off again as it returns (he spins while he does it).
    // A puff of smoke, and when it clears he is dressed differently.
    const puffK = (t - hoodPuffAt) / 0.75;
    if (puffK > 0.3 && heroDark !== darkOn) heroDark = darkOn;
    heroHood.visible = heroDark;
    heroDay.visible = !heroDark;
    heroGlow.visible = heroDark;
    if (puffK >= 0 && puffK < 1) {
      tomato.getWorldPosition(hoodPuff.position);
      hoodPuff.position.y += 0.08;
      hoodPuff.position.z += 0.06;
      hoodPuff.scale.setScalar(0.12 + 0.34 * Math.sin(puffK * Math.PI * 0.5));
      hoodPuff.material.opacity = Math.sin(puffK * Math.PI) * 0.95;
      hoodPuff.material.rotation = puffK * 1.4;
    } else {
      hoodPuff.material.opacity = 0;
    }

    // Lights out: the room sinks into the dark and every glowing thing carries further.
    // Timed, not per frame: on a slow machine the room must still go dark in about a second.
    darkK += ((darkOn ? 1 : 0) - darkK) * Math.min(1, Math.max(0, t - darkT) * 3.2);
    darkT = t;
    // Exposure drops hard below, so the lamps are turned up to keep their own small pools of light.
    const lift = 1 + 1.1 * darkK;
    // When the book bursts open its light floods the room, lights out or not.
    const flare = opening ? Math.max(burst, charge * 0.3) : 0;
    const gloom = darkK * (1 - flare);
    hemi.intensity *= 1 - gloom;
    fill.intensity *= 1 - gloom;
    moon.intensity *= 1 - darkK;
    beam.material.opacity *= 1 - darkK;
    // The candle stays lit but burns low: a pool of light on the table, not a lit room.
    candleLight.intensity *= 1 - 0.8 * darkK;
    // Exposure does the heavy lifting: lit surfaces sink, while screens, LEDs and flames (not tone-mapped) stay bright.
    renderer.toneMappingExposure = 1 - 0.85 * gloom;
    potionLight.intensity = (0.12 + (still ? 0 : 0.03 * Math.sin(t * 1.7))) * lift;
    scene.fog!.color.setScalar(0).lerp(fogDay, 1 - darkK);
    (scene.background as THREE.Color).copy(scene.fog!.color);
    for (const l of [orbLight, crystalLight, cauldronLight, lanternLight, bookLight]) l.intensity *= lift;
    // Night coding: the screen becomes the lamp, and the keyboard backlight cycles its colours.
    screenLight.intensity *= 1 + 11 * darkK;
    bookLight.intensity *= 1 - 0.7 * darkK;
    bookGlow.material.opacity *= 1 - 0.65 * darkK;
    screenLight.distance = 1.3 + 1.3 * darkK;
    keyGlow.color.setHSL((t * 0.07) % 1, 0.9, 0.6);
    keyGlow.intensity = 1.5 * darkK;
    keyAura.material.color.copy(keyGlow.color);
    keyAura.material.opacity = 0.7 * darkK;
    for (const paper of papers) paper.mat.color.copy(paper.base).multiplyScalar(1 - 0.88 * darkK);
    for (const fake of pretend) fake.mat.emissiveIntensity = fake.base * (1 - gloom);
    scrollLight.intensity = 0.1 * lift;
    cordLight.intensity = 0.1 * lift;
    // The board lights up for a moment when a new card lands on it.
    if (boardFlash > 0) (boardFace.material as THREE.MeshBasicMaterial).color.lerp(WHITE, boardFlash);
    shutters.forEach(({ mesh, sign }) => {
      mesh.visible = darkK > 0.004;
      mesh.scale.x = sign * Math.max(0.001, ease(Math.min(1, darkK * 1.6)));
    });
    const tug = (t - cordAt) / 0.5;
    // A spring, straight down and back: the bead bounces but never leaves the pointer.
    const cordDt = Math.min(0.05, Math.max(0, t - cordT));
    cordT = t;
    if (!still) {
      cordVel += (-cordAng * 130 - cordVel * 5.5) * cordDt;
      cordAng += cordVel * cordDt;
    } else {
      cordAng = tug >= 0 && tug < 1 ? -Math.sin(tug * Math.PI) * 0.06 : 0;
    }
    cordPull.position.y = -1 + THREE.MathUtils.clamp(cordAng, -0.14, 0.05);
    cordAura.material.opacity = 0.42 + (still ? 0 : 0.2 * Math.sin(t * 2.4)) + 0.25 * darkK;

    // A lamp that is out lights nothing, so its shadow need not be drawn again (the candle's is six views of the room).
    candleLight.shadow.autoUpdate = candleLight.intensity > 0.002 || !candleLight.shadow.map;
    moon.shadow.autoUpdate = moon.intensity > 0.002 || !moon.shadow.map;
    if (lowPower) {
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = still || shadowFrame % 2 === 0;
      shadowFrame += 1;
    }

    ink.render(scene, camera);
  };

  // At most 60 pictures a second. On a 120 Hz screen the room would otherwise be drawn twice as often
  // for no visible gain — and everything eased per frame would move twice as fast.
  let lastDrawn = 0;
  const loop = (ms: number) => {
    if (ms - lastDrawn >= 1000 / 62) {
      lastDrawn = ms;
      render();
    }
    frame = paused ? 0 : requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  const run = (to: number, dur: number): Promise<void> => new Promise((resolve) => {
    if (opts.reducedMotion) {
      progress = to;
      render();
      resolve();
      return;
    }
    tween = { from: progress, to, start: performance.now(), dur, done: resolve };
  });

  if (import.meta.env.DEV) {
    // Lets a test freeze the opening shot at any point: __taleScrub(0.5).
    (window as unknown as Record<string, unknown>).__taleScrub = (p: number) => {
      introK = 1;
      opening = p > 0 && p < 1;
      progress = p;
      tween = null;
    };
    // …and the fly-in at any point: __taleIntro(0.3).
    (window as unknown as Record<string, unknown>).__taleEvent = (kind: string) => { if (kind === 'mail') startMail(); else if (kind === 'owl') startOwl(); else startKnock(); };
    (window as unknown as Record<string, unknown>).__taleIntro = (k: number) => { introTween = null; introK = k; };
    // For measuring: draw calls, textures, programs (renderer.info) and the scene itself.
    (window as unknown as Record<string, unknown>).__talePerf = { renderer, scene, camera, render, poke: (id: string) => toys.find((toy) => toy.id === id)?.poke() };
  }

  let coverTex: THREE.CanvasTexture | null = null;

  return {
    setCover(art) {
      if (!coverTex || coverTex.image !== art) {
        coverTex?.dispose();
        coverTex = colorTex(art);
        coverArt.map = coverTex;
        coverArt.color.set('#ffffff');
        coverArt.needsUpdate = true;
      }
      coverTex.needsUpdate = true;
    },
    setPages(firstPage, endpaperArt) {
      firstPageMat.map?.dispose();
      firstPageMat.map = colorTex(firstPage);
      firstPageMat.color.set('#ffffff');
      firstPageMat.needsUpdate = true;
      endpaper.map?.dispose();
      endpaper.map = colorTex(endpaperArt);
      endpaper.color.set('#ffffff');
      endpaper.needsUpdate = true;
    },
    setPortrait(art) {
      portraitMat.map?.dispose();
      portraitMat.map = colorTex(art);
      portraitMat.color.set('#ffffff');
      portraitMat.needsUpdate = true;
    },
    intro() {
      if (opts.reducedMotion || introK >= 1) {
        introK = 1;
        locked = false;
        return Promise.resolve();
      }
      return new Promise((resolve) => { introTween = { start: performance.now(), dur: 3200, done: resolve }; });
    },
    open() {
      locked = true;
      // Whatever was going on stops here: the room behind the open book is still and tidy.
      if (mailState === 'fly') { mailState = 'rest'; mailEnv.position.copy(MAIL_REST); mailEnv.rotation.set(0, 0.3, 0); mailEnv.scale.setScalar(1); }
      owlStage = 0;
      owl.visible = false;
      if (rbState !== 'hidden') { rbState = 'hidden'; rbBug.position.copy(RB_AWAY); rbCard.visible = false; scene.add(rbCard); rbCard.scale.setScalar(1); }
      gazeUntil = -1;
      hover = false;
      canvas.style.cursor = '';
      hoverToy = null;
      opts.onHover?.(null, 0, 0);
      opening = !opts.reducedMotion;
      return run(1, opts.reducedMotion ? 0 : 3600).then(() => {
        opening = false;
        // The book's own light has just filled the room: leave the lights on from here.
        if (darkOn) { darkOn = false; opts.onEvent?.('lights-on'); }
      });
    },
    close() {
      return run(0, 900).then(() => { locked = false; });
    },
    setBugHint(text) {
      paintBugHint(text);
    },
    visitor(kind) {
      callVisitor(kind);
    },
    setPaused(next) {
      if (paused === next) return;
      paused = next;
      if (!paused && !frame) {
        clock.getDelta();
        frame = requestAnimationFrame(loop);
      }
    },
    dispose() {
      cancelAnimationFrame(frame);
      paused = true;
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => {
          Object.values(mat).forEach((v) => { if (v instanceof THREE.Texture) v.dispose(); });
          mat.dispose();
        });
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
};
