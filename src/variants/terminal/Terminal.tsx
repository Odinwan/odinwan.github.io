import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@hooks/useLanguage';
import { Lang } from '../../translations';
import { useFonts } from '../useFonts';
import {
  CHIP_COMMANDS, ListCommand, TOUR, complete, isLang, parse, resolve, tourAfter,
} from './commands';
import Output from './Output';
import { strings } from './strings';
import { Root } from './Terminal.styled';
import { Theme, isTheme, readStoredTheme, storeTheme } from './themes';

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap';
const INTRO_COMMAND = TOUR[0];
const LANGS: Lang[] = ['en', 'ru'];

interface Entry {
  id: number;
  /** What the visitor typed (echoed after the prompt). */
  raw: string;
  /** What is rendered: `raw` with shortcuts like `3` or `cat about.md` resolved. */
  cmd: string;
  /** Printed without the prompt line (the boot banner). */
  silent?: boolean;
  /** Gets a screen of its own: tall enough for its prompt line to scroll to the top. */
  fill?: boolean;
}

const matches = (query: string): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

const Ps1: React.FC = () => (
  <span className="ps1">
    <span className="host">visitor@cupnii<span className="sep">:</span></span>
    <span className="path">~</span>
    <span className="sep">$</span>
  </span>
);

const Terminal: React.FC = () => {
  useFonts(FONT_HREF);
  const { lang, setLang } = useLanguage();
  const s = strings[lang];

  const [entries, setEntries] = useState<Entry[]>([{ id: 0, raw: 'banner', cmd: 'banner', silent: true }]);
  const [input, setInput] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  /** The tour step that an empty Enter (or the "next" chip) runs; null once the tour is over. */
  const [tourNext, setTourNext] = useState<string | null>(INTRO_COMMAND);

  const tourNextRef = useRef<string | null>(INTRO_COMMAND);
  const listRef = useRef<ListCommand>('experience');
  const nextId = useRef(1);
  const history = useRef<string[]>([]);
  const historyPos = useRef(-1); // -1 = editing a fresh line
  const draft = useRef('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLElement>(null);
  const skipScroll = useRef(true);
  const introDone = useRef(false);
  const cancelIntro = useRef<(() => void) | null>(null);

  const stopIntro = useCallback(() => {
    if (introDone.current) return;
    introDone.current = true;
    if (cancelIntro.current) {
      cancelIntro.current();
      cancelIntro.current = null;
      setInput('');
    }
  }, []);

  const execute = useCallback((typed: string, opts: { record: boolean; scroll: boolean }) => {
    let raw = typed.trim();
    // Enter on an empty line and `next` both continue the tour.
    if (raw === '' || parse(raw).name === 'next') raw = tourNextRef.current ?? raw;
    if (!raw) return;

    const cmd = resolve(raw, listRef.current);
    const { name, args } = parse(cmd);

    if (opts.record && history.current[history.current.length - 1] !== raw) history.current.push(raw);
    historyPos.current = -1;
    draft.current = '';
    setInput('');
    setHints([]);

    if (name === 'clear') {
      setEntries([]);
      return;
    }
    const wanted = args[0]?.toLowerCase();
    if (name === 'lang' && isLang(wanted)) setLang(wanted);
    if (name === 'theme' && isTheme(wanted)) {
      setTheme(wanted);
      storeTheme(wanted);
    }
    if (name === 'experience' || name === 'projects') listRef.current = name;

    const upcoming = name === 'tour' ? TOUR[0] : tourAfter(cmd);
    if (upcoming !== undefined) {
      tourNextRef.current = upcoming;
      setTourNext(upcoming);
    }

    skipScroll.current = !opts.scroll;
    const id = nextId.current;
    nextId.current += 1;
    setEntries((list) => [...list, { id, raw, cmd, fill: opts.scroll }]);
  }, [setLang]);

  /** Runs a command on the visitor's behalf (typed, chip or clicked output). */
  const run = useCallback((raw: string) => {
    stopIntro();
    execute(raw, { record: true, scroll: true });
    // Hand the keyboard back to the prompt, but don't pop up a phone keyboard on every tap.
    if (matches('(pointer: fine)')) inputRef.current?.focus({ preventScroll: true });
  }, [execute, stopIntro]);

  // First load: type the intro command into the prompt, then run it.
  useEffect(() => {
    if (introDone.current) return undefined;
    const finish = () => {
      introDone.current = true;
      cancelIntro.current = null;
      execute(INTRO_COMMAND, { record: false, scroll: false });
    };
    if (matches('(prefers-reduced-motion: reduce)')) {
      finish();
      return undefined;
    }
    const timers: number[] = [];
    const cancel = () => timers.forEach((id) => window.clearTimeout(id));
    for (let i = 1; i <= INTRO_COMMAND.length; i += 1) {
      timers.push(window.setTimeout(() => setInput(INTRO_COMMAND.slice(0, i)), 700 + i * 85));
    }
    timers.push(window.setTimeout(finish, 700 + INTRO_COMMAND.length * 85 + 380));
    cancelIntro.current = cancel;
    return () => {
      cancel();
      cancelIntro.current = null;
    };
  }, [execute]);

  // Desktop: start with the prompt focused.
  useEffect(() => {
    if (matches('(pointer: fine)')) inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Bring the newest command to the top of the viewport.
  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    const scroller = scrollerRef.current;
    const last = scroller?.querySelector<HTMLElement>('.entry:last-child');
    if (!scroller || !last) return;
    const pad = parseFloat(window.getComputedStyle(scroller).paddingTop) || 0;
    const top = last.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - pad;
    scroller.scrollTo({ top, behavior: matches('(prefers-reduced-motion: reduce)') ? 'auto' : 'smooth' });
  }, [entries]);

  // Typing anywhere on the page lands in the prompt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === ' ') return;
      const active = document.activeElement;
      if (active && active !== document.body) return;
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Phones: keep the prompt above the on-screen keyboard by sizing the terminal to the visible area.
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = rootRef.current;
    if (!viewport || !root) return undefined;
    const sync = () => {
      // Only for a keyboard over the focused prompt; pinch-zoom also shrinks the visual viewport.
      const typing = document.activeElement === inputRef.current && viewport.scale < 1.05;
      const covered = typing && window.innerHeight - viewport.height > 120;
      if (covered) {
        root.style.height = `${Math.round(viewport.height - root.getBoundingClientRect().top)}px`;
        window.scrollTo(0, 0);
      } else {
        root.style.removeProperty('height');
      }
    };
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
      root.style.removeProperty('height');
    };
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(input);
  };

  const showHistory = (pos: number) => {
    const list = history.current;
    historyPos.current = pos;
    const value = pos === -1 ? draft.current : list[list.length - 1 - pos];
    setInput(value);
    setHints([]);
    // Keep the caret at the end after the value swap.
    window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) el.setSelectionRange(value.length, value.length);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stopIntro();
      if (historyPos.current >= history.current.length - 1) return;
      if (historyPos.current === -1) draft.current = input;
      showHistory(historyPos.current + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPos.current === -1) return;
      showHistory(historyPos.current - 1);
    } else if (e.key === 'Tab' && !e.shiftKey && input.trim() !== '') {
      // With an empty prompt Tab keeps its normal job, so keyboard users are never trapped.
      e.preventDefault();
      stopIntro();
      const result = complete(input);
      setInput(result.value);
      setHints(result.candidates);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      run('clear');
    } else if (e.key === 'c' && e.ctrlKey && e.currentTarget.selectionStart === e.currentTarget.selectionEnd) {
      e.preventDefault();
      stopIntro();
      setInput('');
      setHints([]);
      historyPos.current = -1;
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopIntro();
    historyPos.current = -1;
    setInput(e.target.value);
    setHints([]);
  };

  // Click on empty terminal space focuses the prompt; selections and controls are left alone.
  const onWindowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, nav')) return;
    if (window.getSelection()?.toString()) return;
    if (!matches('(pointer: fine)') && !target.closest('.prompt')) return;
    inputRef.current?.focus({ preventScroll: true });
  };

  const lastTyped = [...entries].reverse().find((entry) => !entry.silent)?.cmd;

  return (
    <Root ref={rootRef} data-theme={theme} onClick={onWindowClick}>
      <div className="window">
        <header className="bar">
          <span className="dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="wtitle" aria-hidden="true">
            cupnii.sh{lastTyped && <span className="wcmd"> — {lastTyped}</span>}
          </span>
          <span className="switch" aria-hidden="true" />
          <div className="lang" role="group" aria-label={s.langLabel}>
            {LANGS.map((code) => (
              <button
                type="button"
                key={code}
                lang={code}
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <main className="screen" ref={scrollerRef}>
          <div className="log" role="log" aria-live="polite" aria-label={s.outputLabel}>
            {entries.map((entry) => (
              <div className={entry.fill ? 'entry fill' : 'entry'} key={entry.id}>
                {!entry.silent && (
                  <p className="echo">
                    <Ps1 /> <span className="typed">{entry.raw}</span>
                    {entry.cmd !== entry.raw && <span className="expanded"> → {entry.cmd}</span>}
                  </p>
                )}
                <div className="out">
                  <Output cmd={entry.cmd} lang={lang} theme={theme} run={run} />
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="dock">
          {hints.length > 0 && (
            <p className="hints">
              {hints.map((h) => (
                <button type="button" className="cmd" key={h} onClick={() => run(h)}>{h}</button>
              ))}
            </p>
          )}
          <nav className="chips" aria-label={s.chipsLabel}>
            {tourNext && (
              <button type="button" className="go" onClick={() => run(tourNext)}>
                <span aria-hidden="true">↵ </span>{s.next}<span className="what">: {tourNext}</span>
              </button>
            )}
            {CHIP_COMMANDS.map((cmd) => (
              <button type="button" key={cmd} onClick={() => run(cmd)}>{cmd}</button>
            ))}
          </nav>
          <form className="prompt" onSubmit={onSubmit}>
            <label htmlFor="terminal-input">
              <Ps1 />
              <span className="sr-only">{s.inputLabel}</span>
            </label>
            <input
              id="terminal-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder={tourNext ? s.placeholderNext(tourNext) : s.inputPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="go"
            />
            <button type="submit" className="enter" aria-label={s.runLabel}>↵</button>
          </form>
        </footer>
      </div>
    </Root>
  );
};

export default Terminal;
