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
  open(): Promise<void>;
  close(): Promise<void>;
  /** Stops rendering while the book is being read. */
  setPaused(paused: boolean): void;
  dispose(): void;
}

export interface StageOptions {
  onBookClick(): void;
  /** A prop was clicked; x/y are where its top is on screen, in CSS pixels of the canvas. */
  onPoke?(id: string, x: number, y: number): void;
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
  down.addColorStop(0, 'rgba(255,255,255,0.55)');
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
const kanbanCanvas = (): HTMLCanvasElement => {
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
    rampData[i] = Math.round(255 * (0.36 + 0.22 * band(x, 0.28) + 0.2 * band(x, 0.55) + 0.22 * band(x, 0.82)));
  }
  const ramp = new THREE.DataTexture(rampData, RAMP, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.LinearFilter;
  ramp.needsUpdate = true;

  const brush = colorTex(brushCanvas(), [1, 1]);

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

  const ink = new OutlineEffect(renderer, { defaultThickness: 0.0042, defaultColor: [0.13, 0.07, 0.05], defaultAlpha: 1 });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0914');
  scene.fog = new THREE.Fog('#0d0914', 2.2, 5.5);

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

  const windowGroup = new THREE.Group();
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
    const sill = new THREE.Mesh(new RoundedBoxGeometry(w + 0.16, 0.03, 0.1, 2, 0.008), darkWood);
    sill.position.set(0, -0.04, 0.04);
    windowGroup.add(barV, barH, sill);
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
  candleLight.shadow.mapSize.set(2048, 2048);
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
    toon({
      color: '#ffffff',
      transparent: true,
      opacity: 0.16,
      outline: false,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
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
  writing.position.set(-0.72, 0, -0.34);
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

  const tomato = new THREE.Group();
  const tomatoBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 40, 28),
    toon({ color: '#d92e18', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  );
  {
    // Gentle lobes and a dimple on top make it a tomato rather than a ball.
    const p = tomatoBody.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const a = Math.atan2(z, x);
      const lobe = 1 + 0.035 * Math.cos(a * 5) * (1 - Math.abs(y) / 0.036);
      const top = y > 0 ? 1 - 0.12 * Math.pow(y / 0.036, 6) : 1;
      p.setXYZ(i, x * lobe, y * 0.84 * top, z * lobe);
    }
    tomatoBody.geometry.computeVertexNormals();
  }
  tomato.add(tomatoBody);
  const leaf = toon({ color: '#3f8a3a', roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.026, 6), leaf);
    sepal.scale.z = 0.35;
    const a = (i / 5) * Math.PI * 2;
    sepal.position.set(Math.cos(a) * 0.011, 0.0275, Math.sin(a) * 0.011);
    sepal.rotation.set(0, -a, -Math.PI / 2 + 0.5, 'YXZ');
    tomato.add(sepal);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.003, 0.014, 8), leaf);
  stem.position.y = 0.034;
  stem.rotation.z = 0.25;
  tomato.add(stem);
  tomato.position.set(0.015, 0.066 + 0.03, 0.01);
  stack.add(tomato);
  stack.position.set(-0.36, 0, -0.5);
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
  const sandGlass = toon({ color: '#eaf6ff', transparent: true, opacity: 0.4, depthWrite: false });
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
  portrait.position.set(-0.18, 0.66, -1.28);
  portrait.rotation.z = 0.03;
  scene.add(shadow(portrait, false, true));

  // A lantern on a chain.
  const lantern = new THREE.Group();
  const iron = toon({ color: '#2a2230' });
  const lanternGlow = new THREE.MeshBasicMaterial({ color: '#ffc56a', toneMapped: false, fog: false });
  lantern.add(box(0.062, 0.095, 0.062, lanternGlow, 0, -0.06, 0));
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) lantern.add(box(0.008, 0.105, 0.008, iron, x * 0.033, -0.06, z * 0.033));
  lantern.add(box(0.085, 0.01, 0.085, iron, 0, -0.112, 0));
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

  // Bunting across the wall.
  const bunting = new THREE.Group();
  const FLAGS = 15;
  const sag = (k: number) => 0.86 - Math.sin(k * Math.PI) * 0.09;
  const flagColors = ['#d8402a', '#e9b44c', '#3f8a5a', '#3b62b8', '#9a5bd6'];
  const flags: THREE.Mesh[] = [];
  for (let i = 0; i < FLAGS; i++) {
    const k = (i + 0.5) / FLAGS;
    const tri = new THREE.Shape();
    tri.moveTo(-0.05, 0);
    tri.lineTo(0.05, 0);
    tri.lineTo(0, -0.11);
    tri.lineTo(-0.05, 0);
    const flag = new THREE.Mesh(new THREE.ShapeGeometry(tri), toon({ color: flagColors[i % flagColors.length], side: THREE.DoubleSide }));
    flag.position.set(-1.35 + k * 2.7, sag(k), 0);
    flags.push(flag);
    bunting.add(flag);
  }
  const cord = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 21 }, (_, i) => new THREE.Vector3(-1.35 + (i / 20) * 2.7, sag(i / 20), 0))), 40, 0.003, 6),
    iron,
  );
  bunting.add(cord);
  bunting.position.z = -1.27;
  scene.add(bunting);

  /* ----- more things on the table ----- */
  // A treasure chest at the back; click it and it opens.
  const chest = new THREE.Group();
  const chestWood = toon({ color: '#8a4f24' });
  chest.add(new THREE.Mesh(new RoundedBoxGeometry(0.21, 0.09, 0.13, 2, 0.006), chestWood));
  for (const x of [-0.07, 0.07]) chest.add(box(0.018, 0.094, 0.134, brass, x, 0, 0));
  chest.add(box(0.03, 0.036, 0.008, brass, 0, 0.02, 0.068));
  const chestLid = new THREE.Group();
  const lidShell = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.21, 24, 1, false, 0, Math.PI), chestWood);
  lidShell.rotation.z = Math.PI / 2;
  lidShell.position.z = 0.065;
  chestLid.add(lidShell);
  for (const x of [-0.07, 0.07]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.018, 24, 1, false, 0, Math.PI), brass);
    band.rotation.z = Math.PI / 2;
    band.position.set(x, 0, 0.065);
    chestLid.add(band);
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
  hat.position.set(-0.84, 0, -0.6);
  const hatY = hat.position.y;
  scene.add(shadow(hat));

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
  const ginger = toon({ color: '#ee8a2c', rim: 0.9 });
  const creamFur = toon({ color: '#fff1dc', rim: 0.6 });
  const earPink = toon({ color: '#ff9aa8', rim: 0 });
  const ball = (r: number, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  };
  const catBody = ball(0.05, ginger, 0, 0.058, 0, 0.95, 1.2, 0.9);
  cat.add(
    catBody,
    ball(0.03, creamFur, 0, 0.06, 0.032, 0.85, 1.25, 0.6),
    ball(0.03, ginger, -0.036, 0.028, 0.008), ball(0.03, ginger, 0.036, 0.028, 0.008),
    ball(0.013, creamFur, -0.016, 0.012, 0.046, 1, 0.8, 1.3), ball(0.013, creamFur, 0.016, 0.012, 0.046, 1, 0.8, 1.3),
  );
  // Stripes across the back.
  const stripe = toon({ color: '#b85a12', rim: 0 });
  for (const y of [0.07, 0.09, 0.108]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.046 - (y - 0.07) * 0.35, 0.0035, 6, 20, Math.PI), stripe);
    band.rotation.set(Math.PI / 2, 0, Math.PI);
    band.position.set(0, y, -0.004);
    cat.add(band);
  }
  const catHead = new THREE.Group();
  catHead.add(
    ball(0.04, ginger, 0, 0, 0, 1.08, 0.92, 0.95),
    ball(0.016, creamFur, -0.009, -0.012, 0.031, 1.1, 0.8, 0.8), ball(0.016, creamFur, 0.009, -0.012, 0.031, 1.1, 0.8, 0.8),
    ball(0.0042, earPink, 0, -0.004, 0.045),
  );
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.032, 4), ginger);
    ear.position.set(sx * 0.025, 0.036, 0);
    ear.rotation.set(0, Math.PI / 4, -sx * 0.28);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.02, 4), earPink);
    inner.position.set(sx * 0.025, 0.034, 0.006);
    inner.rotation.copy(ear.rotation);
    catHead.add(ear, inner);
    for (const dy of [-0.004, 0.004]) {
      const whisker = box(0.03, 0.0011, 0.0011, new THREE.MeshBasicMaterial({ color: '#fff6e6' }), sx * 0.034, -0.012 + dy, 0.034);
      whisker.rotation.z = sx * dy * 30;
      catHead.add(whisker);
    }
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#c8ff5a', toneMapped: false, fog: false });
  const catEyes = [-1, 1].map((sx) => {
    const eye = new THREE.Group();
    eye.add(new THREE.Mesh(new THREE.SphereGeometry(0.0068, 12, 10), eyeMat));
    eye.add(box(0.0022, 0.0095, 0.002, new THREE.MeshBasicMaterial({ color: '#16101a' }), 0, 0, 0.0062));
    eye.position.set(sx * 0.0155, 0.006, 0.033);
    catHead.add(eye);
    return eye;
  });
  catHead.position.set(0, 0.132, 0.012);
  // The tail lies on the sill, curled round the paws the way a sitting cat keeps it.
  const catTail = new THREE.Group();
  const tailPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.04, 0, 0.004), new THREE.Vector3(-0.062, 0, 0.04),
    new THREE.Vector3(-0.05, 0, 0.08), new THREE.Vector3(-0.018, 0, 0.098), new THREE.Vector3(0.012, 0, 0.096),
  ]);
  catTail.add(new THREE.Mesh(new THREE.TubeGeometry(tailPath, 32, 0.0095, 10), ginger));
  catTail.add(ball(0.0105, creamFur, 0.012, 0, 0.096));
  catTail.position.set(0, 0.011, -0.04);
  cat.add(catHead, catTail);
  cat.position.set(0.09, -0.025, 0.02);
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
  cauldron.position.set(-0.6, 0, -0.8);
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
  duck.position.set(0.2, 0, 0.1);
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
    toon({ color: '#ffffff', outline: false, rim: 0 }),
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
  const shutter = toon({ color: '#c8ccd8', gloss: 0.8 });
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
  const caseWood = toon({ color: '#6a3f24' });
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
      const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.13, 2, 0.004), toon({ color: spineColors[Math.floor(caseRand() * spineColors.length)] }));
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
  const crtOn = colorTex(labelCanvas('> hello, world_', '#062010', '#5dff8a', 320, 220));
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
    g.add(new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.028, 0.09, 2, 0.006), toon({ color: '#eef0f6', gloss: 0.4 })));
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
    p.setXYZ(0, wx - 0.2, 0.82, -1.27);
    p.setXYZ(1, wx + 0.2, 0.82, -1.27);
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
  interface Toy { id: string; root: THREE.Object3D; poke(): void; bounce: boolean; hoverK: number; base: number }
  const toys: Toy[] = [];
  const addToy = (id: string, root: THREE.Object3D, poke: () => void, bounce = true) => {
    toys.push({ id, root, poke, bounce, hoverK: 0, base: root.scale.x });
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
  addToy('hat', hat, () => { hatAt = now; });
  addToy('crystals', crystals, () => { orbAt = now; });
  addToy('orbGroup', orbGroup, () => {
    orbAt = now;
    orbHue = (orbHue + 1) % ORBS.length;
    orbMat.emissive.set(ORBS[orbHue]);
    orbMat.color.set(ORBS[orbHue]).lerp(new THREE.Color('#ffffff'), 0.45);
    orbLight.color.set(ORBS[orbHue]);
  }, false);

  /* ----- camera rig ----- */
  const camHome = new THREE.Vector3();
  const lookHome = new THREE.Vector3();
  const camRead = new THREE.Vector3(-0.02, 0.52, 0.2);
  const lookRead = new THREE.Vector3(-0.02, 0.02, -0.1);
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
    lantern.visible = half > 1.2;
  };

  /* ----- interaction ----- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hover = false;
  let locked = false; // true while opening / open / closing
  let progress = 0; // 0 closed, 1 open
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
    hover = what === 'book';
    hoverToy = what && what !== 'book' ? what : null;
    canvas.style.cursor = what ? 'pointer' : '';
  };
  const onClick = (e: MouseEvent) => {
    if (locked) return;
    const what = pick(e);
    if (what === 'book') { opts.onBookClick(); return; }
    if (!what) return;
    what.poke();
    if (opts.onPoke) {
      // Anchor the speech bubble just above the thing that was poked.
      const bounds = new THREE.Box3().setFromObject(what.root);
      const top = new THREE.Vector3((bounds.min.x + bounds.max.x) / 2, bounds.max.y, (bounds.min.z + bounds.max.z) / 2).project(camera);
      const rect = canvas.getBoundingClientRect();
      opts.onPoke(what.id, ((top.x + 1) / 2) * rect.width, ((1 - top.y) / 2) * rect.height);
    }
  };
  const onLeave = () => { hover = false; hoverToy = null; canvas.style.cursor = ''; };
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
  const still = opts.reducedMotion;

  const render = () => {
    const t = clock.getElapsedTime();

    if (tween) {
      const k = Math.min(1, (performance.now() - tween.start) / tween.dur);
      progress = tween.from + (tween.to - tween.from) * ease(k);
      if (k >= 1) {
        const done = tween.done;
        tween = null;
        done();
      }
    }

    // The cover lifts a little under the pointer, as if inviting you in.
    peek += ((hover ? 1 : 0) - peek) * 0.12;
    const coverK = THREE.MathUtils.clamp((progress - 0.06) / 0.86, 0, 1);
    hinge.rotation.z = Math.max(peek * 0.07 * (1 - progress), coverK * OPEN_ANGLE);
    strapDrop.visible = progress < 0.03;

    if (!still) {
      sway.x += (pointer.x - sway.x) * 0.05;
      sway.y += (pointer.y - sway.y) * 0.05;
    }
    const breath = still ? 0 : Math.sin(t * 0.6) * 0.004;
    camNow.copy(camHome).lerp(camRead, progress);
    lookNow.copy(lookHome).lerp(lookRead, progress);
    const free = 1 - progress;
    camera.position.set(camNow.x + sway.x * 0.07 * free, camNow.y - sway.y * 0.035 * free + breath * free, camNow.z);
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
      if (toy.bounce) toy.root.scale.setScalar(toy.base * (1 + 0.08 * toy.hoverK));
    });

    // Candle: blow it out and the moon takes over.
    litK += ((candleLit ? 1 : 0) - litK) * 0.09;
    flame.visible = litK > 0.03;
    flame.scale.multiplyScalar(Math.max(litK, 0.001));
    halo.material.opacity = litK;
    candleLight.intensity *= litK;
    waxMat.emissiveIntensity *= litK;
    poolMat.emissiveIntensity = 0.5 * litK;
    hemi.intensity = 1.0 + (1 - litK) * 0.7;
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
      tomato.rotation.y = ease(hop) * Math.PI * 2;
    } else {
      tomato.position.y = tomatoY;
      tomato.rotation.y = 0;
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
    hat.position.y = hatY + (hh >= 0 && hh < 1 ? Math.sin(hh * Math.PI) * 0.09 : 0);
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
    catHead.rotation.z = awake * 0.4;
    catHead.rotation.y = still ? 0 : Math.sin(t * 0.4) * 0.12;
    catTail.rotation.y = still ? 0 : Math.sin(t * (1.1 + awake * 5)) * (0.05 + awake * 0.1);
    catBody.scale.y = 1.2 + (still ? 0 : Math.sin(t * 1.6) * 0.025);
    const blink = still ? 1 : (t % 4.2 < 0.14 ? 0.12 : 1);
    catEyes.forEach((eye) => { eye.scale.y = blink; });

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
      sp.material.opacity = Math.sin(k * Math.PI) * 0.22;
    });

    // The closed book glows and twinkles; the glow fades as it opens.
    const closed = 1 - Math.min(1, progress * 2.5);
    const pulse = still ? 0.8 : 0.72 + 0.28 * Math.sin(t * 2.2);
    bookGlow.material.opacity = (0.34 + 0.2 * pulse + 0.22 * peek) * closed;
    bookLight.intensity = (0.1 + 0.08 * pulse + 0.1 * peek) * closed;
    const rim = { color: [1, 0.78 + 0.1 * pulse, 0.3], thickness: 0.0042 + (0.0035 * pulse + 0.003 * peek) * closed };
    const inkRim = { color: [0.13, 0.07, 0.05], thickness: 0.0042 };
    leatherMat.userData.outlineParameters = closed > 0.02 ? rim : inkRim;
    coverArt.userData.outlineParameters = closed > 0.02 ? rim : inkRim;
    twinkles.forEach((sp) => {
      const i = sp.userData.i as number;
      const a = (still ? 0 : t * 0.5) + (i / twinkles.length) * Math.PI * 2;
      const blink = Math.pow(Math.max(0, Math.sin(t * 2.4 + i * 1.9)), 3);
      sp.position.set(
        book.position.x + Math.cos(a) * 0.19,
        0.06 + 0.07 * (0.5 + 0.5 * Math.sin(a * 2 + i)),
        book.position.z + Math.sin(a) * 0.24,
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

    ink.render(scene, camera);
  };

  const loop = () => {
    render();
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
    open() {
      locked = true;
      hover = false;
      canvas.style.cursor = '';
      hoverToy = null;
      return run(1, 1700);
    },
    close() {
      return run(0, 900).then(() => { locked = false; });
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
