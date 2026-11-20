import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';
import VariantSwitcher from '../VariantSwitcher';
import { useFonts } from '../useFonts';
import Tale from '../tale/Tale';
import { Tomato } from '../tale/Tomato';
import { createCoverCanvas, paintCover, paintEndpaper, paintFirstPage, svgToImage } from './cover';
import FlatRoom from './FlatRoom';
import { QUIPS } from './quips';
import { Reader, Root } from './Scene.styled';
import type { Stage } from './stage3d';

const strings = {
  en: {
    title: ['The Tale of', 'Senior Tomato', 'of the Frontend'],
    open: 'Open the book',
    hint: 'Open the book to read. The duck, the laptop and the rest like to be poked.',
    scene: 'A candle-lit table with a storybook on it',
    lead: 'Once upon a time there lived a Senior Tomato of the Frontend…',
    next: 'And this is the tale of his road.',
    font: "'Uncial Antiqua'",
  },
  ru: {
    title: ['Сказка о', 'Сеньоре Помидоре', 'Фронтенда'],
    open: 'Открыть книгу',
    hint: 'Откройте книгу, чтобы читать. Уточку, ноутбук и всё остальное можно потрогать.',
    scene: 'Стол при свече, на нём лежит книга сказок',
    lead: 'Жил-был на свете Сеньор Помидор Фронтенда…',
    next: 'А это сказка о его пути-дороге.',
    font: "'Ruslan Display'",
  },
} as const;

/** Timings of the flat fallback; the 3D stage reports its own. */
const OPEN_MS = 900;
const CLOSE_MS = 600;

type Phase = 'table' | 'opening' | 'reading' | 'closing';
type Mode = 'loading' | '3d' | 'flat';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Scene: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const s = strings[lang];
  const tr = t[lang];
  useFonts('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700;1,500&family=Ruslan+Display&family=Uncial+Antiqua&display=swap');

  const [phase, setPhase] = useState<Phase>('table');
  const [mode, setMode] = useState<Mode>('loading');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const coverRef = useRef<HTMLCanvasElement | null>(null);
  const pagesRef = useRef<[HTMLCanvasElement, HTMLCanvasElement] | null>(null);
  const phaseRef = useRef<Phase>('table');
  const timer = useRef(0);
  phaseRef.current = phase;

  // Speech bubble over whatever was poked last.
  const [bubble, setBubble] = useState<{ id: string; n: number; x: number; y: number; key: number } | null>(null);
  const quipCount = useRef<Record<string, number>>({});
  const bubbleTimer = useRef(0);
  const say = useCallback((id: string, x: number, y: number) => {
    if (!QUIPS[id]) return;
    const n = quipCount.current[id] ?? 0;
    quipCount.current[id] = n + 1;
    setBubble({ id, n, x, y, key: Date.now() });
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 2900);
  }, []);
  const sayRef = useRef(say);
  sayRef.current = say;

  const open = useCallback(() => {
    if (phaseRef.current !== 'table') return;
    window.clearTimeout(timer.current);
    setBubble(null);
    const stage = stageRef.current;
    setPhase('opening');
    if (stage) {
      void stage.open().then(() => { setPhase('reading'); stage.setPaused(true); });
    } else if (reducedMotion()) {
      setPhase('reading');
    } else {
      timer.current = window.setTimeout(() => setPhase('reading'), OPEN_MS);
    }
  }, []);

  const close = useCallback(() => {
    if (phaseRef.current !== 'reading') return;
    window.clearTimeout(timer.current);
    const done = () => { setPhase('table'); openBtnRef.current?.focus({ preventScroll: true }); };
    const stage = stageRef.current;
    setPhase('closing');
    if (stage) {
      stage.setPaused(false);
      void stage.close().then(done);
    } else if (reducedMotion()) {
      done();
    } else {
      timer.current = window.setTimeout(done, CLOSE_MS);
    }
  }, []);

  const openRef = useRef(open);
  openRef.current = open;

  // Build the 3D table; fall back to the flat drawing if WebGL is not available.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let stage: Stage | null = null;

    import('./stage3d')
      .then(({ createStage }) => {
        if (cancelled) return;
        stage = createStage(canvas, {
          onBookClick: () => openRef.current(),
          onPoke: (id, x, y) => sayRef.current(id, x, y),
          reducedMotion: reducedMotion(),
        });
        stageRef.current = stage;
        setMode('3d');
      })
      .catch(() => { if (!cancelled) setMode('flat'); });

    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
      window.clearTimeout(bubbleTimer.current);
      stage?.dispose();
      stageRef.current = null;
    };
  }, []);

  // (Re)paint the cover: needs the web font and the hero drawing, and follows the language.
  useEffect(() => {
    if (mode !== '3d') return;
    let cancelled = false;
    const canvas = coverRef.current ?? (coverRef.current = createCoverCanvas());
    const [firstPage, endpaper] = pagesRef.current ?? (pagesRef.current = [createCoverCanvas(), createCoverCanvas()]);
    const text = { title: s.title, author: tr.intro.name, font: s.font };
    const svg = heroRef.current?.querySelector('svg');

    const paint = (hero: HTMLImageElement | null) => {
      if (cancelled) return;
      paintCover(canvas, text, hero);
      paintFirstPage(firstPage, { lead: s.lead, next: s.next, font: s.font }, hero);
      paintEndpaper(endpaper);
      stageRef.current?.setCover(canvas);
      stageRef.current?.setPages(firstPage, endpaper);
      if (hero) {
        // The same hero, hung on the wall in a gilt frame.
        const art = document.createElement('canvas');
        art.width = 440;
        art.height = 600;
        const g = art.getContext('2d')!;
        const bg = g.createRadialGradient(220, 260, 40, 220, 300, 380);
        bg.addColorStop(0, '#fff6dc');
        bg.addColorStop(1, '#d9b877');
        g.fillStyle = bg;
        g.fillRect(0, 0, 440, 600);
        g.drawImage(hero, 10, 110, 420, 420);
        stageRef.current?.setPortrait(art);
      }
    };

    const hero = svg ? svgToImage(svg, 512).catch(() => null) : Promise.resolve(null);
    // Paint at once with whatever font is there, then again when Lora has arrived.
    void hero.then(paint);
    const fonts = Promise.all([
      document.fonts.load(`400 100px ${s.font}`, s.title[1] + s.lead),
      document.fonts.load('italic 500 60px Lora', s.title[0]),
      document.fonts.load('500 46px Lora', tr.intro.name),
    ]).catch(() => null);
    void Promise.all([hero, fonts, new Promise((r) => setTimeout(r, 600))]).then(([img]) => paint(img));

    return () => { cancelled = true; };
  }, [mode, s, tr.intro.name]);

  const atTable = phase === 'table';

  return (
    <>
      <Root className={`phase-${phase} mode-${mode}`} style={{ '--fairy': s.font } as React.CSSProperties}>
        <canvas className="gl" ref={canvasRef} role="img" aria-label={s.scene} />
        <div className="paper" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
        <div className="dim" aria-hidden="true" />

        {mode === 'flat' && (
          <FlatRoom label={s.scene} title={s.title} author={tr.intro.name} disabled={!atTable} onOpen={open} />
        )}

        {/* Source drawing for the cover texture. */}
        <div className="hero-src" ref={heroRef} aria-hidden="true">
          <Tomato prop="laptop" crown cape />
        </div>

        {atTable && bubble && (() => {
          const lines = QUIPS[bubble.id][lang];
          // Keep the bubble on screen; the tail still points at the prop.
          const half = Math.min(150, window.innerWidth / 2 - 12);
          const w = window.innerWidth;
          const x = Math.min(Math.max(bubble.x, half + 8), Math.max(half + 8, w - half - 8));
          const y = Math.max(bubble.y, 120);
          return (
            <p
              className="bubble"
              key={bubble.key}
              role="status"
              style={{ left: x, top: y, '--tail': `${Math.max(-120, Math.min(120, bubble.x - x))}px` } as React.CSSProperties}
            >
              {lines[bubble.n % lines.length]}
            </p>
          );
        })()}

        {atTable && (
          <>
            <header className="bar">
              <VariantSwitcher className="variants" />
              <button type="button" className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>
                {lang === 'en' ? 'RU' : 'EN'}
              </button>
            </header>
            <p className="hint">
              <button type="button" ref={openBtnRef} onClick={open}>{s.open}</button>
              <span>{s.hint}</span>
            </p>
          </>
        )}
      </Root>

      {/* Outside Root on purpose: the book reader has its own styles and class names. */}
      {(phase === 'reading' || phase === 'closing') && (
        <Reader className={phase === 'closing' ? 'closing' : ''}>
          <Tale onClose={close} startPage={1} />
        </Reader>
      )}
    </>
  );
};

export default Scene;
