import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import { Lang, t } from '../../translations';
import { skillGroups } from '../../data/skills';
import { CV_AI_FIRST_URL, CV_FULLSTACK_URL, CV_URL, PHOTO_URL } from '../../data/links';
import { useFonts } from '../useFonts';
import { strings } from './strings';
import { PrintReset, Root, Switcher } from './Classic.styled';

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap';

const LANGS: readonly Lang[] = ['en', 'ru'];

interface Job {
  role: string;
  company: string;
  period: string;
  current: boolean;
  note?: string;
  items: readonly string[];
}

interface Fact {
  val: string;
  lbl: string;
}

interface Project {
  kicker: string;
  title: string;
  desc: string;
  tech: readonly string[];
  facts?: readonly Fact[];
  /** A rubber stamp across the card: two lines, e.g. "Top secret" / "coming soon". */
  stamp?: readonly [string, string];
}

const SECTION_IDS = ['summary', 'numbers', 'experience', 'projects', 'skills', 'education', 'contact'] as const;
type SectionId = (typeof SECTION_IDS)[number];
const domId = (id: SectionId) => `classic-${id}`;

const Classic: React.FC = () => {
  useFonts(FONT_URL);
  const { lang, setLang } = useLanguage();
  const c = t[lang];
  const s = strings[lang];

  const rootRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  const [photoOk, setPhotoOk] = useState(true);
  const [active, setActive] = useState<SectionId>(SECTION_IDS[0]);
  const [scrolled, setScrolled] = useState(false);

  // Track which section is being read (for the side nav) and whether "back to top" is useful.
  // The page scrolls inside the root element, not the document.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = root.getBoundingClientRect().top;
      const line = top + Math.min(root.clientHeight * 0.3, 220);
      let current: SectionId = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = root.querySelector<HTMLElement>(`#${domId(id)}`);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // At the very bottom the last short sections can never reach the reading line.
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) current = SECTION_IDS[SECTION_IDS.length - 1];
      setActive(current);
      setScrolled(root.scrollTop > root.clientHeight * 0.8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    root.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, []);

  // Close the "other versions" menu on an outside click or Escape.
  useEffect(() => {
    const close = (e: Event) => {
      const el = moreRef.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') el.open = false;
        return;
      }
      if (!el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  // The URL hash selects the design, so in-page links scroll by hand instead of using `#id`.
  const jump = (id: SectionId) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = rootRef.current?.querySelector<HTMLElement>(`#${domId(id)}`);
    if (!target) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  const jobs: readonly Job[] = c.experience.jobs;
  const projects: readonly Project[] = c.projects.list;
  const mainJobs = jobs.filter((j) => j.items.length > 1);
  const earlyJobs = jobs.filter((j) => j.items.length <= 1);

  const titles: Record<SectionId, string> = {
    summary: s.summary,
    numbers: s.numbers,
    experience: s.experience,
    projects: s.projects,
    skills: s.skills,
    education: s.education,
    contact: s.contact,
  };

  const sectionProps = (id: SectionId) => ({
    id: domId(id),
    tabIndex: -1,
    'aria-labelledby': `${domId(id)}-h`,
  });
  const heading = (id: SectionId) => <h2 id={`${domId(id)}-h`}>{titles[id]}</h2>;
  const external = (href: string) =>
    href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const closeMenu = () => {
    if (moreRef.current) moreRef.current.open = false;
  };

  return (
    <Root ref={rootRef} lang={lang}>
      <PrintReset />

      <div className="toolbar">
        <span className="toolbar-name">{c.intro.name}</span>

        <div className="tools" role="group" aria-label={s.toolbar}>
          <div className="lang" role="group" aria-label={s.language}>
            {LANGS.map((l) => (
              <button
                type="button"
                key={l}
                lang={l}
                aria-pressed={l === lang}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <button type="button" className="btn" onClick={() => window.print()} title={s.printLong}>
            <svg className="ico" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z" />
            </svg>
            <span className="long">{s.printLong}</span>
            <span className="short" aria-hidden="true">{s.print}</span>
          </button>

          <div className="dl">
            <a className="btn primary" href={CV_URL} download title={c.ui.downloadCv}>
              <svg className="ico" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2.5v8M4.75 7.5 8 10.75l3.25-3.25M3 13.5h10" />
              </svg>
              <span className="long">{c.ui.downloadCv}</span>
              <span className="short" aria-hidden="true">{s.pdfShort}</span>
            </a>
            <details className="more" ref={moreRef}>
              <summary className="btn primary" aria-label={s.moreCv} title={s.moreCv}>
                <svg className="ico chev" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 6.25 4 4 4-4" />
                </svg>
              </summary>
              <div className="menu">
                <p>{c.ui.otherCv}</p>
                <a href={CV_AI_FIRST_URL} download onClick={closeMenu}>{c.ui.cvAiFirst}<span>PDF</span></a>
                <a href={CV_FULLSTACK_URL} download onClick={closeMenu}>{c.ui.cvFullstack}<span>PDF</span></a>
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="layout">
        <nav className="toc" aria-label={s.sections}>
          <ol>
            {SECTION_IDS.map((id) => (
              <li key={id}>
                <a
                  href={`#${domId(id)}`}
                  onClick={jump(id)}
                  aria-current={id === active ? 'true' : undefined}
                >
                  {titles[id]}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="paper">
          <header className="head">
            <div className="head-text">
              <h1 className="nohyph" translate="no" tabIndex={-1}>{c.intro.name}</h1>
              <p className="tagline">
                <span className="role">{c.intro.role}</span>
                <span className="status">{c.intro.status}</span>
              </p>
              <ul className="contacts">
                {c.contact.links.map((l) => (
                  <li key={l.href}>
                    <span className="k">{l.label}</span>
                    <a className="nohyph" href={l.href} {...external(l.href)}>{l.value}</a>
                  </li>
                ))}
              </ul>
            </div>
            {photoOk && (
              <img
                className="photo"
                src={PHOTO_URL}
                alt={s.photoAlt}
                width={112}
                height={112}
                onError={() => setPhotoOk(false)}
              />
            )}
          </header>

          <main>
            <section className="split" {...sectionProps('summary')}>
              {heading('summary')}
              <div className="lead">
                <p>{c.about.p1}</p>
                <p>{c.about.p2}</p>
              </div>
            </section>

            <section className="split" {...sectionProps('numbers')}>
              {heading('numbers')}
              <dl className="stats">
                {c.stats.items.map((it) => (
                  <div key={it.lbl}>
                    <dt>{it.lbl}</dt>
                    <dd>{it.val}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="stacked" {...sectionProps('experience')}>
              {heading('experience')}

              {mainJobs.map((job) => (
                <article className="job row" key={job.company + job.period}>
                  <p className="period">
                    {job.period}
                    {job.current && <span className="now">{c.experience.now}</span>}
                  </p>
                  <div>
                    <div className="job-head">
                      <h3>{job.role}</h3>
                      <p className="company nohyph">{job.company}</p>
                    </div>
                    {job.note && <p className="note">{job.note}</p>}
                    <ul className="items">
                      {job.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </article>
              ))}

              {earlyJobs.length > 0 && (
                <>
                  <p className="early-title row"><span>{c.experience.earlyTitle}</span></p>
                  {earlyJobs.map((job) => (
                    <article className="job compact row" key={job.company + job.period}>
                      <p className="period">{job.period}</p>
                      <div>
                        <p className="job-head">
                          <strong className="role-name">{job.role}</strong>
                          <span className="company nohyph">{job.company}</span>
                        </p>
                        {job.note && <p className="note">{job.note}</p>}
                        {job.items.map((item) => <p className="one" key={item}>{item}</p>)}
                      </div>
                    </article>
                  ))}
                </>
              )}
            </section>

            <section className="stacked" {...sectionProps('projects')}>
              {heading('projects')}
              {projects.map((p) => (
                <article className="project row" key={p.title}>
                  <p className="kicker">{p.kicker}</p>
                  <div>
                    {p.stamp && <p className="stamp" aria-label={p.stamp.join(' — ')}><b>{p.stamp[0]}</b><span>{p.stamp[1]}</span></p>}
                    <h3>{p.title}</h3>
                    <p className="desc">{p.desc}</p>
                    {p.facts && p.facts.length > 0 && (
                      <dl className="facts">
                        {p.facts.map((f) => (
                          <div key={f.lbl}>
                            <dt>{f.lbl}</dt>
                            <dd>{f.val}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <p className="tech">
                      <span className="k">{s.stack}</span>
                      {p.tech.join(', ')}
                    </p>
                  </div>
                </article>
              ))}
            </section>

            <section className="stacked skills" {...sectionProps('skills')}>
              {heading('skills')}
              <dl>
                {skillGroups.map((g) => (
                  <div className="row" key={g.title}>
                    <dt>{g.title}</dt>
                    <dd>
                      {g.tags.map((tag, i) => (
                        <React.Fragment key={tag}>
                          <span className="tag">
                            {g.core.includes(tag) ? <strong className="core">{tag}</strong> : tag}
                            {i < g.tags.length - 1 && ','}
                          </span>
                          {' '}
                        </React.Fragment>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="legend row"><span>{c.stack.core}</span></p>
            </section>

            <section className="stacked facts-list" {...sectionProps('education')}>
              {heading('education')}
              <dl>
                {c.about.facts.map((f) => (
                  <div className="row" key={f.lbl}>
                    <dt>{f.lbl}</dt>
                    <dd>{f.val}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="split" {...sectionProps('contact')}>
              {heading('contact')}
              <div className="contact-block">
                <p>{c.contact.desc}</p>
                <ul className="contact-line">
                  {c.contact.links.map((l) => (
                    <li key={l.href}>
                      <a className="nohyph" href={l.href} {...external(l.href)}>{l.value}</a>
                    </li>
                  ))}
                </ul>
                <p className="versions screen-only">
                  <a href={CV_URL} download>{c.ui.downloadCv}</a>
                  <span className="alt">
                    {c.ui.otherCv}{' '}
                    <a href={CV_AI_FIRST_URL} download>{c.ui.cvAiFirst}</a>
                    <a href={CV_FULLSTACK_URL} download>{c.ui.cvFullstack}</a>
                  </span>
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>

      <button
        type="button"
        className="top"
        onClick={toTop}
        aria-label={s.toTop}
        title={s.toTop}
        hidden={!scrolled}
      >
        <svg className="ico" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 13V3.5M3.75 7.5 8 3.25l4.25 4.25" />
        </svg>
      </button>
    </Root>
  );
};

export default Classic;
