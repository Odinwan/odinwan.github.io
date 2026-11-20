import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';
import { loadFonts, useFonts } from '../useFonts';
import Tale, { FONTS as BOOK_FONTS } from '../tale/Tale';
import { Tomato } from '../tale/Tomato';
import { createCoverCanvas, paintCover, paintEndpaper, paintFirstPage, svgToImage } from './cover';
import FlatRoom from './FlatRoom';
import { LETTERS, NAMES, OWL_LETTERS, QUIPS } from './quips';
import { duckAmbience, isSoundOn, play, preloadSounds, setAmbienceTrack, setAudioAwake, setSoundOn, startAmbience, stopAmbience } from './sfx';
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
    welcomeTitle: 'Welcome to the tale',
    welcome: [
      'There is no hurry here. This is Senior Tomato’s room, and nearly everything in it can be played with: the cat, the chest, the hat, the laptop, the light cord…',
      'Poke about. And when you have had your fill, open the book — the CV is inside.',
    ],
    welcomeGo: 'Have a look round',
    welcomeNote: 'A hint is always under the “?” button.',
    owl: 'Call the post owl',
    post: 'A letter on the wind',
    knock: 'A knock at the door',
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
    welcomeTitle: 'Добро пожаловать в сказку',
    welcome: [
      'Спешить тут некуда. Это комната Сеньора Помидора, и почти со всем в ней можно поиграть: кот, сундук, шляпа, ноутбук, шнурок от света…',
      'Потрогайте всё подряд. А когда наиграетесь — откройте книгу: резюме внутри.',
    ],
    welcomeGo: 'Осмотреться',
    welcomeNote: 'Подсказка всегда под кнопкой «?».',
    owl: 'Позвать почтовую сову',
    post: 'Письмо с ветром',
    knock: 'Стук в дверь',
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

const SCENE_FONTS = 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Ruslan+Display&family=Uncial+Antiqua&display=swap';
/** Every face the room and the book use, fetched behind the loader so no text re-flows later. */
/** The picture for the frame on the wall: the hero in some pose, on a painted sunburst. */
const portraitArt = (hero: HTMLImageElement): HTMLCanvasElement => {
  const art = document.createElement('canvas');
  art.width = 440;
  art.height = 600;
  const g = art.getContext('2d')!;
  const bg = g.createRadialGradient(220, 280, 40, 220, 300, 400);
  bg.addColorStop(0, '#fff6dc');
  bg.addColorStop(1, '#d9b877');
  g.fillStyle = bg;
  g.fillRect(0, 0, 440, 600);
  g.save();
  g.translate(220, 300);
  g.fillStyle = 'rgba(200, 50, 26, 0.13)';
  for (let i = 0; i < 12; i++) {
    g.rotate(Math.PI / 6);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-48, -520);
    g.lineTo(48, -520);
    g.closePath();
    g.fill();
  }
  g.restore();
  g.drawImage(hero, 10, 110, 420, 420);
  return art;
};

const fontsReady = (): Promise<unknown> => Promise.all([
  loadFonts(SCENE_FONTS, ['500 16px Lora', '600 16px Lora', '700 16px Lora', 'italic 500 16px Lora', "400 16px 'Ruslan Display'", "400 16px 'Uncial Antiqua'"]),
  loadFonts(BOOK_FONTS, ['400 16px Literata', '600 16px Literata', 'italic 400 16px Literata', 'italic 600 16px Literata', "400 16px 'Yeseva One'"]),
]);

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
  useFonts(SCENE_FONTS);

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
  const dark = useRef(false);
  const posesRef = useRef<HTMLDivElement>(null);
  const portraitN = useRef(0);
  /** The letter lying open on screen, as an index into LETTERS. */
  const [letter, setLetter] = useState<{ owl: boolean; n: number } | null>(null);
  const letterCount = useRef({ post: 0, owl: 0 });
  /** Who brought the letter now lying on the table. */
  const byOwl = useRef(false);
  const bubbleTimer = useRef(0);
  const [tag, setTag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [sound, setSound] = useState(isSoundOn);
  const toggleSound = () => { const next = !sound; setSound(next); setSoundOn(next); if (next) { preloadSounds(); startAmbience(); play('lantern'); } };
  const download = useCallback(() => {
    play('cvScroll');
    const link = document.createElement('a');
    link.href = CV_URL;
    // Same name as every other download link on the site: the file's own.
    link.download = CV_URL.split('/').pop() ?? '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  const say = useCallback((id: string, x: number, y: number) => {
    if (id === 'bugDone') trackEvent('tale/bug-caught');
    if (id === 'portrait') {
      // A new pose in the frame with every touch.
      const poses = posesRef.current?.querySelectorAll('svg');
      if (poses?.length) {
        const next = poses[portraitN.current++ % poses.length];
        void svgToImage(next, 512).then((img) => stageRef.current?.setPortrait(portraitArt(img))).catch(() => undefined);
      }
    }
    if (id === 'mail') {
      play('cvScroll');
      trackEvent(byOwl.current ? 'tale/letter-owl' : 'tale/letter');
      window.setTimeout(() => play('wand'), 550);
      setBubble(null);
      setLetter(byOwl.current ? { owl: true, n: letterCount.current.owl++ } : { owl: false, n: letterCount.current.post++ });
      return;
    }
    if (id === 'cvScroll') download(); else play(id === 'cord' ? 'lantern' : id === 'bug' ? 'wand' : id === 'bugDone' ? 'cvScroll' : id === 'portrait' ? 'hat' : id);
    if (id === 'cord') {
      // The cord flips the room between day and lights-out; the music follows.
      dark.current = !dark.current;
      if (dark.current) trackEvent('tale/lights-out');
      setAmbienceTrack(dark.current ? 'ambience-night' : 'ambience-day');
    }
    // The cord says one thing when the light goes and another when it comes back.
    const line = id === 'cord' && !dark.current ? 'cordOn' : id;
    if (!QUIPS[line]) return;
    const n = quipCount.current[line] ?? 0;
    quipCount.current[line] = n + 1;
    setBubble({ id: line, n, x, y, key: Date.now() });
    window.clearTimeout(bubbleTimer.current);
    // The thank-you for a caught bug comes last in a long sequence: give it time to be read.
    bubbleTimer.current = window.setTimeout(() => setBubble(null), id === 'bugDone' ? 6000 : 2900);
  }, [download]);
  // The "what to do here" plaque: open on first visit (on big screens), then remembered.
  const [help, setHelp] = useState(() => {
    try {
      const saved = localStorage.getItem('tale-help');
      if (saved) return saved === 'open';
    } catch { /* noop */ }
    // Closed by default: the welcome note greets a newcomer, and the plaque stays one tap away.
    return false;
  });
  // A word of welcome, once per visit to the site.
  const [welcome, setWelcome] = useState(() => {
    try { return sessionStorage.getItem('tale-welcome') !== 'seen'; } catch { return true; }
  });
  const closeWelcome = useCallback(() => {
    setWelcome(false);
    try { sessionStorage.setItem('tale-welcome', 'seen'); } catch { /* noop */ }
  }, []);
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
    // Fonts get a few seconds; a slow font server must not keep the door shut.
    const fonts = Promise.race([fontsReady(), new Promise((r) => { window.setTimeout(r, 3500); })]);

    import('./stage3d')
      .then(({ createStage }) => {
        if (cancelled) return;
        stage = createStage(canvas, {
          onBookClick: () => openRef.current(),
          onPoke: (id, x, y) => sayRef.current(id, x, y),
          onHover: (id, x, y) => setTag(id ? { id, x, y } : null),
          onEvent: (kind) => {
            if (kind === 'lights-on') { dark.current = false; setAmbienceTrack('ambience-day'); return; }
            if (kind === 'owl-bump') { play('owlBump'); return; }
            if (kind === 'bug-jar') { play('bugJar'); return; }
            if (kind === 'mail' || kind === 'mail-owl') { byOwl.current = kind === 'mail-owl'; play('windowGroup'); }
            else if (kind === 'mail-land') play('hat');
            else {
              // Someone at the door, out of the picture on the left: the words come from there.
              play('knock');
              const n = quipCount.current.knock ?? 0;
              quipCount.current.knock = n + 1;
              setBubble({ id: 'knock', n, x: 0, y: window.innerHeight * 0.42, key: Date.now() });
              window.clearTimeout(bubbleTimer.current);
              // Longer than a prop's quip: nobody was looking that way when it started.
              bubbleTimer.current = window.setTimeout(() => setBubble(null), 6000);
            }
          },
          reducedMotion: reducedMotion(),
        });
        stageRef.current = stage;
        setMode('3d');
        preloadSounds();
        startAmbience();
        // Keep the loader up while the first frames compile, and never just flash it.
        const shown = performance.now() - startedAt;
        const beat = new Promise((r) => { window.setTimeout(r, Math.max(700, 1400 - shown)); });
        void Promise.all([beat, fonts]).then(() => {
          if (cancelled || !stage) return;
          setLoaderGone(true);
          void stage.intro().then(() => { if (!cancelled) setArrived(true); });
        });
      })
      .catch(() => {
        if (cancelled) return;
        setMode('flat');
        void fonts.then(() => {
          if (cancelled) return;
          setLoaderGone(true);
          setArrived(true);
        });
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
      window.clearTimeout(bubbleTimer.current);
      stopAmbience();
      setAmbienceTrack('ambience-day');
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
      // The same hero, hung on the wall in a gilt frame.
      if (hero) stageRef.current?.setPortrait(portraitArt(hero));
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

  // Escape dismisses the welcome note.
  useEffect(() => {
    if (!welcome) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWelcome(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [welcome, closeWelcome]);

  // A hidden tab makes no sound; the browser already stops drawing it.
  useEffect(() => {
    const onVisibility = () => setAudioAwake(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // The sign above the bug speaks the visitor's language (and waits for the font it is painted in).
  useEffect(() => {
    if (mode !== '3d') return;
    const word = lang === 'ru' ? 'Лови!' : 'Catch it!';
    stageRef.current?.setBugHint(word);
    void document.fonts.load('700 56px Lora', word).then(() => stageRef.current?.setBugHint(word)).catch(() => undefined);
  }, [mode, lang]);

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
        {/* Other poses for the portrait on the wall, hung one after another as it is clicked. */}
        <div className="hero-src" ref={posesRef} aria-hidden="true">
          <Tomato prop="wave" crown cape />
          <Tomato prop="star" cape />
          <Tomato prop="flag" crown cape />
          <Tomato prop="chest" cape />
          <Tomato prop="bindle" cape />
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
              className={`bubble${bubble.id === 'knock' || bubble.id === 'bugDone' ? ' long' : ''}`}
              key={bubble.key}
              role="status"
              style={{ left: x, top: y, '--tail': `${Math.max(-120, Math.min(120, bubble.x - x))}px` } as React.CSSProperties}
            >
              {lines[bubble.n % lines.length]}
            </p>
          );
        })()}

        {atTable && welcome && (
          <div className="welcome" role="dialog" aria-label={s.welcomeTitle}>
            <button type="button" className="welcome-veil" onClick={closeWelcome} aria-label={s.welcomeGo} />
            <article>
              <Tomato prop="wave" crown cape className="welcome-hero" />
              <h2>{s.welcomeTitle}</h2>
              {s.welcome.map((line) => <p key={line}>{line}</p>)}
              <button type="button" className="welcome-go" onClick={closeWelcome} autoFocus>{s.welcomeGo}</button>
              <p className="welcome-note">{s.welcomeNote}</p>
            </article>
          </div>
        )}

        {atTable && letter !== null && (() => {
          const pile = (letter.owl ? OWL_LETTERS : LETTERS)[lang];
          const note = pile[letter.n % pile.length];
          return (
            <div className="letter" role="dialog" aria-label={lang === 'ru' ? 'Письмо' : 'A letter'}>
              <button type="button" className="letter-back" onClick={() => setLetter(null)} aria-label={lang === 'ru' ? 'Закрыть письмо' : 'Close the letter'} />
              {/* The envelope arrives, its flap lifts, light spills out and the letter rises from it. */}
              <span className="letter-glow" aria-hidden="true" />
              <span className="env" aria-hidden="true"><i className="flap" /><i className="seal" /></span>
              <article>
                <p className="letter-text">{note.text}</p>
                <p className="letter-from">— {note.from}</p>
                <button type="button" className="letter-ok" onClick={() => setLetter(null)}>{lang === 'ru' ? 'Приятно. Спасибо!' : 'How kind. Thank you!'}</button>
              </article>
            </div>
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
            {/* Visitors on request; they also turn up by themselves now and then. */}
            {mode === '3d' && (
              <div className="callers" role="group">
                <button type="button" onClick={() => stageRef.current?.visitor('owl')} aria-label={s.owl} title={s.owl}>🦉</button>
                <button type="button" onClick={() => stageRef.current?.visitor('mail')} aria-label={s.post} title={s.post}>✉️</button>
                <button type="button" onClick={() => stageRef.current?.visitor('knock')} aria-label={s.knock} title={s.knock}>🚪</button>
              </div>
            )}
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
