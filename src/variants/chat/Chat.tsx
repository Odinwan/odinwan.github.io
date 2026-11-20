import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import { Lang, t } from '../../translations';
import { CV_URL, PHOTO_URL } from '../../data/links';
import { Bubble, isWide } from './Bubbles';
import { Root, Switcher } from './Chat.styled';
import { copy } from './copy';
import {
  Body, Chip, Intent, Message, READ_DELAY, TOPICS, Topic, getJobs, matchIntent, replyFor, suggest, typingTime,
} from './engine';
import { Scroller } from './Scroller';

const LANGS: readonly Lang[] = ['en', 'ru'];

const GREETING: readonly Body[] = [{ kind: 'hi' }, { kind: 'role' }, { kind: 'say', key: 'hint' }];

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');

/** One tick when sent, two when Vladislav has "read" it. */
const Ticks: React.FC<{ read: boolean }> = ({ read }) => (
  <svg className={read ? 'ticks read' : 'ticks'} viewBox="0 0 22 12" width="18" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m1 6.5 3.5 3.5L12 2" />
    {read && <path d="m9.5 9 1 1L18 2" />}
  </svg>
);

interface RowProps {
  m: Message;
  lang: Lang;
  first: boolean;
  last: boolean;
  read: boolean;
  flash: boolean;
  time: string;
  onAsk: (intent: Intent) => void;
}

/** Memoised so that typing in the composer does not re-render the whole conversation. */
const Row = memo<RowProps>(({ m, lang, first, last, read, flash, time, onAsk }) => {
  const c = copy[lang];
  const classes = ['msg', m.from, isWide(m) ? 'wide' : '', first ? 'first' : '', last ? 'last' : '', flash ? 'flash' : ''].filter(Boolean).join(' ');

  return (
    <div className={classes} data-id={m.id}>
      <span className="visually-hidden">{m.from === 'me' ? c.you : t[lang].intro.name}: </span>
      {m.from === 'them' && (
        <span className="mini" aria-hidden="true">
          {first && <img src={PHOTO_URL} alt="" />}
        </span>
      )}
      <div className="body">
        <Bubble message={m} lang={lang} onAsk={onAsk} />
        {last && (
          <p className="meta">
            <time dateTime={new Date(m.at).toISOString()}>{time}</time>
            {m.from === 'me' && (
              <>
                <Ticks read={read} />
                <span className="visually-hidden">{read ? c.read : c.sent}</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
});
Row.displayName = 'Row';

const Chat: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const tr = t[lang];
  const c = copy[lang];

  const nextId = useRef(GREETING.length);
  const make = (from: Message['from'], body: Body): Message => ({ ...body, id: nextId.current++, from, at: Date.now() }) as Message;

  // With reduced motion the greeting is simply there; otherwise it is "typed" one line at a time.
  const [messages, setMessages] = useState<Message[]>(() => {
    const now = Date.now();
    const all = GREETING.map((body, id) => ({ ...body, id, from: 'them', at: now }) as Message);
    return prefersReducedMotion() ? all : all.slice(0, 1);
  });
  const [typing, setTyping] = useState(false);
  const [seen, setSeen] = useState(-1);
  const [asked, setAsked] = useState<Topic[]>([]);
  const [detailed, setDetailed] = useState<number[]>([]);
  const [last, setLast] = useState<Intent | null>(null);
  const [anchors, setAnchors] = useState<Partial<Record<Topic, number>>>({});
  const [draft, setDraft] = useState('');
  const [menu, setMenu] = useState(false);
  const [away, setAway] = useState(false);
  const [flash, setFlash] = useState<number | null>(null);

  const queue = useRef<Body[]>([]);
  const timer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);
  const wrapped = useRef(false);
  /** The visitor's last message: a long answer is read from its question down, not from its end. */
  const anchorId = useRef<number | null>(null);
  const refocusChips = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Delivers queued replies one by one, each after its own typing pause. */
  const step = useCallback(() => {
    const next = queue.current[0];
    if (!next) { setTyping(false); return; }
    timer.current = window.setTimeout(() => {
      timer.current = null;
      queue.current.shift();
      const item = { ...next, id: nextId.current++, from: 'them', at: Date.now() } as Message;
      setMessages((prev) => [...prev, item]);
      step();
    }, typingTime(next));
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion()) {
      queue.current = GREETING.slice(1);
      setTyping(true);
      step();
    }
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
      timer.current = null;
      queue.current = [];
    };
  }, [step]);

  const send = (intent: Intent, mine: Body) => {
    const me = make('me', mine);
    const replies = replyFor(intent);

    if (intent.type === 'topic') {
      setLast(intent);
      setAnchors((prev) => ({ ...prev, [intent.topic]: me.id }));
      if (!asked.includes(intent.topic)) {
        const nextAsked = [...asked, intent.topic];
        setAsked(nextAsked);
        if (!wrapped.current && nextAsked.length === TOPICS.length) {
          wrapped.current = true;
          replies.push({ kind: 'say', key: 'wrap' });
        }
      }
    } else if (intent.type === 'job') {
      setLast(intent);
      if (!detailed.includes(intent.job)) setDetailed([...detailed, intent.job]);
    }

    anchorId.current = me.id;
    setMenu(false);

    if (prefersReducedMotion()) {
      const items = replies.map((body) => make('them', body));
      setMessages((prev) => [...prev, me, ...items]);
      setSeen(me.id);
      return;
    }

    // Asked before the previous answer finished: deliver the rest of it at once, so answers never interleave.
    if (timer.current !== null) window.clearTimeout(timer.current);
    const pending = queue.current.map((body) => make('them', body));
    queue.current = [...replies];
    setMessages((prev) => [...prev, ...pending, me]);
    setTyping(false);

    timer.current = window.setTimeout(() => {
      timer.current = null;
      setSeen(me.id);
      setTyping(true);
      step();
    }, READ_DELAY);
  };

  const ask = (intent: Intent, follow = false) => {
    if (intent.type === 'topic') send(intent, { kind: 'ask', topic: intent.topic, follow });
    else if (intent.type === 'job') send(intent, { kind: 'askJob', job: intent.job });
  };

  // Rows are memoised, so they get one stable callback that always reaches the latest `ask`.
  const askRef = useRef(ask);
  askRef.current = ask;
  const onAsk = useCallback((intent: Intent) => askRef.current(intent), []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    send(matchIntent(text), { kind: 'typed', text });
    // On touch screens put the keyboard away so the answer is not hidden behind it.
    if (window.matchMedia('(pointer: coarse)').matches) inputRef.current?.blur();
  };

  /* ---------- scrolling ---------- */

  const settle = useCallback((behavior: ScrollBehavior) => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollHeight - list.clientHeight;
    const anchor = anchorId.current === null ? null : list.querySelector<HTMLElement>(`.msg[data-id="${anchorId.current}"]`);
    const top = anchor ? Math.min(max, anchor.offsetTop - 14) : max;
    list.scrollTo({ top: Math.max(0, top), behavior });
  }, []);

  useEffect(() => { settle(scrollBehavior()); }, [messages.length, typing, settle]);

  const onScroll = () => {
    const list = listRef.current;
    if (!list) return;
    setAway(list.scrollHeight - list.clientHeight - list.scrollTop > 140);
  };

  useEffect(onScroll, [messages.length, typing]);

  const toLatest = () => {
    const list = listRef.current;
    if (!list) return;
    anchorId.current = null;
    list.scrollTo({ top: list.scrollHeight, behavior: scrollBehavior() });
  };

  /** Scrolls back to an already answered question and flashes it. */
  const jumpTo = (id: number) => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`.msg[data-id="${id}"]`);
    if (!list || !row) return;
    list.scrollTo({ top: Math.max(0, row.offsetTop - 14), behavior: scrollBehavior() });
    setFlash(id);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => { flashTimer.current = null; setFlash(null); }, 1500);
  };

  const pickTopic = (topic: Topic) => {
    const answered = anchors[topic];
    setMenu(false);
    if (answered !== undefined && asked.includes(topic)) jumpTo(answered);
    else ask({ type: 'topic', topic });
  };

  // An on-screen keyboard shrinks only the visual viewport: follow it so the composer stays visible.
  useEffect(() => {
    const vv = window.visualViewport;
    const root = rootRef.current;
    if (!vv || !root) return undefined;
    const fit = () => {
      const covered = vv.scale < 1.05 && window.innerHeight - vv.height > 120;
      const height = covered ? `${Math.round(vv.height - root.getBoundingClientRect().top)}px` : '';
      if (root.style.height === height) return;
      root.style.height = height;
      if (covered) window.scrollTo(0, 0);
      settle('auto');
    };
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
    return () => {
      vv.removeEventListener('resize', fit);
      vv.removeEventListener('scroll', fit);
      root.style.height = '';
    };
  }, [settle]);

  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  /* ---------- suggestions ---------- */

  const chips = useMemo(() => suggest({ last, asked, detailed }), [last, asked, detailed]);
  const chipsKey = chips.map((chip) => chip.key).join(' ');

  // A tapped chip disappears; keyboard users continue from the first new suggestion.
  useEffect(() => {
    if (!refocusChips.current) return;
    refocusChips.current = false;
    footRef.current?.querySelector<HTMLButtonElement>('.chips .track button')?.focus({ preventScroll: true });
  }, [chipsKey]);

  const chipLabel = (chip: Chip): string => {
    if (chip.intent.type === 'job') return c.moreAbout(getJobs(lang)[chip.intent.job].company);
    return chip.follow ? c.follow[chip.intent.topic] : c.q[chip.intent.topic];
  };

  const topicNames: Record<Topic, string> = {
    about: tr.chapters.about,
    now: tr.experience.now,
    experience: tr.chapters.career,
    projects: tr.chapters.projects,
    stack: tr.chapters.stack,
    stats: tr.chapters.stats,
    cv: tr.ui.cv,
    contact: tr.chapters.contact,
  };

  const clock = useMemo(() => new Intl.DateTimeFormat(tr.locale, { hour: '2-digit', minute: '2-digit' }), [tr.locale]);
  const share = asked.length / TOPICS.length;

  const topics = (
    <>
      <div className="progress">
        <span>{c.topics}</span>
        <span>{c.progress(asked.length, TOPICS.length)}</span>
      </div>
      <div className="bar" aria-hidden="true">
        <i style={{ transform: `scaleX(${share})` }} />
      </div>
      <ul className="topics">
        {TOPICS.map((topic, i) => {
          const done = asked.includes(topic);
          return (
            <li key={topic}>
              <button type="button" className={done ? 'done' : undefined} onClick={() => pickTopic(topic)}>
                <span className="num" aria-hidden="true">
                  {done ? (
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                  ) : String(i + 1).padStart(2, '0')}
                </span>
                <span className="topic-text">
                  <strong>{topicNames[topic]}</strong>
                  <small>{c.q[topic]}</small>
                </span>
                {done && <span className="visually-hidden"> ({c.asked} — {c.jump})</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <Root ref={rootRef}>
      <div className="frame">
        <aside className="side" aria-label={c.topics}>
          <img className="portrait" src={PHOTO_URL} alt="" />
          <p className="side-name">{tr.intro.name}</p>
          <p className="side-role">{tr.intro.role}</p>
          <p className="pill"><i aria-hidden="true" />{tr.intro.status}</p>

          {topics}

          <a className="side-cv" href={CV_URL} download target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v11" />
              <path d="m7 11 5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
            {tr.ui.downloadCv}
          </a>
        </aside>

        <main className="chat">
          <header className="head">
            <div className="who">
              <span className="avatar">
                <img src={PHOTO_URL} alt="" />
                <i aria-hidden="true" />
              </span>
              <div className="who-text">
                <h1>{tr.intro.name}</h1>
                <p className={typing ? 'is-typing' : undefined}>
                  {typing ? c.typing : <><span className="on">{c.online} · </span>{tr.intro.status}</>}
                </p>
              </div>
            </div>

            <div className="lang" role="group" aria-label={c.language}>
              {LANGS.map((code) => (
                <button key={code} type="button" lang={code} aria-pressed={lang === code} onClick={() => setLang(code)}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>

          </header>

          <div className="stage">
            <div className="list" ref={listRef} role="log" aria-live="polite" aria-label={c.log} tabIndex={0} onScroll={onScroll}>
              <div className="thread">
                <div className="intro" aria-hidden="true">
                  <img src={PHOTO_URL} alt="" />
                  <p className="intro-name">{tr.intro.name}</p>
                  <p className="intro-role">{tr.intro.role}</p>
                </div>
                <p className="day"><span>{c.today}</span></p>

                {messages.map((m, i) => (
                  <Row
                    key={m.id}
                    m={m}
                    lang={lang}
                    first={messages[i - 1]?.from !== m.from}
                    last={messages[i + 1]?.from !== m.from && !(typing && m.from === 'them' && i === messages.length - 1)}
                    read={m.id <= seen}
                    flash={flash === m.id}
                    time={clock.format(m.at)}
                    onAsk={onAsk}
                  />
                ))}

                {typing && (
                  <div className={messages[messages.length - 1]?.from === 'them' ? 'typing' : 'typing first'} aria-hidden="true">
                    <span className="mini">
                      {messages[messages.length - 1]?.from !== 'them' && <img src={PHOTO_URL} alt="" />}
                    </span>
                    <span className="dots"><i /><i /><i /></span>
                  </div>
                )}
              </div>
            </div>

            <button type="button" className="latest" data-show={away} tabIndex={away ? 0 : -1} aria-hidden={!away} aria-label={c.latest} onClick={toLatest}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14" />
                <path d="m6 13 6 6 6-6" />
              </svg>
            </button>

            {menu && <div className="scrim" onClick={() => setMenu(false)} />}
          </div>

          <footer className="foot" ref={footRef}>
            {menu && <div className="sheet" id="chat-topics">{topics}</div>}

            <Scroller className="chips" label={c.suggestions} prevLabel={c.prev} nextLabel={c.next} resetKey={chipsKey} list>
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={(e) => {
                      refocusChips.current = e.currentTarget.matches(':focus-visible');
                      ask(chip.intent, chip.follow);
                    }}
                  >
                    {chipLabel(chip)}
                  </button>
                </li>
              ))}
            </Scroller>

            <form className="composer" onSubmit={onSubmit}>
              <button
                type="button"
                className="menu"
                aria-label={c.openTopics}
                aria-expanded={menu}
                aria-controls={menu ? 'chat-topics' : undefined}
                onClick={() => setMenu((v) => !v)}
              >
                <svg className="ring" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
                  <circle cx="18" cy="18" r="15.5" pathLength="100" />
                  <circle className="value" cx="18" cy="18" r="15.5" pathLength="100" strokeDasharray={`${share * 100} 100`} />
                </svg>
                <span aria-hidden="true">{asked.length}/{TOPICS.length}</span>
              </button>

              <label className="visually-hidden" htmlFor="chat-input">{c.inputLabel}</label>
              <input
                id="chat-input"
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={c.placeholder}
                autoComplete="off"
                enterKeyHint="send"
                maxLength={200}
              />
              <button type="submit" className="send" aria-label={c.send} disabled={!draft.trim()}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5" />
                  <path d="m6 11 6-6 6 6" />
                </svg>
              </button>
            </form>
          </footer>
        </main>
      </div>
    </Root>
  );
};

export default Chat;
