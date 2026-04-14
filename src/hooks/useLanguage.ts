import { useEffect, useState } from 'react';
import { Lang } from '../translations';

type Listener = () => void;

const getInitial = (): Lang => {
  try {
    return (localStorage.getItem('portfolio-lang') as Lang) || 'en';
  } catch {
    return 'en';
  }
};

let current: Lang = getInitial();
const listeners = new Set<Listener>();

export const setLang = (lang: Lang): void => {
  current = lang;
  try { localStorage.setItem('portfolio-lang', lang); } catch { /* noop */ }
  listeners.forEach(fn => fn());
};

export const useLanguage = () => {
  const [, rerender] = useState(0);

  useEffect(() => {
    const fn = () => rerender(n => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return { lang: current, setLang };
};
