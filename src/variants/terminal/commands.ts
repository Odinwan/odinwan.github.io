import { Lang, t } from '../../translations';
import { THEMES } from './themes';

/** Widened view of the `as const` translations, so both languages share one shape. */
export interface Job {
  role: string;
  company: string;
  period: string;
  current: boolean;
  note?: string;
  items: readonly string[];
}

export interface Fact { val: string; lbl: string }

export interface Project {
  kicker: string;
  title: string;
  desc: string;
  tech: readonly string[];
  facts?: readonly Fact[];
}

export interface ContactLink { label: string; value: string; href: string }

export const getJobs = (lang: Lang): readonly Job[] => t[lang].experience.jobs;
export const getProjects = (lang: Lang): readonly Project[] => t[lang].projects.list;
export const getContactLinks = (lang: Lang): readonly ContactLink[] => t[lang].contact.links;

export type HelpGroupId = 'read' | 'reach' | 'session';

/** `help`, grouped by what the visitor wants to do. */
export const HELP_GROUPS: readonly { id: HelpGroupId; cmds: readonly string[] }[] = [
  { id: 'read', cmds: ['about', 'stats', 'experience', 'projects', 'skills'] },
  { id: 'reach', cmds: ['contact', 'cv'] },
  { id: 'session', cmds: ['next', 'tour', 'ls', 'theme', 'lang', 'clear', 'help'] },
];

/** Tappable commands in the dock, in display order. */
export const CHIP_COMMANDS = [
  'about', 'stats', 'experience', 'projects', 'skills', 'contact', 'cv', 'theme', 'help', 'clear',
] as const;

/** Everything Tab can complete (listed commands plus the unlisted ones). */
export const ALL_COMMANDS: readonly string[] = [
  ...HELP_GROUPS.flatMap((g) => g.cmds),
  'timeline', 'open', 'cat', 'neofetch', 'whoami', 'sudo', 'pwd', 'echo', 'exit',
];

export const HELP_ARGS: Record<string, string> = {
  experience: '[n]',
  projects: '[n]',
  lang: 'en|ru',
  theme: '[name]',
};

const ALIASES: Record<string, string> = {
  '?': 'help',
  man: 'help',
  commands: 'help',
  exp: 'experience',
  jobs: 'experience',
  work: 'experience',
  career: 'experience',
  timeline: 'experience',
  project: 'projects',
  stack: 'skills',
  email: 'contact',
  contacts: 'contact',
  resume: 'cv',
  cls: 'clear',
  n: 'next',
  themes: 'theme',
  banner: 'neofetch',
  quit: 'exit',
  logout: 'exit',
  dir: 'ls',
  ll: 'ls',
};

export interface Parsed { name: string; args: string[] }

export const parse = (raw: string): Parsed => {
  const [first = '', ...args] = raw.trim().split(/\s+/);
  const lower = first.toLowerCase();
  return { name: ALIASES[lower] ?? lower, args };
};

export const isLang = (value: string | undefined): value is Lang => value === 'en' || value === 'ru';

const range = (n: number): string[] => Array.from({ length: n }, (_, i) => String(i + 1));

const JOB_COUNT = getJobs('en').length;
const PROJECT_COUNT = getProjects('en').length;

/* ---------- the "filesystem": what `ls` prints and `cat` / `cd` / `open` accept ---------- */

export const FILES: readonly { name: string; cmd: string }[] = [
  { name: 'about.md', cmd: 'about' },
  { name: 'stats.json', cmd: 'stats' },
  { name: 'experience/', cmd: 'experience' },
  { name: 'projects/', cmd: 'projects' },
  { name: 'skills.json', cmd: 'skills' },
  { name: 'contact.vcf', cmd: 'contact' },
  { name: 'cv.pdf', cmd: 'cv' },
];

/** Commands that take a file or an item number and are rewritten by `resolve`. */
export const OPENERS: readonly string[] = ['open', 'cat', 'cd', 'less', 'more'];

export type ListCommand = 'experience' | 'projects';

/**
 * Rewrites shell-flavoured input into the real command: a bare number opens that item of
 * the list on screen (`3`), `open 3`, `cat about.md`, `cd projects/2`, `./cv.pdf`.
 * Anything it cannot place is returned unchanged.
 */
export const resolve = (raw: string, list: ListCommand): string => {
  const text = raw.trim();
  const [first = '', second] = text.split(/\s+/);
  const head = first.toLowerCase();
  if (/^\d+$/.test(head) && second === undefined) return `${list} ${head}`;

  let target: string | undefined;
  if (head.startsWith('./') && head.length > 2) target = head.slice(2);
  else if (OPENERS.includes(head)) target = second?.toLowerCase();
  if (!target) return text;

  if (/^\d+$/.test(target)) return `${list} ${target}`;
  const match = target.replace(/^(\.\/|~\/)/, '').match(/^([a-z]+)(?:\.[a-z]+|\/(\d+)?)?$/);
  if (!match) return text;
  const base = ALIASES[match[1]] ?? match[1];
  if (!FILES.some((f) => f.cmd === base)) return text;
  return match[2] ? `${base} ${match[2]}` : base;
};

/* ---------- the tour: the whole CV in reading order ---------- */

export const TOUR: readonly string[] = [
  'about',
  'stats',
  'experience',
  ...range(JOB_COUNT).map((n) => `experience ${n}`),
  'projects',
  ...range(PROJECT_COUNT).map((n) => `projects ${n}`),
  'skills',
  'contact',
  'cv',
];

const tourIndex = (raw: string): number => {
  const { name, args } = parse(raw);
  return TOUR.indexOf(args[0] ? `${name} ${args[0]}` : name);
};

/** 1-based position of a command in the tour, or 0 when it is not part of it. */
export const tourStep = (raw: string): number => tourIndex(raw) + 1;

/** The command after `raw` in the tour: `undefined` if `raw` is not a tour step, `null` at the end. */
export const tourAfter = (raw: string): string | null | undefined => {
  const index = tourIndex(raw);
  if (index < 0) return undefined;
  return TOUR[index + 1] ?? null;
};

/* ---------- career timeline ---------- */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const toMonth = (text: string): number | null => {
  const match = text.trim().match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  return month < 0 ? null : Number(match[2]) * 12 + month;
};

export interface Timeline {
  /** First year on the axis. */
  from: number;
  /** Years on the axis. */
  years: number;
  /** Per job: offset and length as a 0–1 share of the axis, or null if its period is unreadable. */
  spans: readonly ({ start: number; length: number } | null)[];
}

/**
 * Positions of the jobs on a shared time axis. Dates are read from the English periods
 * (same job order in every language), so the bars are identical in en and ru.
 */
export const getTimeline = (): Timeline | null => {
  const today = new Date();
  const now = today.getFullYear() * 12 + today.getMonth();
  const raw = getJobs('en').map((job) => {
    const [a, b] = job.period.split(/\s[—–-]\s/);
    const start = toMonth(a ?? '');
    const end = job.current ? now : toMonth(b ?? '');
    return start === null || end === null || end < start ? null : { start, end: end + 1 };
  });
  const known = raw.filter((r): r is { start: number; end: number } => r !== null);
  if (known.length === 0) return null;
  const from = Math.floor(Math.min(...known.map((r) => r.start)) / 12);
  const to = Math.ceil(Math.max(...known.map((r) => r.end)) / 12);
  const total = (to - from) * 12;
  return {
    from,
    years: to - from,
    spans: raw.map((r) => (r ? { start: (r.start - from * 12) / total, length: (r.end - r.start) / total } : null)),
  };
};

/* ---------- Tab completion and typo suggestions ---------- */

const NEEDS_ARG: readonly string[] = ['lang', 'sudo', 'cat', 'open'];

const argsFor = (name: string): string[] => {
  switch (name) {
    case 'lang': return ['en', 'ru'];
    case 'theme': return [...THEMES];
    case 'sudo': return ['hire'];
    case 'experience': return range(JOB_COUNT);
    case 'projects': return range(PROJECT_COUNT);
    case 'cat':
    case 'cd':
    case 'open':
    case 'less':
    case 'more': return FILES.map((f) => f.name);
    default: return [];
  }
};

const commonPrefix = (list: string[]): string => {
  let prefix = list[0] ?? '';
  for (const item of list) {
    while (!item.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
};

/** Tab completion: returns the new input value and, when ambiguous, the candidates. */
export const complete = (input: string): { value: string; candidates: string[] } => {
  const value = input.replace(/^\s+/, '');
  const parts = value.split(/\s+/);
  let candidates: string[] = [];

  if (parts.length <= 1) {
    const head = value.toLowerCase();
    candidates = ALL_COMMANDS.filter((c) => c.startsWith(head));
  } else if (parts.length === 2) {
    const { name } = parse(parts[0]);
    const arg = parts[1].toLowerCase();
    candidates = argsFor(name).filter((a) => a.startsWith(arg)).map((a) => `${parts[0]} ${a}`);
  }

  if (candidates.length === 0) return { value: input, candidates: [] };
  if (candidates.length === 1) {
    const only = candidates[0];
    return { value: !only.includes(' ') && NEEDS_ARG.includes(only) ? `${only} ` : only, candidates: [] };
  }
  const prefix = commonPrefix(candidates);
  return { value: prefix.length > value.length ? prefix : value, candidates };
};

const distance = (a: string, b: string): number => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
};

/** Closest known command for a typo, if it is close enough to be a plausible guess. */
export const suggest = (name: string): string | null => {
  if (!name) return null;
  let best: string | null = null;
  let bestScore = 3;
  for (const cmd of ALL_COMMANDS) {
    const score = cmd.startsWith(name) || name.startsWith(cmd) ? 1 : distance(name, cmd);
    if (score < bestScore) { best = cmd; bestScore = score; }
  }
  return best;
};
