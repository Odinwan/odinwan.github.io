import React, { useId, useState } from 'react';
import { Lang, t } from '../../translations';
import { skillGroups } from '../../data/skills';
import { CV_AI_FIRST_URL, CV_FULLSTACK_URL, CV_URL } from '../../data/links';
import { copy } from './copy';
import { Intent, Job, Message, RECENT_JOBS, TOPICS, getJobs, getProjects } from './engine';
import { Scroller } from './Scroller';

const fileName = (url: string) => url.split('/').pop() ?? url;

const DownloadIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v11" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

const Chevron: React.FC = () => (
  <svg className="chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const JobItems: React.FC<{ job: Job; id: string }> = ({ job, id }) => (
  <ul id={id} className="items">
    {job.items.map((item) => <li key={item}>{item}</li>)}
  </ul>
);

/** The whole career as one compact card: a row per job that unfolds in place. */
const Timeline: React.FC<{ lang: Lang }> = ({ lang }) => {
  const jobs = getJobs(lang);
  const c = copy[lang];
  const id = useId();
  const [open, setOpen] = useState<number[]>([]);
  const [all, setAll] = useState(false);
  const shown = all ? jobs : jobs.slice(0, RECENT_JOBS);
  const hidden = jobs.length - shown.length;

  const toggle = (i: number) => setOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <section className="card path">
      <ol>
        {/* Index keys: the list is static, and they keep rows open across a language switch. */}
        {shown.map((job, i) => {
          const isOpen = open.includes(i);
          const classes = [job.current ? 'current' : '', isOpen ? 'open' : '', all && i >= RECENT_JOBS ? 'late' : ''].filter(Boolean).join(' ');
          return (
            <li key={i} className={classes || undefined}>
              <button type="button" className="path-head" aria-expanded={isOpen} aria-controls={isOpen ? `${id}-${i}` : undefined} onClick={() => toggle(i)}>
                <span className="period">
                  {job.period}
                  {job.current && <span className="badge">{t[lang].experience.now}</span>}
                </span>
                <strong>{job.role}</strong>
                <span className="company">{job.company}</span>
                <Chevron />
              </button>
              {isOpen && (
                <div className="path-body">
                  {job.note && <p className="note">{job.note}</p>}
                  <JobItems job={job} id={`${id}-${i}`} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {hidden > 0 && (
        <button type="button" className="path-more" onClick={() => setAll(true)}>
          {c.earlier(hidden)}
          <Chevron />
        </button>
      )}
    </section>
  );
};

interface JobCardProps {
  job: Job;
  lang: Lang;
  defaultOpen?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, lang, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  const c = copy[lang];

  return (
    <article className={`job ${job.current ? 'current' : ''}`}>
      <p className="job-meta">
        <span className="period">{job.period}</span>
        {job.current && <span className="badge">{t[lang].experience.now}</span>}
      </p>
      <h3>{job.role}</h3>
      <p className="company">{job.company}</p>
      {job.note && <p className="note">{job.note}</p>}
      {open && <JobItems job={job} id={listId} />}
      <button
        type="button"
        className="more"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? c.hide : c.details}
        <span className="visually-hidden"> — {job.company}</span>
        <Chevron />
      </button>
    </article>
  );
};

interface BubbleProps {
  message: Message;
  lang: Lang;
  onAsk: (intent: Intent) => void;
}

/** Kinds rendered as bare cards (no bubble chrome) that may use the full row width. */
export const isWide = (m: Message): boolean =>
  m.kind === 'job' || m.kind === 'jobs' || m.kind === 'projects' || m.kind === 'stack'
  || m.kind === 'stats' || m.kind === 'files' || m.kind === 'contacts';

export const Bubble: React.FC<BubbleProps> = ({ message: m, lang, onAsk }) => {
  const tr = t[lang];
  const c = copy[lang];

  switch (m.kind) {
    case 'ask':
      return <p className="bubble">{m.follow ? c.follow[m.topic] : c.q[m.topic]}</p>;

    case 'askJob':
      return <p className="bubble">{c.moreAbout(getJobs(lang)[m.job].company)}</p>;

    case 'typed':
      return <p className="bubble">{m.text}</p>;

    case 'hi':
      return <p className="bubble">{c.hi(tr.intro.name)}</p>;

    case 'role':
      return (
        <p className="bubble">
          {tr.intro.role}. <strong className="accent">{tr.intro.status}</strong>
        </p>
      );

    case 'say':
      return <p className="bubble">{c.say[m.key]}</p>;

    case 'aboutText':
      return <p className="bubble">{tr.about[m.part]}</p>;

    case 'aboutFacts':
      return (
        <dl className="bubble facts-list">
          {tr.about.facts.map((f) => (
            <div key={f.lbl}>
              <dt>{f.lbl}</dt>
              <dd>{f.val}</dd>
            </div>
          ))}
        </dl>
      );

    case 'job':
      return <JobCard job={getJobs(lang)[m.job]} lang={lang} defaultOpen={m.open} />;

    case 'jobs':
      return <Timeline lang={lang} />;

    case 'projects': {
      const list = getProjects(lang);
      return (
        <Scroller className="carousel" label={c.projectsHint} prevLabel={c.prev} nextLabel={c.next} count={list.length} focusable>
          {list.map((p, i) => (
            <article className="project" key={p.title}>
              <p className="kicker">
                <span>{p.kicker}</span>
                <span className="count">{i + 1} / {list.length}</span>
              </p>
              <h3>{p.title}</h3>
              <p className="desc">{p.desc}</p>
              {p.facts && (
                <dl className="facts">
                  {p.facts.map((f) => (
                    <div key={f.lbl}>
                      <dt>{f.val}</dt>
                      <dd>{f.lbl}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <ul className="tags">
                {p.tech.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </article>
          ))}
        </Scroller>
      );
    }

    case 'stack':
      return (
        <section className="card skills">
          <h3>{tr.stack.title}</h3>
          <p className="legend"><span className="swatch" aria-hidden="true" />{tr.stack.core}</p>
          {skillGroups.map((g) => (
            <div className="group" key={g.title}>
              <h4>{g.title}</h4>
              <ul className="tags">
                {g.tags.map((tag) => (
                  <li key={tag} className={g.core.includes(tag) ? 'core' : undefined}>{tag}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      );

    case 'stats':
      return (
        <section className="card stats">
          <h3>{tr.stats.title}</h3>
          <dl>
            {tr.stats.items.map((s) => (
              <div key={s.lbl}>
                <dt>{s.val}</dt>
                <dd>{s.lbl}</dd>
              </div>
            ))}
          </dl>
        </section>
      );

    case 'files': {
      const files = [
        { title: c.cvMain, url: CV_URL },
        { title: tr.ui.cvAiFirst, url: CV_AI_FIRST_URL },
        { title: tr.ui.cvFullstack, url: CV_FULLSTACK_URL },
      ];
      return (
        <ul className="files">
          {files.map((f) => (
            <li key={f.url}>
              <a href={f.url} download target="_blank" rel="noreferrer" aria-label={`${tr.ui.downloadCv} — ${f.title}`}>
                <span className="doc" aria-hidden="true">PDF</span>
                <span className="file-text">
                  <strong>{f.title}</strong>
                  <small>{fileName(f.url)}</small>
                </span>
                <span className="get"><DownloadIcon /></span>
              </a>
            </li>
          ))}
        </ul>
      );
    }

    case 'contactText':
      return (
        <p className="bubble">
          <strong>{tr.contact.title}.</strong> {tr.contact.desc}
        </p>
      );

    case 'contacts':
      return (
        <ul className="contacts">
          {tr.contact.links.map((link) => {
            const external = link.href.startsWith('http');
            return (
              <li key={link.href}>
                <a href={link.href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
                  <small>{link.label}</small>
                  <strong>{link.value}</strong>
                  <svg className="go" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </a>
              </li>
            );
          })}
        </ul>
      );

    case 'help':
      return (
        <div className="bubble help">
          <p>{c.help}</p>
          <ul>
            {TOPICS.map((topic) => (
              <li key={topic}>
                <button type="button" onClick={() => onAsk({ type: 'topic', topic })}>{c.q[topic]}</button>
              </li>
            ))}
          </ul>
        </div>
      );
  }
};
