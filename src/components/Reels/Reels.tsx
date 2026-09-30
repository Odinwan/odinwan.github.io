import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from './Reels.styled';
import { buildReels, ChapterKey, CV_URL } from './slides';
import { HeartIcon, DownloadIcon, MailIcon, ShareIcon, ArrowIcon } from './icons';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const LIKES_KEY = 'portfolio-likes';
const DOUBLE_TAP_MS = 300;

const readLikes = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

interface Burst { key: number; x: number; y: number }

const Reels: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const tr = t[lang];
  const reels = useMemo(() => buildReels(lang), [lang]);

  const feedRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [likes, setLikes] = useState<Set<string>>(readLikes);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  const chapters = useMemo(() => {
    const order: ChapterKey[] = [];
    reels.forEach((r) => { if (!order.includes(r.chapter)) order.push(r.chapter); });
    return order.map((key) => ({
      key,
      first: reels.findIndex((r) => r.chapter === key),
      count: reels.filter((r) => r.chapter === key).length,
    }));
  }, [reels]);

  const current = reels[active] ?? reels[0];

  const goTo = useCallback((index: number) => {
    const feed = feedRef.current;
    if (!feed) return;
    const i = Math.max(0, Math.min(reels.length - 1, index));
    feed.scrollTo({ top: i * feed.clientHeight, behavior: 'smooth' });
  }, [reels.length]);

  // Track which reel fills the screen.
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const items = Array.from(feed.querySelectorAll<HTMLElement>('[data-reel]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.reel));
        });
      },
      { root: feed, threshold: 0.6 },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  // Keyboard navigation for desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (['ArrowDown', 'PageDown', 'j'].includes(e.key)) { e.preventDefault(); goTo(active + 1); }
      if (['ArrowUp', 'PageUp', 'k'].includes(e.key)) { e.preventDefault(); goTo(active - 1); }
      if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      if (e.key === 'End') { e.preventDefault(); goTo(reels.length - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, goTo, reels.length]);

  // Keep the active chapter tab visible on phones.
  useEffect(() => {
    const tabs = tabsRef.current;
    const tab = tabs?.querySelector<HTMLElement>('.on');
    if (!tabs || !tab) return;
    tabs.scrollTo({ left: tab.offsetLeft - tabs.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' });
  }, [current.chapter]);

  const setLiked = (id: string, liked: boolean) => {
    setLikes((prev) => {
      const next = new Set(prev);
      if (liked) next.add(id); else next.delete(id);
      try { localStorage.setItem(LIKES_KEY, JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  };

  // Double tap / double click anywhere on a reel likes it, like on Instagram.
  const onPointerUp = (e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    const now = e.timeStamp;
    const prev = lastTap.current;
    const close = Math.abs(e.clientX - prev.x) < 30 && Math.abs(e.clientY - prev.y) < 30;
    if (now - prev.time < DOUBLE_TAP_MS && close) {
      const box = e.currentTarget.getBoundingClientRect();
      setLiked(id, true);
      setBurst({ key: now, x: e.clientX - box.left, y: e.clientY - box.top });
      lastTap.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTap.current = { time: now, x: e.clientX, y: e.clientY };
    }
  };

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  };

  const share = async () => {
    const url = window.location.href.split('#')[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast(tr.ui.copied);
    } catch { /* cancelled */ }
  };

  const liked = likes.has(current.id);
  const paletteVars = { '--bg': current.palette.bg, '--fg': current.palette.fg } as React.CSSProperties;

  return (
    <Layout>
      <aside className="side">
        <div className="me">
          <img src="/photo.jpg" alt="" />
          <div>
            <strong>{tr.intro.name}</strong>
            <span>{tr.intro.role}</span>
          </div>
        </div>
        <nav className="chapters" aria-label={tr.ui.chapters}>
          {chapters.map((c) => (
            <button
              type="button"
              key={c.key}
              className={current.chapter === c.key ? 'on' : ''}
              onClick={() => goTo(c.first)}
            >
              <span>{tr.chapters[c.key]}</span>
              {c.count > 1 && <em>{c.count}</em>}
            </button>
          ))}
        </nav>
        <a className="cv-big" href={CV_URL} download>↓ {tr.ui.downloadCv}</a>
        <p className="keys">↑ ↓ · J K</p>
      </aside>

      <div className="phone" style={paletteVars}>
        <div className="progress" aria-hidden="true">
          <i style={{ transform: `scaleX(${(active + 1) / reels.length})` }} />
        </div>

        <div className="tabs" ref={tabsRef} role="tablist" aria-label={tr.ui.chapters}>
          {chapters.map((c) => (
            <button
              type="button"
              role="tab"
              aria-selected={current.chapter === c.key}
              key={c.key}
              className={current.chapter === c.key ? 'on' : ''}
              onClick={() => goTo(c.first)}
            >
              {tr.chapters[c.key]}
            </button>
          ))}
        </div>

        <a className="cv-pill" href={CV_URL} download aria-label={tr.ui.downloadCv}>↓ {tr.ui.cv}</a>

        <div className="feed" ref={feedRef}>
          {reels.map((r, i) => (
            <section
              key={`${lang}-${r.id}`}
              data-reel={i}
              className={`reel reel-${r.id.split('-')[0]} ${i === active ? 'active' : ''}`}
              style={{ '--bg': r.palette.bg, '--fg': r.palette.fg } as React.CSSProperties}
              onPointerUp={(e) => onPointerUp(e, r.id)}
              aria-label={`${i + 1} / ${reels.length}`}
            >
              {r.deco && <span className="deco" aria-hidden="true">{r.deco}</span>}
              {r.content}
              <div className="sound" aria-hidden="true">
                <span className="note">♫</span>
                <span className="marquee"><span>{tr.ui.sound} · {tr.ui.sound} · </span></span>
              </div>
              {burst && i === active && (
                <span key={burst.key} className="burst" style={{ left: burst.x, top: burst.y }} aria-hidden="true">
                  <HeartIcon filled />
                </span>
              )}
            </section>
          ))}
        </div>

        <div className="rail">
          <button type="button" className="avatar" onClick={() => goTo(0)} aria-label={tr.intro.name}>
            <img src="/photo.jpg" alt="" />
          </button>
          <button
            type="button"
            className={`act ${liked ? 'liked' : ''}`}
            onClick={() => setLiked(current.id, !liked)}
            aria-pressed={liked}
          >
            <span className="ico"><HeartIcon filled={liked} /></span>
            <span className="lbl">{tr.ui.like}</span>
          </button>
          <a className="act cv" href={CV_URL} download>
            <span className="ico"><DownloadIcon /></span>
            <span className="lbl">{tr.ui.cv}</span>
          </a>
          <button type="button" className="act" onClick={() => goTo(reels.length - 1)}>
            <span className="ico"><MailIcon /></span>
            <span className="lbl">{tr.ui.contact}</span>
          </button>
          <button type="button" className="act" onClick={share}>
            <span className="ico"><ShareIcon /></span>
            <span className="lbl">{tr.ui.share}</span>
          </button>
          <button type="button" className="act" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>
            <span className="ico lang">{lang === 'en' ? 'RU' : 'EN'}</span>
            <span className="lbl">{lang === 'en' ? 'Русский' : 'English'}</span>
          </button>
          <div className="steps">
            <button type="button" className="act" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={tr.ui.prev}>
              <span className="ico"><ArrowIcon up /></span>
            </button>
            <button type="button" className="act" onClick={() => goTo(active + 1)} disabled={active === reels.length - 1} aria-label={tr.ui.next}>
              <span className="ico"><ArrowIcon /></span>
            </button>
          </div>
          <span className="counter">{active + 1}/{reels.length}</span>
        </div>

        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </Layout>
  );
};

export default Reels;
