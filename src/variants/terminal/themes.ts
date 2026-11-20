/** Colour palettes for the `theme` command. Each one becomes a set of CSS variables on the root. */
export interface Palette {
  page: string;
  window: string;
  bar: string;
  raised: string;
  border: string;
  text: string;
  dim: string;
  bright: string;
  green: string;
  amber: string;
  blue: string;
  violet: string;
  red: string;
  onAccent: string;
}

export const THEMES = ['mint', 'amber', 'crt', 'paper'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'mint';
export const THEME_STORAGE_KEY = 'terminal-theme';

export const isTheme = (value: string | null | undefined): value is Theme =>
  THEMES.some((name) => name === value);

export const PALETTES: Record<Theme, Palette> = {
  mint: {
    page: '#07090d',
    window: '#0f131a',
    bar: '#171c26',
    raised: '#1a202b',
    border: '#272f3d',
    text: '#d6dce6',
    dim: '#8a95a8',
    bright: '#ffffff',
    green: '#86e3a0',
    amber: '#f3c56b',
    blue: '#7fc4ff',
    violet: '#c5a8ff',
    red: '#ff8d85',
    onAccent: '#08130c',
  },
  amber: {
    page: '#0a0705',
    window: '#15100a',
    bar: '#1e170e',
    raised: '#241c11',
    border: '#3b2e1c',
    text: '#ecdcc0',
    dim: '#a8957a',
    bright: '#fff4dd',
    green: '#ffb454',
    amber: '#ffd98a',
    blue: '#7fd4c1',
    violet: '#f0a8c8',
    red: '#ff8170',
    onAccent: '#1c1000',
  },
  crt: {
    page: '#000000',
    window: '#030b05',
    bar: '#06140a',
    raised: '#081a0c',
    border: '#14401f',
    text: '#86f7a0',
    dim: '#4fb869',
    bright: '#d2ffdc',
    green: '#3dff70',
    amber: '#c4ff6a',
    blue: '#6affc8',
    violet: '#a5ffb8',
    red: '#ff7a66',
    onAccent: '#001a06',
  },
  paper: {
    page: '#e6e1d6',
    window: '#fbf8f1',
    bar: '#efebe0',
    raised: '#f2eee4',
    border: '#d6cfbf',
    text: '#2b303b',
    dim: '#636a78',
    bright: '#11141a',
    green: '#177245',
    amber: '#8a5600',
    blue: '#1558c0',
    violet: '#6a3fc4',
    red: '#b3261e',
    onAccent: '#ffffff',
  },
};

const VAR_NAMES: Record<keyof Palette, string> = {
  page: '--t-page',
  window: '--t-window',
  bar: '--t-bar',
  raised: '--t-raised',
  border: '--t-border',
  text: '--t-text',
  dim: '--t-dim',
  bright: '--t-bright',
  green: '--t-green',
  amber: '--t-amber',
  blue: '--t-blue',
  violet: '--t-violet',
  red: '--t-red',
  onAccent: '--t-on-accent',
};

/** CSS custom property declarations for one palette. */
export const paletteVars = (theme: Theme): string =>
  (Object.keys(VAR_NAMES) as (keyof Palette)[])
    .map((key) => `${VAR_NAMES[key]}: ${PALETTES[theme][key]};`)
    .join(' ');

export const readStoredTheme = (): Theme => {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export const storeTheme = (theme: Theme): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode: the theme simply lasts for this visit */
  }
};
