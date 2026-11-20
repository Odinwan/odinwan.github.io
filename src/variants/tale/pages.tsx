import React from 'react';
import { t, type Lang } from '../../translations';
import { skillGroups } from '../../data/skills';
import { CV_AI_FIRST_URL, CV_FULLSTACK_URL, CV_URL } from '../../data/links';
import { S } from './strings';
import { Flourish, Tomato, type TomatoProp } from './Tomato';

export interface PageCtx {
  /** Jump to a page by index. */
  go: (page: number) => void;
  /** Present when the book is shown inside a host scene and can be closed. */
  onClose?: () => void;
}

export interface PageDef {
  key: string;
  /** Spoken name of the page (live region) and its running head. */
  title: string;
  cover?: boolean;
  /** Which part of the book the page belongs to: the running head on the left-hand page. */
  part?: string;
  render: (ctx: PageCtx) => React.ReactNode;
}

export interface ChapterDef {
  numeral: string;
  title: string;
  page: number;
  /** Index of the part it sits in. */
  part: number;
}

export interface PartDef {
  /** "Part two" */
  label: string;
  title: string;
  page: number;
}

export interface Book {
  pages: PageDef[];
  chapters: ChapterDef[];
  parts: PartDef[];
  contentsPage: number;
}

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = (n: number): string => {
  let out = '';
  let rest = n;
  for (const [v, s] of ROMAN) while (rest >= v) { out += s; rest -= v; }
  return out;
};

/** Narration with the company name (verbatim from the data) set in bold. */
const withCompany = (text: string, company: string): React.ReactNode => {
  const [before, after = ''] = text.split('{company}');
  return <>{before}<strong>{company}</strong>{after}</>;
};

const JOB_POSES: { prop: TomatoProp; crown?: boolean; cape?: boolean }[] = [
  { prop: 'laptop' },
  { prop: 'flag' },
  { prop: 'bindle' },
  { prop: 'flag', cape: true },
  { prop: 'laptop', cape: true },
];

const external = (href: string) => (href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {});

/**
 * Lays the CV out as a book. Page 0 is the cover; after it pages come in spreads
 * (odd index = left page, even = right), so each job opens on a left page with its
 * deeds on the facing right page.
 */
export const buildBook = (lang: Lang): Book => {
  const c = t[lang];
  const s = S[lang];
  const all: PageDef[] = [];
  const chapters: ChapterDef[] = [];
  const parts: PartDef[] = [];
  /** Every page pushed is stamped with the part it was pushed under. */
  const pages = {
    get length() { return all.length; },
    push(def: PageDef) { all.push({ ...def, part: def.part ?? parts[parts.length - 1]?.title }); },
  };

  const part = (title: string): PartDef => {
    const p = { label: `${s.partWord} ${s.partNames[parts.length] ?? parts.length + 1}`, title, page: pages.length };
    parts.push(p);
    return p;
  };
  const chapter = (title: string): ChapterDef => {
    const ch = { numeral: roman(chapters.length + 1), title, page: pages.length, part: parts.length - 1 };
    chapters.push(ch);
    return ch;
  };
  /** The opening of a part: its number, its name, and one plain line about what is inside. */
  const partHead = (p: PartDef, note?: string) => (
    <>
      <p className="part-kicker">{p.label}</p>
      <h2 className="title center">{p.title}</h2>
      <Flourish />
      {note && <p className="part-note">{note}</p>}
    </>
  );
  const head = (ch: ChapterDef) => (
    <p className="kicker">{s.chapter} {ch.numeral}</p>
  );

  /* ── cover ── */
  pages.push({
    key: 'cover',
    title: s.title,
    cover: true,
    render: ({ go }) => (
      <div className="cover-in">
        <p className="cover-kicker">{s.coverKicker}</p>
        <h2 className="cover-title">{s.title}</h2>
        <div className="medallion"><Tomato prop="laptop" crown cape title={s.heroAlt} /></div>
        <p className="cover-about">{s.coverAbout}</p>
        <p className="cover-name">{c.intro.name}</p>
        <p className="cover-role">{c.intro.role}</p>
        <button type="button" className="open" onClick={() => go(1)}>{s.open}</button>
      </div>
    ),
  });

  /* ── contents ── */
  const contentsPage = pages.length;
  pages.push({
    key: 'contents',
    title: s.contents,
    render: ({ go }) => (
      <>
        <h2 className="title center">{s.contents}</h2>
        <Flourish />
        <p className="narr center">{s.contentsNote}</p>
        {parts.map((p, pi) => (
          <section className="toc-part" key={p.page}>
            <h3>
              <button type="button" onClick={() => go(p.page)}>
                <span className="lbl">{p.label}</span>
                {p.title}
              </button>
            </h3>
            <ol className="toc">
              {chapters.filter((ch) => ch.part === pi).map((ch) => (
                <li key={ch.page}>
                  <button type="button" onClick={() => go(ch.page)}>
                    <span className="num">{ch.numeral}</span>
                    <span className="name">{ch.title}</span>
                    <span className="dots" aria-hidden="true" />
                    <span className="pg">{ch.page}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </>
    ),
  });

  /* ══ part one: the hero ══ */
  {
    const p = part(s.parts.hero.title);
    pages.push({
      key: 'part-hero',
      title: p.title,
      render: () => (
        <div className="opener part">
          <Tomato className="figure" prop="wave" crown cape />
          {partHead(p, s.parts.hero.note)}
        </div>
      ),
    });
  }

  /* ── once upon a time ── */
  {
    const ch = chapter(s.once.title);
    pages.push({
      key: 'once',
      title: ch.title,
      render: () => (
        <>
          {head(ch)}
          <h2 className="title">{ch.title}</h2>
          <p className="narr cap">{s.once.narr}</p>
          <Flourish />
          <p>{c.about.p1}</p>
          <p>{c.about.p2}</p>
          <dl className="facts-list">
            {c.about.facts.map((f) => (
              <div key={f.lbl}>
                <dt>{f.lbl}</dt>
                <dd>{f.val}</dd>
              </div>
            ))}
          </dl>
        </>
      ),
    });
  }

  /* ── the tale in numbers ── */
  {
    const ch = chapter(s.numbers.title);
    pages.push({
      key: 'numbers',
      title: ch.title,
      render: () => (
        <>
          {head(ch)}
          <h2 className="title">{ch.title}</h2>
          <Tomato className="spot" prop="star" />
          <p className="narr cap">{s.numbers.narr}</p>
          <dl className="stats">
            {c.stats.items.map((it) => (
              <div key={it.lbl}>
                <dt>{it.lbl}</dt>
                <dd>{it.val}</dd>
              </div>
            ))}
          </dl>
        </>
      ),
    });
  }

  /* ── the journey: oldest first ── */
  const chrono = [...c.experience.jobs].reverse();
  let earlyCount = 0;
  while (earlyCount < chrono.length && chrono[earlyCount].items.length === 1) earlyCount += 1;
  const early = chrono.slice(0, earlyCount);
  const later = chrono.slice(earlyCount);

  /* ══ part two: the road ══ */
  /** Where each later job opens, filled in as the pages are laid out; read when the list is drawn. */
  const jobPage: number[] = [];
  let earlyPage = -1;
  {
    const p = part(s.parts.road.title);
    pages.push({
      key: 'part-road',
      title: p.title,
      render: ({ go }) => (
        <>
          <div className="opener part">{partHead(p, s.parts.road.note)}</div>
          <p className="kicker">{s.parts.road.list}</p>
          <ol className="road">
            {chrono.map((job, i) => {
              const target = i < earlyCount ? earlyPage : jobPage[i - earlyCount];
              return (
                <li key={`${job.company}-${job.period}`}>
                  <button type="button" onClick={() => go(target)}>
                    <span className="when">{job.period}</span>
                    <span className="where">{job.company}</span>
                    <span className="what">{job.role}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      ),
    });
  }

  if (early.length > 0) {
    earlyPage = pages.length;
    const ch = chapter(c.experience.earlyTitle);
    pages.push({
      key: 'early',
      title: ch.title,
      render: () => (
        <>
          {head(ch)}
          <h2 className="title">{ch.title}</h2>
          <Tomato className="spot" prop="bindle" />
          <p className="narr cap">{s.earlyNarr}</p>
          <ol className="early">
            {early.map((job) => (
              <li key={job.company}>
                <p className="period">{job.period}</p>
                <h3>{job.role} <span className="at">· {job.company}</span></h3>
                {job.items.map((item) => <p key={item}>{item}</p>)}
              </li>
            ))}
          </ol>
        </>
      ),
    });
  }

  later.forEach((job, i) => {
    jobPage[i] = pages.length;
    const ch = chapter(job.company);
    const pose = job.current ? { prop: 'star' as const, crown: true, cape: true } : JOB_POSES[i % JOB_POSES.length];
    const narr = job.current ? s.jobNow : s.jobs[i % s.jobs.length];
    pages.push({
      key: `job-${i}`,
      title: `${job.company} — ${job.role}`,
      render: () => (
        <div className="opener">
          <p className="kicker">{s.workOf(i + 1, later.length)} · {s.who}</p>
          <Tomato className="figure" {...pose} />
          <h2 className="title center">{job.company}</h2>
          <p className="role">{job.role}</p>
          <p className="period center">
            {job.period}
            {job.current && <span className="now">{c.experience.now}</span>}
          </p>
          {'note' in job && <p className="note">{job.note}</p>}
          <Flourish />
          <p className="narr cap">{withCompany(narr, job.company)}</p>
        </div>
      ),
    });
    pages.push({
      key: `job-${i}-deeds`,
      title: `${job.company} — ${s.deeds}`,
      render: () => (
        <>
          <p className="kicker">{s.workOf(i + 1, later.length)} · {s.did}</p>
          <h3 className="subtitle">{job.company}</h3>
          <p className="period">{job.role} · {job.period}</p>
          <ul className="deeds">
            {job.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </>
      ),
    });
  });

  /* ── feats ── */
  {
    const featsPart = part(s.parts.feats.title);
    const ch = chapter(s.feats.title);
    const first = pages.length + 1;
    pages.push({
      key: 'feats',
      title: ch.title,
      render: ({ go }) => (
        <div className="opener">
          <Tomato className="figure" prop="star" cape />
          {partHead(featsPart, s.parts.feats.note)}
          <p className="narr cap">{s.feats.narr}</p>
          <ol className="toc small">
            {c.projects.list.map((p, i) => (
              <li key={p.title}>
                <button type="button" onClick={() => go(first + i)}>
                  <span className="num">{i + 1}</span>
                  <span className="name">{p.title}</span>
                  <span className="dots" aria-hidden="true" />
                  <span className="pg">{first + i}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ),
    });
    c.projects.list.forEach((p, i) => {
      pages.push({
        key: `feat-${i}`,
        title: p.title,
        render: () => (
          <>
            <p className="kicker">{s.featOf(i + 1, c.projects.list.length)} · {p.kicker}</p>
            {'stamp' in p && <p className="stamp" aria-label={p.stamp.join(' — ')}><b>{p.stamp[0]}</b><span>{p.stamp[1]}</span></p>}
            <h3 className="title feat">{p.title}</h3>
            <Flourish className="left" />
            <p>{p.desc}</p>
            {'facts' in p && (
              <dl className="stats compact">
                {p.facts.map((f) => (
                  <div key={f.lbl}>
                    <dt>{f.lbl}</dt>
                    <dd>{f.val}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ul className="tags" aria-label={c.chapters.stack}>
              {p.tech.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          </>
        ),
      });
    });
  }

  /* ── the magic chest of tools ── */
  {
    part(s.parts.tools.title);
    const ch = chapter(s.chest.title);
    const split = Math.ceil(skillGroups.length / 2);
    const groups = (list: typeof skillGroups) => (
      <div className="groups">
        {list.map((g) => (
          <section key={g.title}>
            <h3>{g.title}</h3>
            <ul className="tags">
              {g.tags.map((tag) => (
                <li key={tag} className={g.core.includes(tag) ? 'core' : undefined}>{tag}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
    pages.push({
      key: 'chest',
      title: ch.title,
      render: () => (
        <>
          {head(ch)}
          <h2 className="title">{ch.title}</h2>
          <Tomato className="spot" prop="chest" />
          <p className="narr cap">{s.chest.narr}</p>
          <p className="legend"><span className="swatch" aria-hidden="true" />{c.stack.core}</p>
          {groups(skillGroups.slice(0, split))}
        </>
      ),
    });
    pages.push({
      key: 'chest-2',
      title: ch.title,
      render: () => (
        <>
          <p className="kicker">{ch.title}</p>
          <p className="narr">{s.chest.more}</p>
          {groups(skillGroups.slice(split))}
          <p className="legend"><span className="swatch" aria-hidden="true" />{c.stack.core}</p>
        </>
      ),
    });
  }

  /* ── the end… or the beginning? ── */
  {
    const ch = chapter(s.end.title);
    pages.push({
      key: 'end',
      title: ch.title,
      render: () => (
        <div className="opener">
          {head(ch)}
          <Tomato className="figure" prop="wave" crown />
          <h2 className="title center">{ch.title}</h2>
          <Flourish />
          <p className="narr cap">{s.end.narr}</p>
          <p className="narr center moral">{s.end.moral}</p>
        </div>
      ),
    });
    pages.push({
      key: 'contact',
      title: c.contact.title,
      render: ({ onClose }) => (
        <>
          <p className="kicker">{ch.title}</p>
          <h3 className="title feat">{c.contact.title}</h3>
          <p>{c.contact.desc}</p>
          <p className="narr">{s.contactNarr}</p>
          <dl className="links">
            {c.contact.links.map((l) => (
              <div key={l.href}>
                <dt>{l.label}</dt>
                <dd><a href={l.href} {...external(l.href)}>{l.value}</a></dd>
              </div>
            ))}
          </dl>
          <Flourish />
          <p className="narr center">{s.cvTitle}</p>
          <div className="cv">
            <a className="open" href={CV_URL} download>{c.ui.downloadCv}</a>
            <p>
              {c.ui.otherCv}{' '}
              <a href={CV_AI_FIRST_URL} download>{c.ui.cvAiFirst} (PDF)</a>
              {' · '}
              <a href={CV_FULLSTACK_URL} download>{c.ui.cvFullstack} (PDF)</a>
            </p>
          </div>
          {onClose && (
            <p className="close-row">
              <button type="button" className="shut" onClick={onClose}>{s.close}</button>
            </p>
          )}
        </>
      ),
    });
  }

  return { pages: all, chapters, parts, contentsPage };
};
