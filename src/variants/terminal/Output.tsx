import React, { useEffect, useRef, useState } from 'react';
import { Lang, t } from '../../translations';
import { skillGroups } from '../../data/skills';
import { CV_AI_FIRST_URL, CV_FULLSTACK_URL, CV_URL, EMAIL } from '../../data/links';
import {
  FILES, HELP_ARGS, HELP_GROUPS, OPENERS, TOUR, getContactLinks, getJobs, getProjects, getTimeline,
  isLang, parse, suggest, tourAfter, tourStep,
} from './commands';
import { strings } from './strings';
import { PALETTES, THEMES, Theme, isTheme } from './themes';

type Run = (cmd: string) => void;

interface Props {
  /** The resolved command to render (not necessarily what the visitor typed). */
  cmd: string;
  lang: Lang;
  theme: Theme;
  run: Run;
}

/** "VC" on a 11×7 dot matrix. */
const LOGO = [
  '#...#..####',
  '#...#.#....',
  '#...#.#....',
  '#...#.#....',
  '.#.#..#....',
  '.#.#..#....',
  '..#....####',
];
const LOGO_COLS = LOGO[0].length;

const Logo: React.FC = () => (
  <div className="logo" aria-hidden="true">
    {LOGO.flatMap((row, y) => row.split('').map((cell, x) => {
      const key = `${x}-${y}`;
      if (cell !== '#') return <i key={key} />;
      // 0 → 1 along the diagonal: drives both the colour blend and the power-on delay.
      const k = (x + y) / (LOGO_COLS + LOGO.length - 2);
      return <i key={key} className="on" style={{ '--k': k.toFixed(3) } as React.CSSProperties} />;
    }))}
  </div>
);

const Cmd: React.FC<{ run: Run; cmd: string; className?: string; children?: React.ReactNode }> = ({
  run, cmd, className = 'cmd', children,
}) => (
  <button type="button" className={className} onClick={() => run(cmd)}>{children ?? cmd}</button>
);

/** The button that continues the tour; Enter on an empty prompt does the same. */
const NextCmd: React.FC<{ run: Run; cmd: string }> = ({ run, cmd }) => (
  <Cmd run={run} cmd={cmd} className="cmd primary"><span aria-hidden="true">↵ </span>{cmd}</Cmd>
);

const Step: React.FC<{ lang: Lang; of: string }> = ({ lang, of }) => {
  const step = tourStep(of);
  return step > 0 ? <span className="dim count">{strings[lang].tourStep(step, TOUR.length)}</span> : null;
};

/** Footer of a section: the next tour step first, then other places worth going. */
const Footer: React.FC<{ run: Run; lang: Lang; of: string; more?: string[] }> = ({ run, lang, of, more = [] }) => {
  const next = tourAfter(of);
  return (
    <p className="see-also">
      {next && <><span className="dim">{strings[lang].nextUp}</span><NextCmd run={run} cmd={next} /></>}
      {more.filter((c) => c !== next).map((c) => <Cmd key={c} run={run} cmd={c} />)}
      <Step lang={lang} of={of} />
    </p>
  );
};

const Pager: React.FC<{ run: Run; lang: Lang; cmd: string; index: number }> = ({ run, lang, cmd, index }) => {
  const s = strings[lang];
  const self = `${cmd} ${index + 1}`;
  const next = tourAfter(self);
  return (
    <p className="pager">
      {index > 0 && <Cmd run={run} cmd={`${cmd} ${index}`}>← {s.prev}</Cmd>}
      <Cmd run={run} cmd={cmd}>{s.back}</Cmd>
      {next && <NextCmd run={run} cmd={next} />}
      <Step lang={lang} of={self} />
    </p>
  );
};

const fileName = (url: string): string => url.split('/').pop() ?? url;

/** Parses "2" style arguments into a zero-based index, or null when out of range. */
const toIndex = (arg: string, length: number): number | null => {
  if (!/^\d+$/.test(arg)) return null;
  const n = Number(arg);
  return n >= 1 && n <= length ? n - 1 : null;
};

const percent = (share: number): string => `${(share * 100).toFixed(2)}%`;

const CopyButton: React.FC<{ value: string; lang: Lang }> = ({ value, lang }) => {
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  if (typeof navigator === 'undefined' || !navigator.clipboard) return null;
  const s = strings[lang];
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setDone(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setDone(false), 1600);
    }).catch(() => undefined);
  };
  return (
    <button type="button" className={done ? 'copy done' : 'copy'} onClick={copy} aria-live="polite">
      {done ? `✓ ${s.copied}` : s.copy}
    </button>
  );
};

const ThemePicker: React.FC<{ run: Run; lang: Lang; theme: Theme; compact?: boolean }> = ({
  run, lang, theme, compact,
}) => (
  <ul className={compact ? 'themes compact' : 'themes'}>
    {THEMES.map((name) => {
      const p = PALETTES[name];
      return (
        <li key={name}>
          <button
            type="button"
            aria-pressed={name === theme}
            aria-label={compact ? `theme ${name}` : undefined}
            title={compact ? `theme ${name}` : undefined}
            onClick={() => run(`theme ${name}`)}
            style={{ background: p.window, color: p.text, borderColor: name === theme ? p.green : p.border }}
          >
            <span className="sw" aria-hidden="true">
              {[p.green, p.amber, p.blue, p.violet].map((colour) => <i key={colour} style={{ background: colour }} />)}
            </span>
            {!compact && <span className="theme-name">{name}</span>}
            {!compact && name === theme && (
              <span className="theme-on" style={{ color: p.green }}>
                <span aria-hidden="true">●</span><span className="sr-only"> {strings[lang].themeCurrent}</span>
              </span>
            )}
          </button>
        </li>
      );
    })}
  </ul>
);

const Output: React.FC<Props> = ({ cmd, lang, theme, run }) => {
  const c = t[lang];
  const s = strings[lang];
  const { name, args } = parse(cmd);
  const arg = args[0];

  switch (name) {
    case 'banner':
    case 'neofetch': {
      const stats: readonly { val: string; lbl: string }[] = c.stats.items;
      const facts: readonly { lbl: string; val: string }[] = c.about.facts;
      const current = getJobs(lang).find((job) => job.current);
      const languages = facts[1];
      const core = skillGroups.slice(0, 2).flatMap((group) => group.core);
      return (
        <header className="banner">
          <p className="boot"><span className="ok">●</span> cupnii.sh — {s.boot}</p>
          <div className="fetch">
            <Logo />
            <div className="who">
              <h1>{c.intro.name}</h1>
              <p className="role">{c.intro.role}</p>
              <dl className="facts">
                <dt>{s.fetchStatus}</dt>
                <dd className="ok"><span className="pulse" aria-hidden="true" />{c.intro.status}</dd>
                <dt>{s.fetchExperience}</dt>
                <dd>{stats.slice(0, 2).map((it) => `${it.val} ${it.lbl}`).join(' · ')}</dd>
                {current && (
                  <>
                    <dt>{s.fetchNow}</dt>
                    <dd>{current.role} <span className="at">@</span> {current.company}</dd>
                  </>
                )}
                <dt>{s.fetchStack}</dt>
                <dd>{core.join(' · ')}</dd>
                {languages && (
                  <>
                    <dt>{languages.lbl.toLowerCase()}</dt>
                    <dd>{languages.val}</dd>
                  </>
                )}
                <dt>{s.fetchContact}</dt>
                <dd><a href={`mailto:${EMAIL}`}>{EMAIL}</a></dd>
                <dt>{s.fetchTheme}</dt>
                <dd><ThemePicker run={run} lang={lang} theme={theme} compact /></dd>
              </dl>
            </div>
          </div>
          <p className="hint">
            {s.hint1} <Cmd run={run} cmd="next" className="cmd primary"><span aria-hidden="true">↵ </span>next</Cmd> {s.hint2}{' '}
            <Cmd run={run} cmd="help" /> {s.hint3}
          </p>
        </header>
      );
    }

    case 'help':
      return (
        <section>
          <h2>{s.helpTitle}</h2>
          <div className="help">
            {HELP_GROUPS.map((group) => (
              <div className="help-group" key={group.id}>
                <h3>{s.helpGroups[group.id]}</h3>
                <ul>
                  {group.cmds.map((item) => (
                    <li key={item}>
                      <span className="help-cmd">
                        <Cmd run={run} cmd={item} />
                        {HELP_ARGS[item] && <span className="dim"> {HELP_ARGS[item]}</span>}
                      </span>
                      <span className="help-desc">{s.help[item]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="help-group">
              <h3>{s.helpKeysTitle}</h3>
              <ul>
                {s.helpKeys.map((key) => (
                  <li key={key.keys}>
                    <span className="help-cmd"><kbd>{key.keys}</kbd></span>
                    <span className="help-desc">{key.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      );

    case 'tour':
      return (
        <section>
          <h2>{s.tourTitle}</h2>
          <p>{s.tourText(TOUR.length)}</p>
          <p className="see-also">
            <Cmd run={run} cmd={TOUR[0]} className="cmd primary"><span aria-hidden="true">↵ </span>{s.tourStart}</Cmd>
          </p>
        </section>
      );

    case 'next':
      // Only reached when the tour has nothing left; otherwise `next` is replaced by the step itself.
      return (
        <section>
          <p>{s.tourEnd}</p>
          <p className="see-also">
            <Cmd run={run} cmd="tour">{s.tourRestart}</Cmd>
            <Cmd run={run} cmd="contact" />
          </p>
        </section>
      );

    case 'about': {
      const facts: readonly { lbl: string; val: string }[] = c.about.facts;
      const tags: readonly string[] = c.intro.tags;
      return (
        <section>
          <h2>{c.about.title}</h2>
          <p>{c.about.p1}</p>
          <p>{c.about.p2}</p>
          <dl className="kv">
            {facts.map((f) => (
              <React.Fragment key={f.lbl}>
                <dt>{f.lbl}</dt>
                <dd>{f.val}</dd>
              </React.Fragment>
            ))}
          </dl>
          <p className="tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</p>
          <Footer run={run} lang={lang} of="about" more={['experience', 'projects', 'contact']} />
        </section>
      );
    }

    case 'stats': {
      const items: readonly { val: string; lbl: string }[] = c.stats.items;
      return (
        <section>
          <h2>{c.stats.title}</h2>
          <ul className="stats">
            {items.map((it) => (
              <li key={it.lbl}>
                <strong>{it.val}</strong>
                <span>{it.lbl}</span>
              </li>
            ))}
          </ul>
          <Footer run={run} lang={lang} of="stats" more={['projects', 'skills']} />
        </section>
      );
    }

    case 'experience': {
      const jobs = getJobs(lang);
      if (arg === undefined) {
        const timeline = getTimeline();
        return (
          <section>
            <h2>{s.experienceTitle}</h2>
            <div className={timeline ? 'timeline' : undefined}>
              {timeline && (
                <p className="axis" aria-hidden="true">
                  {Array.from({ length: timeline.years }, (_, i) => {
                    const year = String(timeline.from + i);
                    return <span key={year}><i>{year.slice(0, 2)}</i>{year.slice(2)}</span>;
                  })}
                </p>
              )}
              <ol className="rows">
                {jobs.map((job, i) => {
                  const span = timeline?.spans[i];
                  return (
                    <li key={job.company}>
                      <button type="button" className="row" onClick={() => run(`experience ${i + 1}`)}>
                        <span className="idx">[{i + 1}]</span>
                        <span className="main">
                          <span className="name">{job.role}</span>
                          <span className="at"> @ </span>
                          <span className="org">{job.company}</span>
                          {job.current && <span className="badge">{c.experience.now}</span>}
                        </span>
                        <span className="meta">{job.period}</span>
                        {timeline && (
                          <span
                            className="track"
                            aria-hidden="true"
                            style={{ backgroundSize: `${percent(1 / timeline.years)} 100%` }}
                          >
                            {span && (
                              <i
                                className={job.current ? 'now' : undefined}
                                style={{ left: percent(span.start), width: percent(span.length) }}
                              />
                            )}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            <p className="dim tips">{s.openHint}</p>
            <Footer run={run} lang={lang} of="experience" more={['projects']} />
          </section>
        );
      }
      const index = toIndex(arg, jobs.length);
      if (index === null) return <p className="err">{s.noEntry('experience', arg, jobs.length)}</p>;
      const job = jobs[index];
      return (
        <section>
          <p className="kicker">
            {job.period}
            {job.current && <span className="badge">{c.experience.now}</span>}
          </p>
          <h2>{job.role} <span className="at">@</span> <span className="org">{job.company}</span></h2>
          {job.note && <p className="note">{job.note}</p>}
          <ul className="bullets">
            {job.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <Pager run={run} lang={lang} cmd="experience" index={index} />
        </section>
      );
    }

    case 'projects': {
      const list = getProjects(lang);
      if (arg === undefined) {
        return (
          <section>
            <h2>{s.projectsTitle}</h2>
            <ol className="rows">
              {list.map((p, i) => (
                <li key={p.title}>
                  <button type="button" className="row" onClick={() => run(`projects ${i + 1}`)}>
                    <span className="idx">[{i + 1}]</span>
                    <span className="main"><span className="name">{p.title}</span></span>
                    <span className="meta">{p.kicker}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="dim tips">{s.openHint}</p>
            <Footer run={run} lang={lang} of="projects" more={['skills']} />
          </section>
        );
      }
      const index = toIndex(arg, list.length);
      if (index === null) return <p className="err">{s.noEntry('projects', arg, list.length)}</p>;
      const p = list[index];
      return (
        <section>
          <p className="kicker">{c.projects.label} {index + 1} · {p.kicker}</p>
          <h2>{p.title}</h2>
          <p>{p.desc}</p>
          {p.facts && (
            <ul className="stats">
              {p.facts.map((f) => (
                <li key={f.lbl}>
                  <strong>{f.val}</strong>
                  <span>{f.lbl}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="tags tech">{p.tech.map((tech) => <span key={tech}>{tech}</span>)}</p>
          <Pager run={run} lang={lang} cmd="projects" index={index} />
        </section>
      );
    }

    case 'skills':
      return (
        <section>
          <h2>{c.stack.title}</h2>
          <dl className="skills">
            {skillGroups.map((group) => (
              <React.Fragment key={group.title}>
                <dt>{group.title}</dt>
                <dd>
                  {group.tags.map((tag) => (
                    <span key={tag} className={group.core.includes(tag) ? 'core' : undefined}>{tag}</span>
                  ))}
                </dd>
              </React.Fragment>
            ))}
          </dl>
          <p className="dim tips"><span className="legend">■</span> {c.stack.core}</p>
          <Footer run={run} lang={lang} of="skills" more={['cv']} />
        </section>
      );

    case 'contact':
      return (
        <section>
          <h2>{c.contact.title}</h2>
          <p>{c.contact.desc}</p>
          <dl className="kv contacts">
            {getContactLinks(lang).map((link) => (
              <React.Fragment key={link.href}>
                <dt>{link.label}</dt>
                <dd>
                  <a
                    href={link.href}
                    {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {link.value}
                  </a>
                  {link.href.startsWith('mailto:') && <CopyButton value={link.value} lang={lang} />}
                </dd>
              </React.Fragment>
            ))}
          </dl>
          <Footer run={run} lang={lang} of="contact" />
        </section>
      );

    case 'cv': {
      const files = [
        { label: s.cvMain, url: CV_URL },
        { label: c.ui.cvAiFirst, url: CV_AI_FIRST_URL },
        { label: c.ui.cvFullstack, url: CV_FULLSTACK_URL },
      ];
      return (
        <section>
          <h2>{s.cvTitle}</h2>
          <ul className="files">
            {files.map((f) => (
              <li key={f.url}>
                <a href={f.url} download target="_blank" rel="noopener noreferrer">
                  <span className="dl" aria-hidden="true">↓</span>
                  <span className="file-label">{f.label}</span>
                  <span className="file-name">{fileName(f.url)}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="dim tips">{s.tourEnd}</p>
          <p className="see-also">
            <Cmd run={run} cmd="contact" />
            <Cmd run={run} cmd="tour">{s.tourRestart}</Cmd>
            <Step lang={lang} of="cv" />
          </p>
        </section>
      );
    }

    case 'ls':
      return (
        <section>
          <p className="ls">
            {FILES.map((f) => (
              <Cmd key={f.name} run={run} cmd={f.cmd} className={f.name.endsWith('/') ? 'file dir' : 'file'}>
                {f.name}
              </Cmd>
            ))}
          </p>
          <p className="dim tips">{s.lsHint}</p>
        </section>
      );

    case 'lang': {
      const usage = (
        <>
          <span className="dim"> · {s.usage} </span>
          <Cmd run={run} cmd="lang en" /> <Cmd run={run} cmd="lang ru" />
        </>
      );
      if (arg === undefined) return <p>{s.langCurrent} <span className="ok">{lang}</span>{usage}</p>;
      const wanted = arg.toLowerCase();
      if (!isLang(wanted)) return <p><span className="err">{s.langBad(arg)}</span>{usage}</p>;
      return <p><span className="ok">✓</span> {s.langSet} <span className="ok">{wanted}</span> <span className="dim">({s.langNames[wanted]})</span></p>;
    }

    case 'theme': {
      const wanted = arg?.toLowerCase();
      return (
        <section>
          {wanted === undefined && <h2>{s.themeTitle}</h2>}
          {wanted !== undefined && (
            isTheme(wanted)
              ? <p><span className="ok">✓</span> {s.themeSet} <span className="ok">{wanted}</span></p>
              : <p className="err">{s.themeBad(arg ?? '')}</p>
          )}
          <ThemePicker run={run} lang={lang} theme={theme} />
          <p className="dim tips">{s.themeHint}</p>
        </section>
      );
    }

    case 'whoami':
      return (
        <section>
          <p>{s.whoami}</p>
          <p className="dim">{s.whoamiOwner}</p>
          <p><strong className="hl">{c.intro.name}</strong> — {c.intro.role}</p>
          <p className="see-also">
            <Cmd run={run} cmd="about" />
            <Cmd run={run} cmd="contact" />
          </p>
        </section>
      );

    case 'sudo':
      if (args.join(' ').toLowerCase().replace(/\s+me$/, '') === 'hire') {
        return (
          <section>
            <p className="dim">{s.sudoPassword} ••••••••</p>
            <p><span className="ok">✓</span> {s.sudoGranted}</p>
            <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
            <p className="see-also">
              <Cmd run={run} cmd="contact" />
              <Cmd run={run} cmd="cv" />
            </p>
          </section>
        );
      }
      return (
        <section>
          <p className="err">{s.sudoDenied}</p>
          <p>{s.sudoTry} <Cmd run={run} cmd="sudo hire" /></p>
        </section>
      );

    case 'pwd':
      return <p>/home/visitor/cv</p>;

    case 'echo':
      return <p>{args.join(' ')}</p>;

    case 'exit':
      return <p>{s.exit}</p>;

    case 'rm':
      return <p className="err">{s.rm}</p>;

    default: {
      if (OPENERS.includes(name)) {
        if (arg === undefined && name === 'cd') return <p className="dim">/home/visitor/cv</p>;
        return (
          <section>
            <p className="err">
              {arg === undefined ? `${s.usage} ${name} <${s.openUsage}>` : s.noFile(name, arg)}
            </p>
            <p className="see-also"><Cmd run={run} cmd="ls" /></p>
          </section>
        );
      }
      const guess = suggest(name);
      return (
        <section>
          <p><span className="err">{name}: {s.notFound}</span></p>
          <p>
            {guess && guess !== 'help' && <>{s.didYouMean} <Cmd run={run} cmd={guess} />? </>}
            {s.typeHelpBefore} <Cmd run={run} cmd="help" /> {s.typeHelpAfter}
          </p>
        </section>
      );
    }
  }
};

export default React.memo(Output);
