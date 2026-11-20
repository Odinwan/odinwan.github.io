import { useEffect } from 'react';

/**
 * Loads a Google Fonts stylesheet for one variant only, e.g.
 * useFonts('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap').
 */
export const useFonts = (href: string): void => {
  useEffect(() => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
};
