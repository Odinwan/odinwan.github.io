/**
 * Visit statistics via GoatCounter (https://www.goatcounter.com): no cookies, no
 * personal data, no consent banner needed. Nothing is sent until a site code is
 * set below, and never for visitors who have "Do Not Track" switched on.
 *
 * What is counted:
 *  - a page view per design opened, with the interface language  → /tale?lang=ru
 *  - CV downloads: which PDF, from which design, in which language
 *  - a few events: language switched, the Tale book opened
 */

/** The part before ".goatcounter.com" of your GoatCounter site. Empty = statistics off. */
const GOATCOUNTER_CODE = '';

interface GoatCounter {
  count(opts: { path: string; title?: string; event?: boolean }): void;
}

declare global {
  interface Window { goatcounter?: GoatCounter | { no_onload?: boolean } }
}

const enabled = (): boolean =>
  GOATCOUNTER_CODE !== '' && navigator.doNotTrack !== '1' && !/^(localhost|127\.|192\.168\.)/.test(location.hostname);

const queue: Array<{ path: string; title?: string; event?: boolean }> = [];
let loading = false;

const send = (hit: { path: string; title?: string; event?: boolean }): void => {
  if (!enabled()) return;
  const gc = window.goatcounter as GoatCounter | undefined;
  if (gc && typeof gc.count === 'function') { gc.count(hit); return; }
  queue.push(hit);
  if (loading) return;
  loading = true;
  // We count views ourselves (the site routes by hash), so the script must not auto-count.
  window.goatcounter = { no_onload: true };
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  script.onload = () => {
    const ready = window.goatcounter as GoatCounter | undefined;
    if (ready && typeof ready.count === 'function') queue.splice(0).forEach((h) => ready.count(h));
  };
  document.head.appendChild(script);
};

/** A design (or the chooser) was opened. */
export const trackView = (variant: string | null, lang: string): void => {
  send({ path: `/${variant ?? 'home'}?lang=${lang}`, title: `${variant ?? 'home'} (${lang})` });
};

/** Something happened that is not a page: `name` reads like a path, e.g. "cv-download/fullstack/tale/ru". */
export const trackEvent = (name: string): void => {
  send({ path: name, title: name, event: true });
};

/**
 * Counts every CV download on the site in one place: any click on a link to a PDF,
 * whichever design it sits in.
 */
export const watchDownloads = (context: () => { variant: string | null; lang: string }): (() => void) => {
  const onClick = (e: MouseEvent) => {
    const link = (e.target as HTMLElement | null)?.closest?.('a[href$=".pdf"]') as HTMLAnchorElement | null;
    if (!link) return;
    const file = (link.getAttribute('href') ?? '').split('/').pop()?.replace(/\.pdf$/i, '').replace(/^Vladislav_Cupnii_/, '') ?? 'cv';
    const { variant, lang } = context();
    trackEvent(`cv-download/${file}/${variant ?? 'home'}/${lang}`);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
};
