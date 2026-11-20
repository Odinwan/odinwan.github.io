import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';
import { useFonts } from '../useFonts';
import Tale from '../tale/Tale';
import { Tomato } from '../tale/Tomato';
import { createCoverCanvas, paintCover, paintEndpaper, paintFirstPage, svgToImage } from './cover';
import FlatRoom from './FlatRoom';
import { NAMES, QUIPS } from './quips';
import { duckAmbience, isSoundOn, play, preloadSounds, setSoundOn, startAmbience, stopAmbience } from './sfx';
import { CV_URL } from '../../data/links';
import { trackEvent } from '../../analytics';
import { Reader, Root } from './Scene.styled';
import type { Stage } from './stage3d';

const strings = {
  en: {
    title: ['The Tale of', 'Senior Tomato', 'of the Frontend'],
    open: 'Open the book',
    hint: 'Open the book to read. The duck, the laptop and the rest like to be poked.',
    scene: 'A candle-lit table with a storybook on it',
    helpTitle: 'What to do here',
    help: [
      'Click the book to open it and read the CV',
      'Poke things: the duck, the cat, the laptop, the chest — they answer back',
      'The glowing scroll is the CV itself — click it to download the PDF',
      'In the book: arrows or ← → turn pages, Esc closes it',
    ],
    helpTouch: [
      'Tap the book to open it and read the CV',
      'Tap things: the duck, the cat, the laptop, the chest — they answer back',
      'The glowing scroll is the CV itself — tap it to download the PDF',
      'In the book: swipe or tap the arrows to turn pages',
    ],
    loading: 'The tale is opening',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    download: 'Take the CV scroll (PDF)',
    helpOpen: 'How to play',
    helpClose: 'Hide the hint',
    lead: 'Once upon a time there lived a Senior Tomato of the Frontend…',
    next: 'And this is the tale of his road.',
    font: "'Uncial Antiqua'",
  },
  ru: {
    title: ['Сказка о', 'Сеньоре Помидоре', 'Фронтенда'],
    open: 'Открыть книгу',
    hint: 'Откройте книгу, чтобы читать. Уточку, ноутбук и всё остальное можно потрогать.',
    scene: 'Стол при свече, на нём лежит книга сказок',
    helpTitle: 'Что тут можно делать',
    help: [
      'Нажмите на книгу — она откроется, внутри резюме',
      'Тыкайте в предметы: уточка, кот, ноутбук, сундук — они отвечают',
      'Светящийся свиток — это само резюме: клик скачает PDF',
      'В книге: стрелки или ← → листают страницы, Esc закрывает',
    ],
    helpTouch: [
      'Нажмите на книгу — она откроется, внутри резюме',
      'Тапайте по предметам: уточка, кот, ноутбук, сундук — они отвечают',
      'Светящийся свиток — это само резюме: тап скачает PDF',
      'В книге: листайте свайпом или стрелками',
    ],
    loading: 'Сказка открывается',
    soundOn: 'Звук включён',
    soundOff: 'Звук выключен',
    download: 'Забрать свиток с резюме (PDF)',
    helpOpen: 'Как играть',
    helpClose: 'Скрыть подсказку',
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
  /** The loader is gone and the camera has finished gliding in. */
  const [arrived, setArrived] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
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
  const [tag, setTag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sound, setSound] = useState(isSoundOn);
  const toggleSound = () => { const next = !sound; setSound(next); setSoundOn(next); if (next) { preloadSounds(); startAmbience(); play('lantern'); } };
  const download = useCallback(() => {
    play('cvScroll');
    const link = document.createElement('a');
    link.href = CV_URL;
    // An explicit, human file name rather than whatever the browser derives.
    link.download = 'Vladislav_Cupnii_CV.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  const say = useCallback((id: string, x: number, y: number) => {
    if (id === 'cvScroll') download(); else play(id);
    if (!QUIPS[id]) return;
    const n = quipCount.current[id] ?? 0;
    quipCount.current[id] = n + 1;
    setBubble({ id, n, x, y, key: Date.now() });
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 2900);
  }, [download]);
  // The "what to do here" plaque: open on first visit (on big screens), then remembered.
  const [help, setHelp] = useState(() => {
    try {
      const saved = localStorage.getItem('tale-help');
      if (saved) return saved === 'open';
    } catch { /* noop */ }
    return window.matchMedia('(min-width: 701px)').matches;
  });
  const toggleHelp = (next: boolean) => {
    setHelp(next);
    try { localStorage.setItem('tale-help', next ? 'open' : 'closed'); } catch { /* noop */ }
  };
  const touch = window.matchMedia('(pointer: coarse)').matches;

  const sayRef = useRef(say);
  sayRef.current = say;

  const open = useCallback(() => {
    if (phaseRef.current !== 'table') return;
    window.clearTimeout(timer.current);
    setBubble(null);
    play('bookOpen');
    trackEvent('tale/book-open');
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
    play('bookClose');
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

  const turn = useCallback(() => play('page'), []);

  const openRef = useRef(open);
  openRef.current = open;

  // Build the 3D table; fall back to the flat drawing if WebGL is not available.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let stage: Stage | null = null;
    const startedAt = performance.now();

    import('./stage3d')
      .then(({ createStage }) => {
        if (cancelled) return;
        stage = createStage(canvas, {
          onBookClick: () => openRef.current(),
          onPoke: (id, x, y) => sayRef.current(id, x, y),
          onHover: (id, x, y) => setTag(id ? { id, x, y } : null),
          reducedMotion: reducedMotion(),
        });
        stageRef.current = stage;
        setMode('3d');
        preloadSounds();
        startAmbience();
        // Keep the loader up while the first frames compile, and never just flash it.
        const shown = performance.now() - startedAt;
        window.setTimeout(() => {
          if (cancelled || !stage) return;
          setLoaderGone(true);
          void stage.intro().then(() => { if (!cancelled) setArrived(true); });
        }, Math.max(700, 1400 - shown));
      })
      .catch(() => {
        if (cancelled) return;
        setMode('flat');
        setLoaderGone(true);
        setArrived(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
      window.clearTimeout(bubbleTimer.current);
      stopAmbience();
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

  // The background steps back while the book is open.
  useEffect(() => { duckAmbience(phase === 'reading'); }, [phase]);

  const atTable = phase === 'table' && arrived;

  return (
    <>
      <Root className={`phase-${phase} mode-${mode}${loaderGone ? ' shown' : ''}`} style={{ '--fairy': s.font } as React.CSSProperties}>
        <canvas className="gl" ref={canvasRef} role="img" aria-label={s.scene} />
        <div className="paper" aria-hidden="true" />
        {!loaderGone && (
          <div className="loader" role="status">
            <Tomato prop="wave" crown className="loader-hero" />
            <p>{s.loading}<span className="dots"><i>.</i><i>.</i><i>.</i></span></p>
            <span className="loader-bar"><i /></span>
          </div>
        )}
        <div className="vignette" aria-hidden="true" />
        <div className="dim" aria-hidden="true" />
        <div className="flash" aria-hidden="true" />

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

        {atTable && tag && !bubble && NAMES[tag.id] && (
          <span className="tag" style={{ left: Math.min(Math.max(tag.x, 70), window.innerWidth - 70), top: Math.max(tag.y, 70) }}>
            {NAMES[tag.id][lang]}
          </span>
        )}

        {atTable && (
          <>
            <header className="bar">
              <button
                type="button"
                className="lang sound"
                onClick={toggleSound}
                aria-pressed={sound}
                aria-label={sound ? s.soundOn : s.soundOff}
                title={sound ? s.soundOn : s.soundOff}
              >
                {sound ? '♪' : <s>♪</s>}
              </button>
              <button type="button" className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>
                {lang === 'en' ? 'RU' : 'EN'}
              </button>
            </header>
            <p className="hint">
              <button type="button" ref={openBtnRef} onClick={open}>{s.open}</button>
              <button type="button" className="second" onClick={download}>↓ {s.download}</button>
            </p>
            {help ? (
              <aside className="help" aria-label={s.helpTitle}>
                <button type="button" className="help-x" onClick={() => toggleHelp(false)} aria-label={s.helpClose} title={s.helpClose}>✕</button>
                <h2>{s.helpTitle}</h2>
                <ul>
                  {(touch ? s.helpTouch : s.help).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </aside>
            ) : (
              <button type="button" className="help-open" onClick={() => toggleHelp(true)} aria-label={s.helpOpen} title={s.helpOpen}>?</button>
            )}
          </>
        )}
      </Root>

      {/* Outside Root on purpose: the book reader has its own styles and class names. */}
      {(phase === 'reading' || phase === 'closing') && (
        <Reader className={phase === 'closing' ? 'closing' : ''}>
          <Tale onClose={close} startPage={1} onTurn={turn} />
        </Reader>
      )}
    </>
  );
};

export default Scene;
