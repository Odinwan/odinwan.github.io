import { Lang, t } from '../../translations';
import type { SayKey } from './copy';

export type Topic = 'about' | 'now' | 'experience' | 'projects' | 'stack' | 'stats' | 'cv' | 'contact';

export const TOPICS: readonly Topic[] = ['about', 'now', 'experience', 'projects', 'stack', 'stats', 'cv', 'contact'];

export type Intent =
  | { type: 'topic'; topic: Topic }
  | { type: 'job'; job: number }
  | { type: 'hello' }
  | { type: 'thanks' }
  | { type: 'unknown' };

/**
 * A message is stored as a *kind* plus ids, never as rendered text, so the whole
 * conversation re-renders when the language changes. The only literal text kept
 * is what the visitor typed themselves.
 */
export type Body =
  | { kind: 'ask'; topic: Topic; follow?: boolean }
  | { kind: 'askJob'; job: number }
  | { kind: 'typed'; text: string }
  | { kind: 'hi' }
  | { kind: 'role' }
  | { kind: 'say'; key: SayKey }
  | { kind: 'aboutText'; part: 'p1' | 'p2' }
  | { kind: 'aboutFacts' }
  | { kind: 'job'; job: number; open?: boolean }
  | { kind: 'jobs' }
  | { kind: 'projects' }
  | { kind: 'stack' }
  | { kind: 'stats' }
  | { kind: 'files' }
  | { kind: 'contactText' }
  | { kind: 'contacts' }
  | { kind: 'help' };

export type Message = Body & { id: number; from: 'me' | 'them'; /** When it was sent, ms since epoch. */ at: number };

/** How long Vladislav "types" a reply before it appears, in ms. */
export const typingTime = (body: Body): number => {
  switch (body.kind) {
    case 'aboutText': return 820;
    case 'jobs': case 'projects': case 'stack': case 'stats': case 'job': return 760;
    case 'files': case 'contacts': case 'aboutFacts': case 'help': return 620;
    default: return 540;
  }
};

/** Pause between the visitor's message and the moment it is "read". */
export const READ_DELAY = 360;

/** How many of the most recent jobs the timeline shows before "earlier roles". */
export const RECENT_JOBS = 4;

/* ---------- loosely typed views over the `as const` translations ---------- */

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

export const getJobs = (lang: Lang): readonly Job[] => t[lang].experience.jobs;
export const getProjects = (lang: Lang): readonly Project[] => t[lang].projects.list;

export const JOB_COUNT = t.en.experience.jobs.length;

/* ---------- replies ---------- */

export const replyFor = (intent: Intent): Body[] => {
  if (intent.type === 'hello') return [{ kind: 'say', key: 'hello' }];
  if (intent.type === 'thanks') return [{ kind: 'say', key: 'thanks' }];
  if (intent.type === 'unknown') return [{ kind: 'help' }];
  if (intent.type === 'job') return [{ kind: 'say', key: 'job' }, { kind: 'job', job: intent.job, open: true }];

  switch (intent.topic) {
    case 'about':
      return [{ kind: 'aboutText', part: 'p1' }, { kind: 'aboutText', part: 'p2' }, { kind: 'aboutFacts' }];
    case 'now':
      return [{ kind: 'say', key: 'now' }, { kind: 'job', job: 0 }];
    case 'experience':
      return [{ kind: 'say', key: 'experience' }, { kind: 'jobs' }];
    case 'projects':
      return [{ kind: 'say', key: 'projects' }, { kind: 'projects' }];
    case 'stack':
      return [{ kind: 'say', key: 'stack' }, { kind: 'stack' }];
    case 'stats':
      return [{ kind: 'say', key: 'stats' }, { kind: 'stats' }];
    case 'cv':
      return [{ kind: 'say', key: 'cv' }, { kind: 'files' }];
    case 'contact':
      return [{ kind: 'contactText' }, { kind: 'contacts' }];
  }
};

/* ---------- free-text matching (en + ru) ---------- */

const JOB_KEYWORDS: readonly RegExp[] = [
  /igaming|i-gaming|айгейминг|гейминг|\bnda\b/,
  /doc\s?space|докспейс|\br7\b|р7/,
  /unicorn|юникорн/,
  /kivork|киворк/,
  /onlog|онлог|webprofy|вебпрофи/,
  /noovy|нуви/,
  /laaty|лаати/,
  /gamega|гамега/,
  /rich\s?code|ричкод|bitrix|битрикс/,
];

/** Order matters: the first topic that matches wins. */
const TOPIC_KEYWORDS: readonly [Topic, RegExp][] = [
  ['cv', /\bcv\b|resume|résumé|\bpdf\b|download|резюме|скача|файл|пдф/],
  ['contact', /contact|e-?mail|\bmail\b|telegram|linkedin|phone|\bcall\b|reach|hire|связ|контакт|почт|телефон|телеграм|линкедин|позвон|нанять|написать тебе/],
  ['now', /\bnow\b|current|today|where.*work|what do you do|сейчас|текущ|нынешн|где.*работа|чем.*занима/],
  ['stats', /number|\bstats?\b|statistic|figure|metric|how many|how long|цифр|числ|статист|метрик|сколько/],
  ['projects', /project|built|build|portfolio|product|\bmade\b|проект|построил|сделал|портфолио|продукт|кейс/],
  ['stack', /stack|skill|tech|tool|framework|react|next\.?js|typescript|node|\bai\b|claude|\bllm\b|\bии\b|нейросет|стек|навык|скилл|технолог|инструмент|умеешь|фреймворк/],
  ['experience', /experience|career|\bjobs?\b|work|compan|employ|history|\blead|\bteam|опыт|команд|лид|карьер|работ|компани|путь/],
  ['about', /\bwho\b|about|yourself|introduce|education|universit|language|english|where.*from|\bbased\b|\blive\b|located|location|кто ты|откуда|где.*жив|кто вы|о себе|себя|образован|универ|язык|представься/],
];

const HELLO = /^(hi|hey|hello|yo|good (morning|afternoon|evening)|привет|здравствуй|здравствуйте|добрый (день|вечер)|доброе утро|хай|здарова)\b/;

const THANKS = /thank|\bthx\b|\bcheers\b|\bbye\b|спасибо|благодар|спс|до свидания|(^|\s)пока[.!)]*$/;

export const matchIntent = (raw: string): Intent => {
  const text = raw.toLowerCase().replace(/ё/g, 'е').trim();
  if (!text) return { type: 'unknown' };

  const job = JOB_KEYWORDS.findIndex((re) => re.test(text));
  if (job !== -1) return { type: 'job', job };

  const topic = TOPIC_KEYWORDS.find(([, re]) => re.test(text));
  if (topic) return { type: 'topic', topic: topic[0] };

  // `\b` does not understand Cyrillic, so the greeting check also tolerates a bare prefix.
  if (HELLO.test(text) || /^(привет|здравствуй|хай)/.test(text)) return { type: 'hello' };

  if (THANKS.test(text)) return { type: 'thanks' };

  return { type: 'unknown' };
};

/* ---------- contextual suggestions ---------- */

/** Where the conversation naturally goes after each topic. */
const NEXT: Record<Topic, readonly Topic[]> = {
  about: ['now', 'experience', 'stats'],
  now: ['experience', 'projects'],
  experience: ['projects', 'stack'],
  projects: ['stack', 'stats'],
  stack: ['projects', 'cv'],
  stats: ['experience', 'projects'],
  cv: ['contact'],
  contact: ['cv'],
};

export interface Chip {
  key: string;
  intent: Extract<Intent, { type: 'topic' | 'job' }>;
  /** Use the short follow-up wording. */
  follow: boolean;
}

export interface Context {
  last: Intent | null;
  asked: readonly Topic[];
  detailed: readonly number[];
}

export const suggest = ({ last, asked, detailed }: Context): Chip[] => {
  const chips: Chip[] = [];
  const fresh = (i: number) => i >= 0 && i < JOB_COUNT && !detailed.includes(i);
  const addJob = (job: number) => chips.push({ key: `job-${job}`, intent: { type: 'job', job }, follow: true });

  let context: Topic | null = null;

  if (last?.type === 'topic') {
    context = last.topic;
    if (last.topic === 'now' && fresh(0)) addJob(0);
  } else if (last?.type === 'job') {
    context = 'experience';
    for (let step = 1; step < JOB_COUNT; step += 1) {
      const i = (last.job + step) % JOB_COUNT;
      if (fresh(i)) { addJob(i); break; }
    }
  }

  const preferred = context ? NEXT[context].filter((topic) => !asked.includes(topic)) : [];
  const rest = TOPICS.filter((topic) => !asked.includes(topic) && !preferred.includes(topic));

  const addTopic = (topic: Topic, follow: boolean) =>
    chips.push({ key: `topic-${topic}`, intent: { type: 'topic', topic }, follow });

  preferred.forEach((topic) => addTopic(topic, true));
  rest.forEach((topic) => addTopic(topic, false));

  // Answered topics leave the row (they stay reachable from the topic list); once
  // everything is asked, the two that lead somewhere remain.
  if (preferred.length + rest.length === 0) {
    for (let i = 0; i < JOB_COUNT && chips.length < 3; i += 1) {
      if (fresh(i) && !chips.some((chip) => chip.key === `job-${i}`)) addJob(i);
    }
    const closing: Topic[] = ['contact', 'cv'];
    closing.filter((topic) => topic !== context).forEach((topic) => addTopic(topic, true));
  }

  return chips;
};
