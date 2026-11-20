import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import type { Lang } from '../../translations';
import { useFonts } from '../useFonts';
import { buildBook, type Book, type PageCtx } from './pages';
import { S } from './strings';
import { Root, Switcher } from './Tale.styled';

const FONTS = 'https://fonts.googleapis.com/css2?family=Literata:ital,wght@0,400;0,600;1,400;1,600&family=Yeseva+One&family=Ruslan+Display&family=Uncial+Antiqua&display=swap';
const WIDE = '(min-width: 900px)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const LANGS: Lang[] = ['en', 'ru'];

const useMedia = (query: string): boolean =>
  useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

/** Page content that scrolls inside a fixed-height page, with a fade while more is below. */
const Scroller: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ scrollable: false, more: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const check = () => {
      const scrollable = el.scrollHeight - el.clientHeight > 2;
      const more = scrollable && el.scrollTop + el.clientHeight < el.scrollHeight - 4;
      setState((prev) => (prev.scrollable === scrollable && prev.more === more ? prev : { scrollable, more }));
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', check);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className={`scroller${state.more ? ' more' : ''}`}>
      {/* focusable only when it actually scrolls, so the keyboard can reach the overflow */}
      <div className="scroll" ref={ref} tabIndex={state.scrollable ? 0 : undefined}>
        <div className="scroll-in">{children}</div>
      </div>
      <div className="fade" aria-hidden="true" />
    </div>
  );
};

type Side = 'left' | 'right' | 'single';

interface PageProps {
  book: Book;
  index: number;
  side: Side;
  ctx: PageCtx;
  shortTitle: string;
}

/** One sheet of paper: running head, scrolling content, folio. An out-of-range index is a blank endpaper. */
const PageView: React.FC<PageProps> = ({ book, index, side, ctx, shortTitle }) => {
  const def = book.pages[index];
  if (!def) return <div className={`page ${side} blank`} />;
  if (def.cover) {
    return (
      <div className={`page ${side} cover`}>
        <div className="cover-frame">
          <Scroller>{def.render(ctx)}</Scroller>
        </div>
      </div>
    );
  }
  return (
    <div className={`page ${side}`}>
      <p className="running" aria-hidden="true">{side === 'left' ? shortTitle : def.title}</p>
      <Scroller>{def.render(ctx)}</Scroller>
      <p className="folio" aria-hidden="true">{index}</p>
    </div>
  );
};

const spreadOf = (page: number): number => Math.ceil(page / 2);
const firstOfSpread = (spread: number): number => (spread === 0 ? 0 : spread * 2 - 1);

const Arrow: React.FC<{ back?: boolean }> = ({ back }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path d={back ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Flip { from: number; dir: 1 | -1; id: number }

interface TaleProps {
  /** Shown inside a host scene: adds "Close the book" controls, Escape, and a transparent backdrop. */
  onClose?: () => void;
  /** Page to open at; the scene opens the cover itself, so it starts past it. */
  startPage?: number;
}

const Tale: React.FC<TaleProps> = ({ onClose, startPage = 0 }) => {
  const { lang, setLang } = useLanguage();
  useFonts(FONTS);
  const wide = useMedia(WIDE);
  const reduced = useMedia(REDUCED);
  const s = S[lang];
  const book = useMemo(() => buildBook(lang), [lang]);
  const last = book.pages.length - 1;

  const [rawPage, setPage] = useState(startPage);
  const [dir, setDir] = useState<1 | -1>(1);
  const [flip, setFlip] = useState<Flip | null>(null);
  const flipId = useRef(0);
  const page = Math.min(rawPage, last);
  const spread = spreadOf(page);
  const lastSpread = spreadOf(last);

  const go = useCallback((target: number) => {
    const next = Math.max(0, Math.min(last, target));
    if (wide) {
      const to = spreadOf(next);
      if (to === spread) { setPage(next); return; }
      const d = to > spread ? 1 : -1;
      flipId.current += 1;
      setFlip(reduced ? null : { from: spread, dir: d, id: flipId.current });
      setDir(d);
      setPage(firstOfSpread(to));
      return;
    }
    if (next === page) return;
    setDir(next > page ? 1 : -1);
    setPage(next);
  }, [last, wide, reduced, spread, page]);

  const prev = useCallback(() => go(wide ? firstOfSpread(spread - 1) : page - 1), [go, wide, spread, page]);
  const next = useCallback(() => go(wide ? firstOfSpread(Math.min(spread + 1, lastSpread)) : page + 1), [go, wide, spread, lastSpread, page]);

  // A flip never outlives the layout it was started in, nor a lost animationend.
  useEffect(() => { if (!wide) setFlip(null); }, [wide]);
  useEffect(() => {
    if (!flip) return undefined;
    const id = window.setTimeout(() => setFlip((f) => (f && f.id === flip.id ? null : f)), 1100);
    return () => window.clearTimeout(id);
  }, [flip]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': e.preventDefault(); next(); break;
        case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
        case 'Home': e.preventDefault(); go(0); break;
        case 'End': e.preventDefault(); go(last); break;
        case 'Escape': if (onClose) { e.preventDefault(); onClose(); } break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, last, onClose]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) next(); else prev();
  };

  // Jumping from inside a page unmounts the pressed button, so park focus on the book itself.
  const stage = useRef<HTMLElement>(null);
  const ctx = useMemo<PageCtx>(() => ({
    go: (target) => {
      go(target);
      stage.current?.focus({ preventScroll: true });
    },
    onClose,
  }), [go, onClose]);
  const sheet = (index: number, side: Side) => (
    <PageView key={index} book={book} index={index} side={side} ctx={ctx} shortTitle={s.shortTitle} />
  );

  const left = spread * 2 - 1;
  const right = spread * 2;
  const atStart = wide ? spread === 0 : page === 0;
  const atEnd = wide ? spread === lastSpread : page === last;
  const shownLast = wide ? Math.min(right, last) : page;

  let label = s.cover;
  if (wide && spread > 0) label = right <= last ? s.pages(left, right, last) : s.page(left, last);
  if (!wide && page > 0) label = s.page(page, last);
  const spoken = wide && spread > 0 && book.pages[right]
    ? `${label}. ${book.pages[left].title}; ${book.pages[right].title}`
    : `${label}. ${book.pages[page].title}`;

  let bookNode: React.ReactNode;
  if (wide) {
    const f = flip;
    const fLeft = f ? f.from * 2 - 1 : left;
    const fRight = f ? f.from * 2 : right;
    // While a leaf turns, the half it uncovers already shows the new page and the other half still shows the old one.
    const baseLeft = f && f.dir === 1 ? fLeft : left;
    const baseRight = f && f.dir === -1 ? fRight : right;
    bookNode = (
      <div className={`book${spread === 0 ? ' closed' : ''}`}>
        <div className="slot">{baseLeft >= 0 && sheet(baseLeft, 'left')}</div>
        <div className="slot">{sheet(baseRight, 'right')}</div>
        {f && (
          <div
            key={f.id}
            className={`leaf ${f.dir === 1 ? 'fwd' : 'back'}`}
            aria-hidden="true"
            onAnimationEnd={(e) => { if (e.target === e.currentTarget) setFlip(null); }}
          >
            <div className="face">{f.dir === 1 ? sheet(fRight, 'right') : fLeft >= 0 && sheet(fLeft, 'left')}</div>
            <div className="face rear">{f.dir === 1 ? sheet(left, 'left') : sheet(right, 'right')}</div>
          </div>
        )}
      </div>
    );
  } else {
    bookNode = (
      <div key={page} className={`sheet ${dir === 1 ? 'in-next' : 'in-prev'}`}>
        {sheet(page, 'single')}
      </div>
    );
  }

  return (
    <Root lang={lang} className={onClose ? 'in-scene' : undefined}>
      <header className="top">
        <h1 className="brand">{s.title}</h1>
        <Switcher />
        <div className="lang" role="group" aria-label={s.language}>
          {LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        {onClose && (
          <button type="button" className="close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
              <path d="M12 6 C9 4 5 4 3 5 V19 C5 18 9 18 12 20 C15 18 19 18 21 19 V5 C19 4 15 4 12 6 Z M12 6 V20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            {s.close}
          </button>
        )}
      </header>

      <main className="stage" ref={stage} tabIndex={-1} aria-label={s.bookLabel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {bookNode}
      </main>

      <nav className="bar" aria-label={s.bookLabel}>
        <div className="progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${last > 0 ? shownLast / last : 0})` }} />
        </div>
        <button type="button" className="round" onClick={prev} disabled={atStart} aria-label={s.prev} title={s.prev}>
          <Arrow back />
        </button>
        <button
          type="button"
          className="pill"
          onClick={() => go(book.contentsPage)}
          aria-current={page === book.contentsPage ? 'page' : undefined}
        >
          <svg viewBox="0 0 16 20" width="11" height="14" aria-hidden="true" focusable="false">
            <path d="M2 1 H14 V19 L8 14 L2 19 Z" fill="currentColor" />
          </svg>
          {s.toContents}
        </button>
        <p className="count">{label}</p>
        <button type="button" className="round" onClick={next} disabled={atEnd} aria-label={s.next} title={s.next}>
          <Arrow />
        </button>
      </nav>

      <p className="sr-only" aria-live="polite" aria-atomic="true">{spoken}</p>
    </Root>
  );
};

export default Tale;
