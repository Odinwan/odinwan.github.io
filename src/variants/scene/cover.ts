/** Paints the front cover of the book on the table: leather, gold tooling, title and the hero. */

const W = 1024;
const H = 1414;

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

export interface CoverText {
  title: readonly [string, string, string];
  author: string;
  /** CSS font-family of the storybook lettering, already loaded. */
  font: string;
}

export interface PageText {
  /** Opening words; the first letter becomes the illuminated initial. */
  lead: string;
  next: string;
  font: string;
}

/** Turns an inline <svg> from the page into an image that a canvas can draw. */
export const svgToImage = (svg: SVGSVGElement, size: number): Promise<HTMLImageElement> => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));
  clone.removeAttribute('class');
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

const goldFill = (g: CanvasRenderingContext2D, y0: number, y1: number): CanvasGradient => {
  const grad = g.createLinearGradient(0, y0, 0, y1);
  grad.addColorStop(0, '#f9e3a2');
  grad.addColorStop(0.5, '#e0ae4d');
  grad.addColorStop(1, '#c08a2c');
  return grad;
};

const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

/** Shrinks the font until the line fits the cover. */
const fitText = (g: CanvasRenderingContext2D, text: string, font: (px: number) => string, px: number, max: number): number => {
  let size = px;
  g.font = font(size);
  while (g.measureText(text).width > max && size > 20) {
    size -= 2;
    g.font = font(size);
  }
  return size;
};

export const createCoverCanvas = (): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
};

export const paintCover = (canvas: HTMLCanvasElement, text: CoverText, hero: HTMLImageElement | null): void => {
  const g = canvas.getContext('2d')!;
  const r = seeded(7);

  // Leather.
  const base = g.createRadialGradient(W * 0.6, H * 0.3, 80, W * 0.5, H * 0.5, H * 0.8);
  base.addColorStop(0, '#8a2434');
  base.addColorStop(0.6, '#6d1622');
  base.addColorStop(1, '#4a0d17');
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(255, 200, 190, ${r() * 0.05})` : `rgba(20, 0, 4, ${r() * 0.1})`;
    const s = 1 + r() * 3;
    g.fillRect(r() * W, r() * H, s, s);
  }
  // The groove where the cover bends at the spine.
  const groove = g.createLinearGradient(40, 0, 96, 0);
  groove.addColorStop(0, 'rgba(0,0,0,0)');
  groove.addColorStop(0.5, 'rgba(0,0,0,0.38)');
  groove.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = groove;
  g.fillRect(40, 0, 56, H);

  // Gold tooling: a double frame with corner flourishes.
  const L = 120;
  const T = 84;
  const FW = W - L - 76;
  const FH = H - T * 2;
  g.strokeStyle = goldFill(g, T, T + FH);
  g.lineWidth = 9;
  roundRect(g, L, T, FW, FH, 16);
  g.stroke();
  g.lineWidth = 3;
  roundRect(g, L + 22, T + 22, FW - 44, FH - 44, 8);
  g.stroke();
  g.lineWidth = 4;
  for (const [cx, cy, sx, sy] of [[L + 22, T + 22, 1, 1], [L + FW - 22, T + 22, -1, 1], [L + 22, T + FH - 22, 1, -1], [L + FW - 22, T + FH - 22, -1, -1]]) {
    g.beginPath();
    g.moveTo(cx + sx * 86, cy);
    g.quadraticCurveTo(cx + sx * 30, cy + sy * 30, cx, cy + sy * 86);
    g.stroke();
    g.beginPath();
    g.arc(cx + sx * 40, cy + sy * 40, 7, 0, Math.PI * 2);
    g.fillStyle = '#e9bd62';
    g.fill();
  }

  const cx = L + FW / 2;
  const max = FW - 130;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.shadowColor = 'rgba(0, 0, 0, 0.45)';
  g.shadowBlur = 6;
  g.shadowOffsetY = 3;

  const italic = (px: number) => `italic 500 ${px}px Lora, Georgia, serif`;
  const bold = (px: number) => `400 ${px}px ${text.font}, Lora, Georgia, serif`;

  g.fillStyle = goldFill(g, 220, 270);
  fitText(g, text.title[0], italic, 76, max);
  g.fillText(text.title[0], cx, 270);

  // The middle line carries the name; wrap it onto two lines if it is long.
  const words = text.title[1].split(' ');
  g.font = bold(132);
  const lines = g.measureText(text.title[1]).width > max && words.length > 1
    ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
    : [text.title[1]];
  let y = 410;
  lines.forEach((line) => {
    const size = fitText(g, line, bold, 132, max);
    g.fillStyle = goldFill(g, y - size, y);
    g.fillText(line, cx, y);
    y += size * 1.12;
  });

  g.fillStyle = goldFill(g, y - 50, y);
  fitText(g, text.title[2], italic, 76, max);
  g.fillText(text.title[2], cx, y - 24);
  g.shadowColor = 'transparent';

  // Medallion with the hero.
  const R = 178;
  const my = Math.max(y + 215, 880);
  g.fillStyle = goldFill(g, my - R, my + R);
  g.beginPath();
  g.arc(cx, my, R + 14, 0, Math.PI * 2);
  g.fill();
  const paper = g.createRadialGradient(cx - 40, my - 60, 20, cx, my, R);
  paper.addColorStop(0, '#fffaf0');
  paper.addColorStop(1, '#f1dfb8');
  g.fillStyle = paper;
  g.beginPath();
  g.arc(cx, my, R, 0, Math.PI * 2);
  g.fill();
  if (hero) {
    g.save();
    g.beginPath();
    g.arc(cx, my, R - 4, 0, Math.PI * 2);
    g.clip();
    const size = R * 1.86;
    g.drawImage(hero, cx - size / 2, my - size / 2 + 8, size, size);
    g.restore();
  }

  // Small stars either side, and the author line.
  g.fillStyle = '#e9bd62';
  for (const dx of [-R - 76, R + 76]) {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? 20 : 8;
      const a = (Math.PI * i) / 5 - Math.PI / 2;
      g.lineTo(cx + dx + rad * Math.cos(a), my + rad * Math.sin(a));
    }
    g.closePath();
    g.fill();
  }

  g.fillStyle = goldFill(g, H - T - 150, H - T - 100);
  const author = text.author.toUpperCase().split('').join(' ');
  fitText(g, author, (px) => `700 ${px}px Lora, Georgia, serif`, 54, max);
  g.fillText(author, cx, H - T - 96);
};

const parchment = (g: CanvasRenderingContext2D, seed: number) => {
  const r = seeded(seed);
  const base = g.createRadialGradient(W * 0.5, H * 0.45, 100, W * 0.5, H * 0.5, H * 0.75);
  base.addColorStop(0, '#f8ecc9');
  base.addColorStop(0.75, '#ecd9a8');
  base.addColorStop(1, '#d3b578');
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(120, 80, 30, ${r() * 0.05})`;
    const s = 1 + r() * 4;
    g.fillRect(r() * W, r() * H, s, s);
  }
  // A few age stains.
  for (let i = 0; i < 7; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 40 + r() * 110;
    const stain = g.createRadialGradient(x, y, 0, x, y, rad);
    stain.addColorStop(0, 'rgba(140, 95, 40, 0.1)');
    stain.addColorStop(1, 'rgba(140, 95, 40, 0)');
    g.fillStyle = stain;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
};

const wrap = (g: CanvasRenderingContext2D, text: string, max: number): string[] => {
  const lines: string[] = [];
  let line = '';
  text.split(' ').forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && g.measureText(next).width > max) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
};

/** The first page of the book, seen for a moment as the cover swings open. */
export const paintFirstPage = (canvas: HTMLCanvasElement, text: PageText, hero: HTMLImageElement | null): void => {
  const g = canvas.getContext('2d')!;
  parchment(g, 23);

  // Border: red rule, gold rule, and a knot in each corner.
  const M = 70;
  g.strokeStyle = '#a3261c';
  g.lineWidth = 6;
  g.strokeRect(M, M, W - M * 2, H - M * 2);
  g.strokeStyle = '#c9972f';
  g.lineWidth = 3;
  g.strokeRect(M + 16, M + 16, W - M * 2 - 32, H - M * 2 - 32);
  for (const [x, y] of [[M + 8, M + 8], [W - M - 8, M + 8], [M + 8, H - M - 8], [W - M - 8, H - M - 8]]) {
    g.fillStyle = '#a3261c';
    g.beginPath();
    g.arc(x, y, 20, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e8c15f';
    g.beginPath();
    g.arc(x, y, 9, 0, Math.PI * 2);
    g.fill();
  }

  // Illuminated initial.
  const initial = text.lead.charAt(0);
  const rest = text.lead.slice(1);
  const TX = 140;
  const TY = 170;
  const TS = 250;
  const tile = g.createLinearGradient(TX, TY, TX + TS, TY + TS);
  tile.addColorStop(0, '#d8402a');
  tile.addColorStop(1, '#8e1c16');
  g.fillStyle = tile;
  roundRect(g, TX, TY, TS, TS, 18);
  g.fill();
  g.strokeStyle = goldFill(g, TY, TY + TS);
  g.lineWidth = 9;
  roundRect(g, TX + 5, TY + 5, TS - 10, TS - 10, 14);
  g.stroke();
  g.lineWidth = 2.5;
  roundRect(g, TX + 22, TY + 22, TS - 44, TS - 44, 8);
  g.stroke();
  g.fillStyle = goldFill(g, TY + 40, TY + TS - 40);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `400 190px ${text.font}, Georgia, serif`;
  g.fillText(initial, TX + TS / 2, TY + TS / 2 + 10);

  // Opening words, flowing around the initial and then across the page.
  g.fillStyle = '#3a2418';
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const size = 68;
  g.font = `400 ${size}px ${text.font}, Georgia, serif`;
  const lh = size * 1.32;
  let y = TY + size;
  const words = rest.trim().split(' ');
  let line = '';
  const flush = () => {
    if (!line) return;
    const beside = y < TY + TS + size * 0.4;
    g.fillText(line, beside ? TX + TS + 34 : TX, y);
    y += lh;
    line = '';
  };
  words.forEach((word) => {
    const beside = y < TY + TS + size * 0.4;
    const max = beside ? W - (TX + TS + 34) - 130 : W - TX * 2;
    const next = line ? `${line} ${word}` : word;
    if (line && g.measureText(next).width > max) {
      flush();
      line = word;
    } else {
      line = next;
    }
  });
  flush();

  y = Math.max(y, TY + TS + 70) + 26;
  g.fillStyle = '#5a4030';
  g.font = `italic 500 50px Lora, Georgia, serif`;
  wrap(g, text.next, W - TX * 2).forEach((l) => {
    g.fillText(l, TX, y);
    y += 68;
  });

  // Flourish and the hero below.
  y += 20;
  g.strokeStyle = '#a3261c';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W / 2 - 190, y);
  g.bezierCurveTo(W / 2 - 100, y - 26, W / 2 - 70, y + 26, W / 2 - 22, y);
  g.moveTo(W / 2 + 190, y);
  g.bezierCurveTo(W / 2 + 100, y - 26, W / 2 + 70, y + 26, W / 2 + 22, y);
  g.stroke();
  g.fillStyle = '#c9972f';
  g.beginPath();
  g.arc(W / 2, y, 10, 0, Math.PI * 2);
  g.fill();

  if (hero) {
    const sz = Math.min(430, H - M - 60 - (y + 40));
    if (sz > 180) g.drawImage(hero, W / 2 - sz / 2, y + 40, sz, sz);
  }
};

/** Inside of the cover: a quiet lattice, symmetrical so its orientation never matters. */
export const paintEndpaper = (canvas: HTMLCanvasElement): void => {
  const g = canvas.getContext('2d')!;
  parchment(g, 29);
  g.fillStyle = 'rgba(122, 31, 43, 0.16)';
  g.fillRect(0, 0, W, H);
  const step = 128;
  g.strokeStyle = 'rgba(122, 31, 43, 0.45)';
  g.lineWidth = 3;
  for (let x = -H; x < W + H; x += step) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + H, H);
    g.moveTo(x + H, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  g.fillStyle = '#c9972f';
  for (let y = 0; y <= H + step; y += step / 2) {
    for (let x = (Math.round(y / (step / 2)) % 2) * (step / 2); x <= W + step; x += step) {
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
    }
  }
};
