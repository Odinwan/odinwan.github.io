import { useEffect } from 'react';

/**
 * Loads a Google Fonts stylesheet for one variant only, e.g.
 * useFonts('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap').
 */
/**
 * Resolves once the given faces of a stylesheet are downloaded and usable, so a screen can
 * hold its loader instead of showing text that re-flows when the font lands.
 * Faces are CSS font shorthands, e.g. `italic 600 16px Literata`.
 */
export const loadFonts = (href: string, faces: string[], sample = 'AaЯя'): Promise<void> => {
  let link = document.querySelector<HTMLLinkElement>(`link[href="${href}"]`);
  const sheet = new Promise<void>((resolve) => {
    if (link?.sheet) { resolve(); return; }
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
    link.addEventListener('load', () => resolve(), { once: true });
    link.addEventListener('error', () => resolve(), { once: true });
  });
  return sheet
    .then(() => Promise.all(faces.map((face) => document.fonts.load(face, sample))))
    .then(() => undefined, () => undefined);
};

export const useFonts = (href: string): void => {
  useEffect(() => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
};
