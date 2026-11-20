import styled from 'styled-components';
import { THEMES, paletteVars } from './themes';

const c = {
  page: 'var(--t-page)',
  window: 'var(--t-window)',
  bar: 'var(--t-bar)',
  raised: 'var(--t-raised)',
  border: 'var(--t-border)',
  text: 'var(--t-text)',
  dim: 'var(--t-dim)',
  bright: 'var(--t-bright)',
  green: 'var(--t-green)',
  amber: 'var(--t-amber)',
  blue: 'var(--t-blue)',
  violet: 'var(--t-violet)',
  red: 'var(--t-red)',
  onAccent: 'var(--t-on-accent)',
};

/** A colour at reduced opacity, for tints of theme colours. */
const tint = (colour: string, percent: number): string => `color-mix(in srgb, ${colour} ${percent}%, transparent)`;

const mono = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

const themeRules = THEMES.map((name) => `&[data-theme='${name}'] { ${paletteVars(name)} }`).join('\n  ');

export const Root = styled.div`
  ${paletteVars('mint')}
  ${themeRules}

  position: relative;
  height: 100%;
  height: 100dvh;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  background: ${c.page};
  color: ${c.text};
  font-family: ${mono};
  font-size: 13px;
  line-height: 1.6;
  font-variant-ligatures: none;
  -webkit-text-size-adjust: 100%;
  color-scheme: dark;
  &[data-theme='paper'] { color-scheme: light; }

  *, *::before, *::after { box-sizing: border-box; }
  p, h1, h2, h3, ul, ol, dl, dd, pre { margin: 0; padding: 0; }
  ul, ol { list-style: none; }
  ::selection { background: ${tint(c.blue, 32)}; }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  a, button, input {
    &:focus-visible { outline: 2px solid ${c.blue}; outline-offset: 2px; border-radius: 3px; }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .dim { color: ${c.dim}; }
  .ok { color: ${c.green}; }
  .err { color: ${c.red}; }
  .hl { color: ${c.bright}; font-weight: 700; }

  /* ---------- window ---------- */

  .window {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    height: 100%;
    background: ${c.window};
    overflow: hidden;
  }

  .bar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 8px 4px 4px;
    padding-top: max(4px, env(safe-area-inset-top));
    background: ${c.bar};
    border-bottom: 1px solid ${c.border};
    color: ${c.text};
  }

  .dots, .wtitle { display: none; }

  .dots {
    gap: 7px;
    padding: 0 6px 0 8px;
    i { width: 12px; height: 12px; border-radius: 50%; }
    i:nth-child(1) { background: #ff6b63; }
    i:nth-child(2) { background: #f5bf4f; }
    i:nth-child(3) { background: #5fcf65; }
  }

  .wtitle {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${c.text};
    font-size: 12px;
    .wcmd { color: ${c.dim}; }
  }

  .switch {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    /* Fades the edge so a scrollable switcher reads as "there is more". */
    mask-image: linear-gradient(to right, #000 calc(100% - 16px), transparent);
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 16px), transparent);
  }

  .variants {
    font-family: inherit;
    font-size: 11.5px;
    gap: 0;
    padding-right: 12px;
    button { padding: 9px 5px; font-weight: 500; opacity: 0.72; border-radius: 6px; }
    button[aria-current='page'] { color: ${c.green}; opacity: 1; border-color: transparent; font-weight: 700; }
    .home { padding: 9px 6px; }
  }

  .lang {
    flex-shrink: 0;
    display: inline-flex;
    border: 1px solid ${c.border};
    border-radius: 6px;
    overflow: hidden;

    button {
      min-width: 30px;
      padding: 7px 6px;
      font-size: 11.5px;
      font-weight: 700;
      line-height: 1;
      color: ${c.dim};
      &:hover { color: ${c.text}; }
      &:focus-visible { outline-offset: -2px; }
      &[aria-pressed='true'] { background: ${c.green}; color: ${c.onAccent}; }
    }
  }

  /* ---------- scrolling output ---------- */

  .screen {
    --pad-y: 14px;
    flex: 1 1 auto;
    min-height: 0;
    container-type: size;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    padding: var(--pad-y) 14px;
    scrollbar-width: thin;
    scrollbar-color: ${c.border} transparent;
  }

  .entry + .entry { margin-top: 26px; }
  /* The newest command gets a screen of its own, so its prompt line can sit at the very top. */
  .entry.fill:last-child { min-height: 100cqh; }

  .echo {
    overflow-wrap: anywhere;
    .typed { color: ${c.bright}; font-weight: 700; }
    .expanded { color: ${c.dim}; }
  }

  .ps1 {
    white-space: nowrap;
    .host { color: ${c.green}; }
    .path { color: ${c.blue}; }
    .sep { color: ${c.dim}; }
  }

  .out {
    margin-top: 10px;
    overflow-wrap: break-word;

    section > * + * { margin-top: 10px; }
    p { max-width: 76ch; }

    h2 {
      font-size: 1.15em;
      font-weight: 700;
      line-height: 1.4;
      color: ${c.amber};
      max-width: 76ch;
      text-wrap: balance;
      &::before { content: '# '; color: ${c.dim}; font-weight: 400; }
    }

    a {
      color: ${c.blue};
      text-decoration: underline;
      text-decoration-color: ${tint(c.blue, 45)};
      text-underline-offset: 3px;
      &:hover { text-decoration-color: currentColor; }
    }

    /* Output arrives line by line, like a fast terminal. */
    > section > *, > p, > .banner {
      animation: term-in 0.26s ease-out backwards;
    }
    > section > :nth-child(2) { animation-delay: 0.04s; }
    > section > :nth-child(3) { animation-delay: 0.08s; }
    > section > :nth-child(4) { animation-delay: 0.12s; }
    > section > :nth-child(5) { animation-delay: 0.16s; }
    > section > :nth-child(n + 6) { animation-delay: 0.2s; }
  }

  @keyframes term-in {
    from { opacity: 0; transform: translateY(5px); }
  }

  .at { color: ${c.dim}; font-weight: 400; }
  .org { color: ${c.green}; }

  /* Inline runnable command. */
  .cmd {
    display: inline-block;
    padding: 1px 8px;
    border: 1px solid ${tint(c.blue, 38)};
    border-radius: 4px;
    background: ${tint(c.blue, 9)};
    color: ${c.blue};
    line-height: 1.5;
    white-space: nowrap;
    transition: background 0.12s ease, border-color 0.12s ease;
    &:hover { background: ${tint(c.blue, 20)}; border-color: ${c.blue}; }

    &.primary {
      border-color: ${c.green};
      background: ${c.green};
      color: ${c.onAccent};
      font-weight: 700;
      &:hover { background: ${c.bright}; border-color: ${c.bright}; color: ${c.window}; }
    }
  }

  kbd {
    display: inline-block;
    padding: 0 6px;
    border: 1px solid ${c.border};
    border-bottom-width: 2px;
    border-radius: 4px;
    background: ${c.raised};
    font: inherit;
    font-size: 0.92em;
    line-height: 1.5;
    white-space: nowrap;
  }

  .badge {
    display: inline-block;
    margin-left: 8px;
    padding: 0 6px;
    border-radius: 3px;
    background: ${c.green};
    color: ${c.onAccent};
    font-size: 0.82em;
    font-weight: 700;
    line-height: 1.55;
    vertical-align: 1px;
    white-space: nowrap;
  }

  /* ---------- banner (neofetch-style card) ---------- */

  .banner {
    .boot { color: ${c.dim}; font-size: 0.92em; }

    .fetch {
      display: flex;
      align-items: flex-start;
      gap: 28px;
      margin-top: 12px;
    }

    .logo {
      display: none;
      flex-shrink: 0;
      grid-template-columns: repeat(11, var(--px));
      grid-auto-rows: var(--px);
      gap: 3px;
      --px: 10px;
      padding-top: 6px;

      i {
        border-radius: 2px;
        background: ${tint(c.dim, 13)};
      }
      i.on {
        background: color-mix(in srgb, ${c.blue} calc(var(--k) * 100%), ${c.green});
        box-shadow: 0 0 10px ${tint(c.green, 28)};
        animation: term-led 0.5s ease-out backwards;
        animation-delay: calc(0.15s + var(--k) * 0.55s);
      }
    }

    .who { min-width: 0; flex: 1 1 auto; }

    h1 {
      font-size: clamp(26px, 7.6vw, 40px);
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: ${c.bright};
    }
    .role { margin-top: 6px; color: ${c.amber}; font-weight: 500; }

    .facts {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      gap: 3px 14px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed ${c.border};
      dt { color: ${c.violet}; }
      dd { min-width: 0; overflow-wrap: anywhere; }
    }

    .pulse {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 8px;
      border-radius: 50%;
      background: ${c.green};
      position: relative;
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: ${c.green};
        animation: term-pulse 2.2s ease-out infinite;
      }
    }

    .hint {
      margin-top: 14px;
      padding: 10px 12px;
      max-width: none;
      border: 1px solid ${c.border};
      border-left: 3px solid ${c.green};
      border-radius: 6px;
      background: ${tint(c.green, 6)};
      line-height: 1.9;
    }
  }

  @keyframes term-pulse {
    from { transform: scale(1); opacity: 0.7; }
    70%, to { transform: scale(3); opacity: 0; }
  }

  @keyframes term-led {
    from { opacity: 0; transform: scale(0.4); }
  }

  /* ---------- theme picker ---------- */

  .themes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    max-width: 76ch;

    button {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 10px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid;
      border-radius: 6px;
      text-align: left;
      transition: transform 0.12s ease;
      &:hover { transform: translateY(-1px); }
    }
    .sw { display: inline-flex; gap: 3px; }
    .sw i { width: 10px; height: 14px; border-radius: 2px; }
    .theme-name { font-weight: 700; }
    .theme-on { font-size: 0.86em; margin-left: auto; }

    &.compact {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: none;
      vertical-align: middle;
      button { width: auto; padding: 4px 5px; border-radius: 4px; }
      .sw i { width: 6px; height: 11px; border-radius: 1px; }
    }
  }

  /* ---------- output blocks ---------- */

  .tips { font-size: 0.92em; }

  .see-also, .pager {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .out section > .see-also, .out section > .pager { margin-top: 16px; }
  .see-also .cmd, .pager .cmd { padding: 3px 10px; }
  .count { font-size: 0.92em; }

  .help {
    display: grid;
    gap: 16px;

    h3 {
      margin-bottom: 4px;
      font-size: 0.92em;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${c.violet};
    }
    li {
      display: grid;
      grid-template-columns: 1fr;
      padding: 4px 0;
    }
  }
  .help-cmd { white-space: nowrap; }
  .help-desc { color: ${c.dim}; }

  .kv {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0 16px;
    dt { color: ${c.violet}; }
    dd { margin-bottom: 8px; overflow-wrap: anywhere; }
    dd:last-child { margin-bottom: 0; }
  }

  .copy {
    margin-left: 10px;
    padding: 0 7px;
    border: 1px solid ${c.border};
    border-radius: 4px;
    color: ${c.dim};
    font-size: 0.88em;
    line-height: 1.6;
    &:hover { color: ${c.text}; border-color: ${c.dim}; }
    &.done { color: ${c.green}; border-color: ${c.green}; }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    color: ${c.violet};
    &.tech {
      gap: 6px;
      span {
        padding: 0 7px;
        border: 1px solid ${c.border};
        border-radius: 4px;
        color: ${c.text};
      }
    }
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
    max-width: 76ch;
    padding: 4px 0;

    li {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-left: 12px;
      border-left: 2px solid ${tint(c.amber, 55)};
    }
    strong {
      font-size: 2.3em;
      line-height: 1;
      letter-spacing: -0.03em;
      color: ${c.amber};
    }
    span { color: ${c.dim}; font-size: 0.92em; line-height: 1.4; }
  }

  .rows { margin-left: -8px; margin-right: -8px; }

  .row {
    display: grid;
    grid-template-columns: 3.2ch minmax(0, 1fr);
    grid-template-areas: 'idx main' '. meta';
    column-gap: 8px;
    width: 100%;
    padding: 7px 8px;
    border-radius: 6px;
    text-align: left;
    transition: background 0.12s ease;

    @media (hover: hover) {
      &:hover { background: ${c.raised}; }
      &:hover .name { text-decoration: underline; text-underline-offset: 3px; }
    }
    &:active { background: ${c.raised}; }

    .idx { grid-area: idx; color: ${c.blue}; }
    .main { grid-area: main; min-width: 0; }
    .name { font-weight: 700; color: ${c.bright}; }
    .meta { grid-area: meta; color: ${c.dim}; font-size: 0.92em; }
  }

  /* Career timeline: every job row carries a bar on a shared year axis. */
  .timeline {
    max-width: 96ch;

    .axis {
      display: flex;
      max-width: none;
      /* Lines up with the tracks: row padding + index column + gap, minus the list's negative margin. */
      padding-left: calc(3.2ch + 8px);
      color: ${c.dim};
      span {
        flex: 1 1 0;
        min-width: 0;
        border-left: 1px solid ${c.border};
        padding-left: 3px;
        font-size: 0.85em;
        line-height: 1.5;
      }
      i { display: none; font-style: normal; }
    }

    .row { grid-template-areas: 'idx main' '. meta' '. track'; }

    .track {
      grid-area: track;
      position: relative;
      display: block;
      height: 9px;
      margin-top: 5px;
      background-image: linear-gradient(to right, ${c.border} 1px, transparent 1px);
      background-repeat: repeat-x;
      border-right: 1px solid ${c.border};
      &::before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        border-top: 1px dashed ${c.border};
      }

      i {
        position: absolute;
        top: 1px;
        bottom: 1px;
        min-width: 4px;
        border-radius: 2px;
        background: color-mix(in srgb, ${c.blue} 68%, ${c.window});
      }
      i.now { background: ${c.green}; box-shadow: 0 0 10px ${tint(c.green, 55)}; }
    }
    .row:hover .track i:not(.now) { background: ${c.blue}; }
  }

  .kicker { color: ${c.violet}; font-size: 0.92em; }
  .note { color: ${c.dim}; font-style: italic; }

  .bullets li {
    position: relative;
    max-width: 76ch;
    padding-left: 2.2ch;
    &::before { content: '▸'; position: absolute; left: 0; color: ${c.green}; }
    & + li { margin-top: 8px; }
  }

  .skills {
    display: grid;
    grid-template-columns: 1fr;
    dt { color: ${c.violet}; font-weight: 700; }
    dd {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 4px 0 12px;
    }
    dd:last-child { margin-bottom: 0; }
    dd span {
      padding: 0 7px;
      border: 1px solid ${c.border};
      border-radius: 4px;
      color: ${c.text};
      white-space: nowrap;
    }
    dd .core {
      border-color: ${c.green};
      background: ${tint(c.green, 13)};
      color: ${c.green};
      font-weight: 700;
    }
  }
  .legend { color: ${c.green}; }

  .files {
    display: grid;
    gap: 8px;
    max-width: 76ch;

    a {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas: 'dl label' 'dl name';
      column-gap: 12px;
      align-items: center;
      padding: 9px 12px;
      border: 1px solid ${c.border};
      border-radius: 6px;
      background: ${c.raised};
      text-decoration: none;
      transition: border-color 0.12s ease;
      &:hover { border-color: ${c.blue}; }
    }
    .dl { grid-area: dl; font-size: 1.4em; color: ${c.green}; }
    .file-label { grid-area: label; color: ${c.bright}; font-weight: 700; }
    .file-name { grid-area: name; font-size: 0.88em; overflow-wrap: anywhere; }
  }

  .ls {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 24px;
    max-width: none;
  }
  .file {
    padding: 2px 0;
    color: ${c.text};
    &:hover { text-decoration: underline; text-underline-offset: 3px; }
    &.dir { color: ${c.blue}; font-weight: 700; }
  }

  /* ---------- dock: chips + prompt ---------- */

  .dock {
    flex-shrink: 0;
    border-top: 1px solid ${c.border};
    background: ${c.bar};
    padding-bottom: env(safe-area-inset-bottom);
  }

  .hints {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 12px 0;
  }

  .chips {
    display: flex;
    gap: 6px;
    padding: 8px 12px;
    overflow-x: auto;
    scrollbar-width: none;
    mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
    &::-webkit-scrollbar { display: none; }
    &::after { content: ''; flex: 0 0 16px; }

    button {
      flex-shrink: 0;
      min-height: 34px;
      padding: 4px 11px;
      border: 1px solid ${c.border};
      border-radius: 99px;
      background: ${c.window};
      color: ${c.text};
      white-space: nowrap;
      transition: border-color 0.12s ease, color 0.12s ease;
      &:not(.go)::before { content: '$ '; color: ${c.dim}; }
      @media (hover: hover) { &:hover { border-color: ${c.green}; color: ${c.green}; } }
      &:active { background: ${c.raised}; }
      &:focus-visible { outline-offset: -2px; border-radius: 99px; }
    }

    .go {
      border-color: ${c.green};
      background: ${c.green};
      color: ${c.onAccent};
      font-weight: 700;
      /* Stays in reach while the other chips scroll underneath. */
      position: sticky;
      left: 0;
      z-index: 1;
      box-shadow: 0 0 0 4px ${c.bar};
      .what { font-weight: 500; }
      @media (hover: hover) { &:hover { color: ${c.onAccent}; filter: brightness(1.08); } }
      &:active { background: ${c.green}; filter: brightness(0.94); }
    }
  }

  .prompt {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 6px 0 12px;
    border-top: 1px solid ${c.border};
    background: ${c.window};
    cursor: text;

    label { flex-shrink: 0; cursor: text; }
    .host { display: none; }

    input {
      flex: 1 1 auto;
      min-width: 0;
      height: 48px;
      padding: 0;
      border: 0;
      background: none;
      color: ${c.bright};
      font-family: inherit;
      /* 16px keeps iOS from zooming the page on focus. */
      font-size: 16px;
      font-weight: 700;
      caret-color: ${c.green};
      caret-shape: block;
      &::placeholder { color: ${c.dim}; font-weight: 400; opacity: 0.85; }
      &:focus-visible { outline: none; }
    }
    &:focus-within { box-shadow: inset 0 2px 0 ${c.green}; }

    .enter {
      flex-shrink: 0;
      width: 40px;
      height: 36px;
      border: 1px solid ${c.border};
      border-radius: 6px;
      color: ${c.green};
      font-size: 16px;
      &:hover { border-color: ${c.green}; }
    }
  }

  /* ---------- CRT theme extras: scanlines and phosphor glow ---------- */

  &[data-theme='crt'] {
    .screen, .dock { text-shadow: 0 0 6px ${tint(c.green, 45)}; }
    .cmd.primary, .go, .badge, .lang button[aria-pressed='true'] { text-shadow: none; }
    .window::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      background: repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0, 0, 0, 0.22) 2px 3px);
    }
  }

  /* ---------- wider screens ---------- */

  @media (min-width: 480px) {
    .prompt .host { display: inline; }
    .stats { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
    .themes { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .timeline .axis i { display: inline; }
  }

  @media (min-width: 600px) {
    .banner .logo { display: grid; }
  }

  @media (min-width: 720px) {
    font-size: 14px;

    .bar { gap: 8px; padding: 4px 8px; }
    .variants { font-size: 12px; button { padding: 7px 8px; } }
    .lang button { min-width: 34px; padding: 6px 7px; font-size: 12px; }

    .screen { --pad-y: 22px; padding: var(--pad-y) 26px; }
    .chips { padding: 10px 22px; }
    .hints { padding: 10px 22px 0; }
    .prompt { padding: 0 12px 0 26px; }
    .prompt input { font-size: 14px; }

    .banner .fetch { gap: 36px; }
    .banner .logo { --px: 13px; }

    .help { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 32px; }
    .help li { grid-template-columns: 17ch minmax(0, 1fr); gap: 12px; padding: 3px 0; }
    .kv { grid-template-columns: max-content minmax(0, 1fr); }
    .kv dd { margin-bottom: 4px; }

    .row {
      grid-template-columns: 3.2ch minmax(0, 1fr) auto;
      grid-template-areas: 'idx main meta';
      column-gap: 12px;
      .meta { text-align: right; white-space: nowrap; font-size: 1em; }
    }
    .timeline .row { grid-template-areas: 'idx main meta' '. track track'; }
    .timeline .axis { padding-left: calc(3.2ch + 12px); }

    .skills {
      grid-template-columns: 19ch minmax(0, 1fr);
      column-gap: 16px;
      row-gap: 10px;
      dd { margin: 0; }
    }
  }

  @media (min-width: 900px) and (min-height: 560px) {
    align-items: center;
    padding: 28px;
    background:
      radial-gradient(900px 500px at 15% 0%, ${tint(c.green, 10)}, transparent 70%),
      radial-gradient(800px 500px at 100% 100%, ${tint(c.blue, 9)}, transparent 70%),
      ${c.page};

    .window {
      max-width: 980px;
      max-height: 860px;
      border: 1px solid ${c.border};
      border-radius: 12px;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px ${tint(c.bright, 3)} inset;
    }
    .bar { padding: 4px 12px; }
    .dots { display: inline-flex; }
    .wtitle { display: inline; margin-right: 8px; }
    .switch { justify-content: flex-end; mask-image: none; -webkit-mask-image: none; }
    .variants { padding-right: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pulse::after, .logo i.on { animation: none; }
    .pulse::after { opacity: 0; }
    .out > section > *, .out > p, .out > .banner { animation: none; }
    * { transition: none !important; }
  }
`;
