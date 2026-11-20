import React, { useCallback, useEffect, useRef, useState } from 'react';

const ArrowIcon: React.FC<{ dir: -1 | 1 }> = ({ dir }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 1 ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'} />
  </svg>
);

interface Props {
  className: string;
  /** Accessible name of the scrolling region. */
  label: string;
  prevLabel: string;
  nextLabel: string;
  /** Render the track as a `<ul>` (children must be `<li>`). */
  list?: boolean;
  /** Make the track itself focusable so arrow keys scroll it (for non-interactive content). */
  focusable?: boolean;
  /** Show position dots under the track; the number of items. */
  count?: number;
  /** When this value changes the track jumps back to the start. */
  resetKey?: string;
  children: React.ReactNode;
}

/**
 * A single horizontally scrolling row that makes its overflow obvious: edge state is
 * exposed as `data-prev` / `data-next` (the styles turn it into fades), mouse users
 * get arrow buttons, and an optional row of dots shows the position.
 */
export const Scroller: React.FC<Props> = ({ className, label, prevLabel, nextLabel, list, focusable, count, resetKey, children }) => {
  const track = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });
  const [index, setIndex] = useState(0);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const prev = el.scrollLeft > 4;
    const next = el.scrollLeft < max - 4;
    setEdges((old) => (old.prev === prev && old.next === next ? old : { prev, next }));

    if (count) {
      const first = el.firstElementChild as HTMLElement | null;
      const second = first?.nextElementSibling as HTMLElement | null;
      const step = first && second ? second.offsetLeft - first.offsetLeft : el.clientWidth;
      setIndex(!next && max > 4 ? count - 1 : Math.min(count - 1, Math.round(el.scrollLeft / Math.max(1, step))));
    }
  }, [count]);

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = 0;
    measure();
  }, [resetKey, measure]);

  const move = (dir: -1 | 1) => {
    const el = track.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.7), behavior: reduced ? 'auto' : 'smooth' });
  };

  const trackProps = {
    ref: (node: HTMLElement | null) => { track.current = node; },
    className: 'track',
    'aria-label': label,
    ...(focusable ? { tabIndex: 0, role: 'group' } : {}),
  };

  return (
    <div className={`scroller ${className}`} data-prev={edges.prev} data-next={edges.next}>
      {list ? <ul {...trackProps}>{children}</ul> : <div {...trackProps}>{children}</div>}

      {/* Pointer-only helpers: keyboard users reach everything by Tab or the arrow keys. */}
      <button type="button" className="nav prev" tabIndex={-1} aria-label={prevLabel} disabled={!edges.prev} onClick={() => move(-1)}>
        <ArrowIcon dir={-1} />
      </button>
      <button type="button" className="nav next" tabIndex={-1} aria-label={nextLabel} disabled={!edges.next} onClick={() => move(1)}>
        <ArrowIcon dir={1} />
      </button>

      {count ? (
        <div className="pager" aria-hidden="true">
          {Array.from({ length: count }, (_, i) => <i key={i} className={i === index ? 'on' : undefined} />)}
        </div>
      ) : null}
    </div>
  );
};
