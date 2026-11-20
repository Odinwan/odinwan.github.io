import { useEffect, useState } from 'react';
import { Lang } from '../translations';

/** Every CV design the site can render. The order is the order of the switcher buttons. */
export const VARIANTS = [
  { id: 'classic', label: 'Classic', emoji: '📄', desc: { en: 'A clean, printable one-pager', ru: 'Строгая страница, готовая к печати' } },
  { id: 'reels', label: 'Reels', emoji: '📱', desc: { en: 'Swipeable stories, like a short-video feed', ru: 'Листаешь как ленту коротких видео' } },
  { id: 'terminal', label: 'Terminal', emoji: '⌨️', desc: { en: 'Type commands, get a CV back', ru: 'Вводишь команды — получаешь резюме' } },
  { id: 'chat', label: 'Chat', emoji: '💬', desc: { en: 'Ask questions in a messenger', ru: 'Задаёшь вопросы в мессенджере' } },
  { id: 'tale', label: 'Tale', emoji: '📖', desc: { en: 'A storybook on a table: open it and read', ru: 'Книга сказок на столе: открой и читай' } },
] as const satisfies ReadonlyArray<{ id: string; label: string; emoji: string; desc: Record<Lang, string> }>;

export type VariantId = (typeof VARIANTS)[number]['id'];

const isVariant = (v: string): v is VariantId => VARIANTS.some((x) => x.id === v);

/** The variant lives in the hash (`#/terminal`) so it works on static hosting and can be shared. */
const read = (): VariantId | null => {
  const v = window.location.hash.replace(/^#\/?/, '');
  return isVariant(v) ? v : null;
};

/** `null` returns to the entry screen with the design buttons. */
export const setVariant = (id: VariantId | null): void => {
  window.location.hash = id ? `/${id}` : '/';
};

export const useVariant = () => {
  const [variant, set] = useState<VariantId | null>(read);

  useEffect(() => {
    const fn = () => set(read());
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  return { variant, setVariant };
};
