import React, { useLayoutEffect, useRef, useState } from 'react';
import { t, Lang } from '../../translations';
import { skillGroups } from '../../data/skills';
import { SheetData, useOpenSheet } from './sheet';

type Tr = (typeof t)[Lang];

export type ChapterKey = keyof Tr['chapters'];

export interface Palette { bg: string; fg: string }

export interface Reel {
  id: string;
  chapter: ChapterKey;
  palette: Palette;
  /** Oversized decorative text behind the content, like a video still. */
  deco?: string;
  content: React.ReactNode;
}

const P = {
  photo: { bg: '#141210', fg: '#fbf6ec' },
  tomato: { bg: '#ff5b36', fg: '#170a05' },
  cream: { bg: '#f4ecdd', fg: '#17130e' },
  cobalt: { bg: '#2b3cff', fg: '#ffffff' },
  lime: { bg: '#d4f36b', fg: '#11140a' },
  pink: { bg: '#ffa6c9', fg: '#1d0a13' },
  forest: { bg: '#0f3b2c', fg: '#f1ead9' },
  mustard: { bg: '#ffc21a', fg: '#171204' },
  ink: { bg: '#1b1b1b', fg: '#f5f0e6' },
} satisfies Record<string, Palette>;

const rotation: Palette[] = [P.cobalt, P.lime, P.pink, P.forest, P.mustard, P.cream, P.tomato];

const EMAIL = 'vlad.kupnyy@gmail.com';
export const CV_URL = '/Vladislav_Cupnii_Senior_Fullstack_CV.pdf';

/* ---------- shared building blocks ---------- */

/**
 * Bottom caption, like the text under a reel. When the text doesn't fit the
 * screen it fades out and a "Read in full" button opens it in the sheet.
 */
export const Caption: React.FC<React.PropsWithChildren<{
  tr: Tr;
  sheet: Omit<SheetData, 'body'> & { body?: React.ReactNode };
}>> = ({ tr, sheet, children }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const openSheet = useOpenSheet();

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div className="caption">
      <div className="handle">
        <img src="/photo.jpg" alt="" />
        <span>{tr.intro.handle}</span>
      </div>
      <div className={`caption-body ${overflows ? 'fade' : ''}`} ref={bodyRef}>
        {children}
      </div>
      {overflows && (
        <button
          type="button"
          className="read-all"
          onClick={() => openSheet({ ...sheet, body: sheet.body ?? children })}
        >
          {tr.ui.readAll} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
};

const Chip: React.FC<React.PropsWithChildren> = ({ children }) => <div className="chip anim">{children}</div>;

/* ---------- reels ---------- */

export const buildReels = (lang: Lang): Reel[] => {
  const tr = t[lang];
  const reels: Reel[] = [];

  reels.push({
    id: 'intro',
    chapter: 'intro',
    palette: P.photo,
    content: (
      <>
        <img className="bg-photo" src="/photo.jpg" alt="Vladislav Cupnii" />
        <div className="stage stage-end">
          <span className="status anim"><i />{tr.intro.status}</span>
          <h1 className="giant anim">{tr.intro.name}</h1>
          <p className="subtitle anim">{tr.intro.role}</p>
        </div>
        <Caption tr={tr} sheet={{ title: tr.intro.name, subtitle: tr.intro.role }}>
          <p>{tr.intro.caption}</p>
          <p className="hashtags">{tr.intro.tags.join(' ')}</p>
        </Caption>
        <a className="cv-big anim" href={CV_URL} download>↓ {tr.ui.downloadCv}</a>
        <div className="swipe" aria-hidden="true">↑ {tr.ui.swipe}</div>
      </>
    ),
  });

  reels.push({
    id: 'stats',
    chapter: 'stats',
    palette: P.tomato,
    deco: '8+',
    content: (
      <div className="stage">
        <h2 className="title anim">{tr.stats.title}</h2>
        <dl className="stats">
          {tr.stats.items.map((s) => (
            <div className="anim" key={s.lbl}>
              <dt>{s.val}</dt>
              <dd>{s.lbl}</dd>
            </div>
          ))}
        </dl>
      </div>
    ),
  });

  const aboutFacts = (
    <dl className="facts">
      {tr.about.facts.map((f) => (
        <div key={f.lbl}>
          <dt>{f.lbl}</dt>
          <dd>{f.val}</dd>
        </div>
      ))}
    </dl>
  );
  const aboutFull = (
    <>
      <p>{tr.about.p1}</p>
      <p>{tr.about.p2}</p>
      {aboutFacts}
    </>
  );

  reels.push({
    id: 'about',
    chapter: 'about',
    palette: P.cream,
    content: (
      <>
        <div className="stage">
          <h2 className="giant anim">{tr.about.title}</h2>
          <p className="lead anim">{tr.about.p1}</p>
        </div>
        <Caption tr={tr} sheet={{ title: tr.about.title, body: aboutFull }}>
          <p>{tr.about.p2}</p>
          {aboutFacts}
        </Caption>
      </>
    ),
  });

  // Recent roles get a reel each; the three earliest share one.
  const jobs = tr.experience.jobs;
  const featured = jobs.slice(0, 5);
  const early = jobs.slice(5);
  const careerTotal = featured.length + 1;

  featured.forEach((job, i) => {
    reels.push({
      id: `job-${i}`,
      chapter: 'career',
      palette: rotation[i % rotation.length],
      deco: job.period.match(/\d{4}/)?.[0],
      content: (
        <>
          <div className="stage">
            <Chip>{tr.chapters.career} · {i + 1}/{careerTotal}</Chip>
            <p className="period anim">
              {job.current && <b className="now">{tr.experience.now}</b>}
              {job.period}
            </p>
            <h2 className="giant anim">{job.company}</h2>
            <p className="subtitle anim">{job.role}</p>
            {'note' in job && <p className="note anim">{job.note}</p>}
          </div>
          <Caption
            tr={tr}
            sheet={{
              title: job.company,
              subtitle: `${job.role} · ${job.period}`,
              body: (
                <>
                  {'note' in job && <p className="note">{job.note}</p>}
                  <ul className="bullets">
                    {job.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </>
              ),
            }}
          >
            <ul className="bullets">
              {job.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Caption>
        </>
      ),
    });
  });

  reels.push({
    id: 'job-early',
    chapter: 'career',
    palette: P.ink,
    deco: '2018',
    content: (
      <div className="stage">
        <Chip>{tr.chapters.career} · {careerTotal}/{careerTotal}</Chip>
        <h2 className="title anim">{tr.experience.earlyTitle}</h2>
        <ol className="timeline">
          {early.map((job) => (
            <li className="anim" key={job.company}>
              <span className="period">{job.period}</span>
              <strong>{job.company}</strong>
              <span className="role">{job.role}</span>
              <span className="what">{job.items[0]}</span>
            </li>
          ))}
        </ol>
      </div>
    ),
  });

  tr.projects.list.forEach((p, i) => {
    const num = String(i + 1).padStart(2, '0');
    const tags = p.tech.map((x) => `#${x.replace(/[\s.]/g, '').toLowerCase()}`).join(' ');
    reels.push({
      id: `project-${i}`,
      chapter: 'projects',
      palette: rotation[(i + 3) % rotation.length],
      deco: num,
      content: (
        <>
          <div className="stage">
            <Chip>{tr.projects.label} {num} · {p.kicker}</Chip>
            <h2 className="title big anim">{p.title}</h2>
            {'facts' in p && (
              <dl className="stats compact">
                {p.facts.map((f) => (
                  <div className="anim" key={f.lbl}>
                    <dt>{f.val}</dt>
                    <dd>{f.lbl}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <Caption
            tr={tr}
            sheet={{
              title: p.title,
              subtitle: `${tr.projects.label} ${num} · ${p.kicker}`,
              body: (
                <>
                  {'facts' in p && (
                    <dl className="stats compact">
                      {p.facts.map((f) => (
                        <div key={f.lbl}>
                          <dt>{f.val}</dt>
                          <dd>{f.lbl}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <p>{p.desc}</p>
                  <p className="hashtags">{tags}</p>
                </>
              ),
            }}
          >
            <p>{p.desc}</p>
            <p className="hashtags">{tags}</p>
          </Caption>
        </>
      ),
    });
  });

  reels.push({
    id: 'stack',
    chapter: 'stack',
    palette: P.lime,
    content: (
      <div className="stage">
        <h2 className="title anim">{tr.stack.title}</h2>
        <p className="legend anim">{tr.stack.core}</p>
        <div className="stack">
          {skillGroups.map((g) => (
            <div className="group anim" key={g.title}>
              <span className="group-title">{g.title}</span>
              <span className="pills">
                {g.tags.map((tag) => (
                  <span key={tag} className={g.core.includes(tag) ? 'pill core' : 'pill'}>{tag}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  reels.push({
    id: 'contact',
    chapter: 'contact',
    palette: P.cobalt,
    content: (
      <div className="stage">
        <h2 className="title big anim">{tr.contact.title}</h2>
        <p className="lead anim">{tr.contact.desc}</p>
        <div className="cta anim">
          <a className="btn solid" href={`mailto:${EMAIL}`}>{tr.contact.cta}</a>
          <a className="btn" href={CV_URL} download>{tr.contact.cv}</a>
        </div>
        <ul className="links anim">
          {tr.contact.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                <span className="lbl">{l.label}</span>
                <span className="val">{l.value}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    ),
  });

  return reels;
};
