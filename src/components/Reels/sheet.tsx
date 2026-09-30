import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface SheetData {
  title: string;
  subtitle?: string;
  body: React.ReactNode;
}

/** Opens the details sheet. Provided by the feed; a no-op outside it. */
export const SheetContext = createContext<(data: SheetData) => void>(() => {});

export const useOpenSheet = () => useContext(SheetContext);

/** Drag distance (px) after which letting go of the sheet closes it. */
const CLOSE_DRAG = 90;

interface Props {
  data: SheetData | null;
  closeLabel: string;
  onClose: () => void;
}

/**
 * Bottom sheet with the full text of a reel, like Instagram's comments sheet:
 * light background for comfortable reading, a big close button, tap on the
 * backdrop or drag the header down to dismiss.
 */
const Sheet: React.FC<Props> = ({ data, closeLabel, onClose }) => {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!data) return;
    setDrag(0);
    bodyRef.current?.scrollTo({ top: 0 });
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, onClose]);

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    setDrag(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    if (drag > CLOSE_DRAG) onClose(); else setDrag(0);
    startY.current = null;
  };

  return (
    <div className={`sheet-layer ${data ? 'open' : ''}`} aria-hidden={!data}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={data?.title}
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
      >
        <div className="sheet-head" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <span className="grabber" aria-hidden="true" />
          <div className="sheet-titles">
            <strong>{data?.title}</strong>
            {data?.subtitle && <span>{data.subtitle}</span>}
          </div>
          <button type="button" className="sheet-close" onClick={onClose} ref={closeRef} aria-label={closeLabel}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="sheet-body" ref={bodyRef}>
          {data?.body}
        </div>
      </div>
    </div>
  );
};

export default Sheet;
