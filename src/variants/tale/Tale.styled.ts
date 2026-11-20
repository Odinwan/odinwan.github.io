import styled, { keyframes } from 'styled-components';
import VariantSwitcher from '../VariantSwitcher';

const DISPLAY = "'Yeseva One', 'Playfair Display', Georgia, 'Times New Roman', serif";
const TEXT = "'Literata', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif";

/** Two-page spread from here up; below it the book is one full-screen page. Keep in sync with WIDE in Tale.tsx. */
const DESK = '(min-width: 900px)';

const flipForward = keyframes`
  from { transform: rotateY(0deg); }
  to { transform: rotateY(-180deg); }
`;
const flipBack = keyframes`
  from { transform: rotateY(0deg); }
  to { transform: rotateY(180deg); }
`;
const shade = keyframes`
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
`;
const slideNext = keyframes`
  from { opacity: 0; transform: translateX(28px) rotate(0.6deg); }
  to { opacity: 1; transform: none; }
`;
const slidePrev = keyframes`
  from { opacity: 0; transform: translateX(-28px) rotate(-0.6deg); }
  to { opacity: 1; transform: none; }
`;

export const Switcher = styled(VariantSwitcher)`
  flex: 1 1 0;
  min-width: 0;
  font-size: 12.5px;

  button { padding: 6px 9px; }
`;

export const Root = styled.div`
  --paper: #fbf3e0;
  --paper-2: #f3e6c8;
  --ink: #2e211a;
  --muted: #6c5947;
  --rule: #dccba6;
  --tomato: #c8321a;
  --tomato-bright: #ff5b36;
  --tomato-deep: #9c2412;
  --leaf: #2f6b33;
  --gold: #e9b44c;
  --cream: #fdf1d6;
  --fade: var(--paper);

  display: flex;
  flex-direction: column;
  height: var(--app-h, 100dvh);
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% 40%, rgba(255, 214, 150, 0.16), transparent 60%),
    repeating-linear-gradient(92deg, rgba(0, 0, 0, 0.05) 0 2px, transparent 2px 9px),
    linear-gradient(180deg, #4a3226, #2c1c15);
  color: var(--cream);
  color-scheme: light;
  /* Storybook lettering for chapter titles and illuminated initials. */
  --fairy: 'Uncial Antiqua', ${DISPLAY};
  &[lang='ru'] { --fairy: 'Ruslan Display', ${DISPLAY}; }
  font-family: ${TEXT};
  font-size: 16px;
  line-height: 1.55;
  text-align: left;
  -webkit-text-size-adjust: 100%;

  *, *::before, *::after { box-sizing: border-box; }

  /* inside a host scene only the book is opaque: the room shows through */
  &.in-scene { background: transparent; }

  :focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .page:not(.cover) :focus-visible { outline-color: var(--tomato); }
  .stage:focus { outline: none; }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  /* ───────── header ───────── */

  .top {
    flex: none;
    display: flex;
    align-items: center;
    gap: 6px 14px;
    padding: 6px 14px;
    padding-top: calc(6px + env(safe-area-inset-top, 0px));
    min-width: 0;
  }

  .brand {
    /* visually hidden on phones, a quiet title on desktop */
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    font-family: ${DISPLAY};
    font-size: 15px;
    font-weight: 400;
    letter-spacing: 0.01em;
    color: var(--gold);
  }

  .lang {
    flex: none;
    display: inline-flex;
    padding: 2px;
    border: 1px solid rgba(253, 241, 214, 0.35);
    border-radius: 99px;

    button {
      min-width: 36px;
      padding: 5px 9px;
      border: 0;
      border-radius: 99px;
      background: none;
      color: inherit;
      font: 600 12px/1 ${TEXT};
      letter-spacing: 0.06em;
      cursor: pointer;
      opacity: 0.7;
    }
    button:hover { opacity: 1; }
    button[aria-pressed='true'] {
      background: var(--cream);
      color: var(--ink);
      opacity: 1;
    }
  }

  .close {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px;
    border: 1px solid var(--gold);
    border-radius: 99px;
    background: rgba(233, 180, 76, 0.14);
    color: var(--cream);
    font: 600 12.5px/1 ${TEXT};
    white-space: nowrap;
    cursor: pointer;
  }
  .close:hover { background: rgba(233, 180, 76, 0.3); }

  /* phones, when closable: close + language on the first row, designs on the second */
  &.in-scene .top { flex-wrap: wrap; }
  &.in-scene .top > nav { order: 3; flex: 1 1 100%; }
  &.in-scene .lang { margin-left: auto; }

  .close-row { margin: 16px 0 0 !important; text-align: center; }
  .shut {
    padding: 8px 18px;
    border: 1px solid var(--tomato);
    border-radius: 99px;
    background: none;
    color: var(--tomato-deep);
    font: 600 14px/1.2 ${TEXT};
    cursor: pointer;
  }
  .shut:hover { background: rgba(200, 50, 26, 0.08); }

  /* ───────── stage & book ───────── */

  .stage {
    flex: 1 1 0;
    min-height: 0;
    position: relative;
    touch-action: pan-y;
  }

  .sheet {
    position: absolute;
    inset: 4px 10px 6px;
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.4));
  }
  .sheet.in-next { animation: ${slideNext} 0.32s ease-out both; }
  .sheet.in-prev { animation: ${slidePrev} 0.32s ease-out both; }

  .page {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 20px 8px;
    overflow: hidden;
    color: var(--ink);
    background:
      radial-gradient(90% 60% at 22% 8%, rgba(255, 255, 255, 0.55), transparent 60%),
      radial-gradient(70% 50% at 85% 95%, rgba(205, 170, 105, 0.22), transparent 70%),
      repeating-linear-gradient(0deg, rgba(120, 90, 40, 0.028) 0 1px, transparent 1px 4px),
      linear-gradient(180deg, var(--paper), var(--paper-2));
  }
  .page.single { border-radius: 10px; }
  .page.blank { background-color: var(--paper); }

  .running {
    flex: none;
    margin: 0 0 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--rule);
    overflow: hidden;
    color: var(--muted);
    font-size: 11px;
    font-style: italic;
    letter-spacing: 0.04em;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .folio {
    flex: none;
    margin: 4px 0 0;
    color: var(--muted);
    font-family: ${DISPLAY};
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
  }
  .folio::before, .folio::after { content: '·'; margin: 0 0.6em; color: var(--tomato); }

  /* scrolling content of a page */
  .scroller {
    flex: 1 1 0;
    min-height: 0;
    position: relative;
  }
  .scroll {
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--rule) transparent;
  }
  .scroll:focus-visible { outline-offset: -2px; }
  .scroll-in {
    display: flow-root;
    min-height: 100%;
    padding: 2px 2px 14px;
  }
  .fade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 46px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    background: linear-gradient(180deg, transparent, var(--fade));
  }
  .fade::after {
    /* small chevron: "there is more below" */
    content: '';
    position: absolute;
    left: 50%;
    bottom: 5px;
    width: 9px;
    height: 9px;
    margin-left: -5px;
    border-right: 2px solid var(--tomato);
    border-bottom: 2px solid var(--tomato);
    transform: rotate(45deg);
  }
  .scroller.more .fade { opacity: 1; }

  /* ───────── page typography ───────── */

  .page p { margin: 0 0 0.75em; }
  .page p, .page li { overflow-wrap: break-word; }

  .kicker {
    margin: 0 0 4px !important;
    color: var(--tomato);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .title {
    margin: 0 0 10px;
    color: var(--ink);
    font-family: var(--fairy);
    font-size: clamp(23px, 6.2vw, 30px);
    font-weight: 400;
    line-height: 1.12;
    text-wrap: balance;
  }
  .title.feat { font-size: clamp(22px, 5.6vw, 26px); }
  .center { text-align: center; }

  .subtitle {
    margin: 0 0 12px;
    font-family: ${DISPLAY};
    font-size: 22px;
    font-weight: 400;
    line-height: 1.2;
  }

  .narr {
    color: #4a382c;
    font-style: italic;
  }
  .narr strong { font-style: normal; font-weight: 600; color: var(--ink); }
  .narr.cap::first-letter {
    /* An illuminated initial: gold letter on a painted tile. */
    float: left;
    margin: 0.08em 0.16em 0 0;
    padding: 0.1em 0.16em 0.06em;
    border: 2px solid #e2b24f;
    border-radius: 7px;
    background:
      radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.28), transparent 55%),
      linear-gradient(160deg, #d8402a, #96201a);
    box-shadow: inset 0 0 0 2px rgba(120, 20, 12, 0.55), 0 2px 5px rgba(60, 30, 10, 0.35);
    color: #fbe6a6;
    font-family: var(--fairy);
    font-size: 2.5em;
    font-style: normal;
    line-height: 1;
    text-shadow: 0 1px 0 rgba(70, 10, 6, 0.7);
  }
  .narr.cap::after { content: ''; display: block; clear: both; }
  .moral { color: var(--tomato); font-weight: 600; }

  .flourish {
    display: block;
    width: 150px;
    max-width: 60%;
    height: auto;
    margin: 6px auto 12px;
    color: var(--muted);
  }
  .flourish.left { margin-left: 0; }

  .spot {
    float: right;
    width: 92px;
    height: 92px;
    margin: -6px -2px 2px 10px;
    shape-outside: circle(50%);
  }

  .opener { text-align: center; }
  .opener .narr { text-align: left; }
  .opener .narr.center { text-align: center; }
  .figure {
    display: block;
    width: clamp(104px, 30vw, 150px);
    height: auto;
    margin: 0 auto 4px;
  }
  .role { margin: 0 0 2px !important; font-weight: 600; font-size: 1.04em; }
  .period {
    margin: 0 0 4px !important;
    color: var(--muted);
    font-size: 13px;
    font-variant-numeric: lining-nums;
    letter-spacing: 0.04em;
  }
  .now {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--leaf);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    vertical-align: 1px;
  }
  .note { color: var(--muted); font-size: 14px; }

  /* lists of real content */
  .deeds {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .deeds li {
    position: relative;
    margin: 0 0 0.7em;
    padding-left: 22px;
  }
  .deeds li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0.5em;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--tomato-bright);
    box-shadow: inset -2px -2px 0 rgba(156, 36, 18, 0.45);
  }
  .deeds li::after {
    content: '';
    position: absolute;
    left: 4px;
    top: calc(0.5em - 3px);
    width: 6px;
    height: 4px;
    border-radius: 60% 60% 40% 40%;
    background: var(--leaf);
  }

  .early {
    margin: 0;
    padding: 0;
    list-style: none;
    clear: both;
  }
  .early li {
    padding: 10px 0 2px;
    border-top: 1px dashed var(--rule);
  }
  .early h3 {
    margin: 0 0 4px;
    font-family: ${TEXT};
    font-size: 1.02em;
    font-weight: 600;
    line-height: 1.3;
  }
  .early .at { color: var(--tomato); font-weight: 600; }

  .facts-list { margin: 4px 0 0; }
  .facts-list div { padding: 8px 0; border-top: 1px dashed var(--rule); }
  .facts-list dt, .links dt {
    color: var(--tomato);
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .facts-list dd, .links dd { margin: 0; }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 6px 0 12px;
    clear: both;
  }
  .stats div {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
    padding: 12px 12px 10px;
    border: 1px solid var(--rule);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.4);
  }
  .stats dd {
    margin: 0;
    color: var(--tomato);
    font-family: ${DISPLAY};
    font-size: clamp(32px, 9vw, 44px);
    line-height: 1.05;
    font-variant-numeric: lining-nums;
  }
  .stats dt { margin-top: 4px; font-size: 14px; line-height: 1.35; }
  .stats.compact { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stats.compact div { padding: 8px 8px 7px; }
  .stats.compact dd { font-size: clamp(20px, 5.6vw, 26px); }
  .stats.compact dt { font-size: 12px; }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 6px;
    padding: 0;
    list-style: none;
  }
  .tags li {
    padding: 2px 10px;
    border: 1px solid var(--rule);
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.45);
    font-size: 13.5px;
    line-height: 1.5;
  }
  .tags .core {
    border-color: var(--tomato);
    background: var(--tomato);
    color: #fff;
    font-weight: 600;
  }

  .groups { clear: both; }
  .groups section { margin: 0 0 12px; }
  .groups h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 6px;
    font-family: ${DISPLAY};
    font-size: 17px;
    font-weight: 400;
  }
  .groups h3::after { content: ''; flex: 1; border-top: 1px dashed var(--rule); }

  .legend { color: var(--muted); font-size: 13px; clear: both; }
  .swatch {
    display: inline-block;
    width: 22px;
    height: 12px;
    margin-right: 8px;
    border-radius: 99px;
    background: var(--tomato);
    vertical-align: -1px;
  }

  /* contents */
  .toc {
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .toc button {
    display: flex;
    align-items: baseline;
    gap: 8px;
    width: 100%;
    padding: 6px 4px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .toc button:hover { background: rgba(200, 50, 26, 0.08); }
  .toc button:hover .name { color: var(--tomato); }
  .toc .num {
    flex: none;
    min-width: 2.4em;
    color: var(--tomato);
    font-family: ${DISPLAY};
    font-size: 0.95em;
  }
  .toc .name { min-width: 0; }
  .toc .dots { flex: 1 1 12px; min-width: 12px; border-bottom: 2px dotted var(--rule); transform: translateY(-4px); }
  .toc .pg { flex: none; color: var(--muted); font-variant-numeric: lining-nums tabular-nums; }
  .toc.small { margin-top: 8px; font-size: 14.5px; }
  .toc.small button { padding: 4px; }
  .toc.small .num { min-width: 1.3em; }

  /* the end */
  .links { margin: 0 0 6px; }
  .links div {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 12px;
    padding: 7px 0;
    border-top: 1px dashed var(--rule);
  }
  .links dt { flex: 0 0 84px; }
  .page a:not(.open) {
    color: var(--tomato-deep);
    font-weight: 600;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    overflow-wrap: anywhere;
  }
  .page a:not(.open):hover { color: var(--tomato); }
  .cv { text-align: center; }
  .cv p { margin-top: 12px; font-size: 14px; }

  .open {
    display: inline-block;
    padding: 10px 22px;
    border: 0;
    border-radius: 99px;
    background: var(--tomato);
    box-shadow: 0 3px 0 var(--tomato-deep);
    color: #fff;
    font: 600 15px/1.2 ${TEXT};
    letter-spacing: 0.02em;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .open:hover { transform: translateY(-1px); box-shadow: 0 4px 0 var(--tomato-deep); }
  .open:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--tomato-deep); }

  /* ───────── cover ───────── */

  .page.cover {
    --fade: #a82a15;
    padding: 12px;
    color: var(--cream);
    background:
      radial-gradient(80% 60% at 30% 12%, rgba(255, 150, 110, 0.35), transparent 65%),
      repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.045) 0 2px, transparent 2px 6px),
      linear-gradient(160deg, #c8381f, #8f2110);
  }
  .cover-frame {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 10px;
    border: 2px solid var(--gold);
    border-radius: 8px;
    outline: 1px solid rgba(233, 180, 76, 0.5);
    outline-offset: -7px;
  }
  .cover .fade::after { border-color: var(--gold); }
  .cover .scroll-in { display: flex; padding: 10px 6px 14px; }
  .cover-in {
    margin: auto;
    width: 100%;
    text-align: center;
  }
  .cover-kicker {
    margin: 0 0 8px !important;
    color: var(--gold);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .cover-title {
    margin: 0 auto 12px;
    max-width: 13em;
    font-family: ${DISPLAY};
    font-size: clamp(27px, 7.6vw, 40px);
    font-weight: 400;
    line-height: 1.1;
    text-wrap: balance;
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.22);
  }
  .medallion {
    width: clamp(132px, 27vh, 220px);
    aspect-ratio: 1;
    margin: 0 auto 12px;
    padding: 8px;
    border: 3px solid var(--gold);
    border-radius: 50%;
    background: radial-gradient(circle at 40% 30%, #fffaf0, var(--paper-2));
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), inset 0 0 0 4px rgba(233, 180, 76, 0.25);
  }
  .medallion svg { display: block; width: 100%; height: 100%; }
  .cover-about { margin: 0 0 2px !important; font-size: 13.5px; font-style: italic; opacity: 0.9; }
  .cover-name { margin: 0 !important; font-family: ${DISPLAY}; font-size: 24px; line-height: 1.2; }
  .cover-role { margin: 2px 0 14px !important; font-size: 14.5px; }
  .cover .open {
    background: var(--gold);
    box-shadow: 0 3px 0 #a8792a;
    color: #3a2418;
  }

  /* ───────── bottom bar ───────── */

  .bar {
    flex: none;
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  }
  .progress {
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 3px;
    border-radius: 3px;
    overflow: hidden;
    background: rgba(253, 241, 214, 0.16);
  }
  .progress span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--tomato-bright), var(--gold));
    transform-origin: left center;
    transition: transform 0.4s ease;
  }
  .round, .pill {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    height: 40px;
    border: 1px solid rgba(253, 241, 214, 0.35);
    border-radius: 99px;
    background: rgba(253, 241, 214, 0.06);
    color: inherit;
    font: 600 13px/1 ${TEXT};
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s ease;
  }
  .round { width: 52px; height: 44px; border-color: var(--gold); background: var(--gold); color: #2a1608; }
  .round:hover:not(:disabled) { background: #f7d98a !important; }
  .round:disabled { background: rgba(253, 241, 214, 0.06); color: inherit; border-color: rgba(253, 241, 214, 0.35); }
  .keys { opacity: 0.7; }

  /* Side arrows live beside the book on wide screens; phones use the bar. */
  .side { display: none; }
  .pill { padding: 0 14px; }
  .pill svg { color: var(--tomato-bright); }
  .round:hover:not(:disabled), .pill:hover { background: rgba(253, 241, 214, 0.16); }
  .round:disabled { opacity: 0.3; cursor: default; }
  .pill[aria-current='page'] { border-color: var(--gold); }
  .count {
    flex: 1 1 0;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 13px;
    font-style: italic;
    font-variant-numeric: lining-nums tabular-nums;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ───────── desktop: an open book ───────── */

  @media ${DESK} {
    font-size: 15.5px;

    .top { padding: 8px 22px; }
    .brand {
      position: static;
      flex: none;
      width: auto;
      height: auto;
      margin: 0;
      clip: auto;
    }
    .lang { margin-left: auto; }
    &.in-scene .top { flex-wrap: nowrap; }
    &.in-scene .top > nav { order: 0; flex: 1 1 0; }

    .stage {
      display: grid;
      place-items: center;
      margin: 14px 86px 12px;
      container-type: size;
    }

    .side {
      position: absolute;
      top: 50%;
      z-index: 3;
      display: grid;
      place-items: center;
      width: 58px;
      height: 58px;
      margin-top: -29px;
      border: 2px solid #2a1608;
      border-radius: 50%;
      background: var(--gold);
      color: #2a1608;
      box-shadow: 0 5px 0 rgba(42, 22, 8, 0.55), 0 12px 22px rgba(0, 0, 0, 0.4);
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s ease;

      svg { width: 28px; height: 28px; }
      &.prev { left: 16px; }
      &.next { right: 16px; }
      &:hover:not(:disabled) { transform: translateY(-2px) scale(1.05); background: #f7d98a; }
      &:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 2px 0 rgba(42, 22, 8, 0.55), 0 6px 12px rgba(0, 0, 0, 0.4); }
      &:disabled { opacity: 0.25; cursor: default; }
    }

    .book {
      position: relative;
      display: flex;
      width: min(100cqw, calc(100cqh * 1.46), 1240px);
      aspect-ratio: 1.46 / 1;
      perspective: 2600px;
      transition: transform 0.75s cubic-bezier(0.45, 0.05, 0.3, 1);
    }
    .book.closed { transform: translateX(-25%); }

    /* the hard cover boards under the pages */
    .book::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: -9px -11px -11px -11px;
      border-radius: 12px;
      background: linear-gradient(160deg, #b8321c, #7d1c0d);
      box-shadow: 0 26px 46px -14px rgba(0, 0, 0, 0.65), 0 4px 10px rgba(0, 0, 0, 0.35);
      transition: left 0.75s cubic-bezier(0.45, 0.05, 0.3, 1);
    }
    .book.closed::before { left: calc(50% - 2px); }

    .slot { position: relative; flex: 0 0 50%; height: 100%; }

    .page { padding: 22px 40px 12px; }
    .page.left {
      padding-right: 46px;
      border-radius: 5px 0 0 5px;
      box-shadow:
        inset -34px 0 34px -26px rgba(70, 40, 15, 0.42),
        inset -2px 0 0 rgba(70, 40, 15, 0.1),
        -2px 1px 0 #efe2c2, -4px 2px 0 #dccba6, -6px 3px 0 #efe2c2;
    }
    .page.right {
      padding-left: 46px;
      border-radius: 0 5px 5px 0;
      box-shadow:
        inset 34px 0 34px -26px rgba(70, 40, 15, 0.42),
        inset 2px 0 0 rgba(70, 40, 15, 0.1),
        2px 1px 0 #efe2c2, 4px 2px 0 #dccba6, 6px 3px 0 #efe2c2;
    }
    .page.cover {
      padding: 18px;
      border-radius: 3px 9px 9px 3px;
      box-shadow: inset 14px 0 14px -10px rgba(0, 0, 0, 0.45);
    }
    .cover-frame { padding: 14px; }

    .running { margin-bottom: 12px; }
    .page.left .running { text-align: left; }
    .page.right .running { text-align: right; }

    .title { font-size: clamp(26px, 3.4cqw, 36px); }
    .title.feat { font-size: clamp(23px, 2.7cqw, 29px); }
    .cover-title { font-size: clamp(28px, 4cqw, 44px); }
    .medallion { width: clamp(130px, 30cqh, 230px); }
    .figure { width: clamp(110px, 24cqh, 170px); }
    .spot { width: 108px; height: 108px; }
    .stats dd { font-size: clamp(34px, 4.6cqw, 50px); }
    .stats.compact dd { font-size: clamp(21px, 2.3cqw, 27px); }
    .opener { padding-top: 1.5cqh; }
    .deeds li { margin-bottom: 0.85em; }

    /* the turning leaf */
    .leaf {
      position: absolute;
      top: 0;
      z-index: 5;
      width: 50%;
      height: 100%;
      transform-style: preserve-3d;
      animation-duration: 0.75s;
      animation-timing-function: cubic-bezier(0.45, 0.05, 0.3, 1);
      animation-fill-mode: forwards;
      will-change: transform;
    }
    .leaf.fwd { left: 50%; transform-origin: left center; animation-name: ${flipForward}; }
    .leaf.back { left: 0; transform-origin: right center; animation-name: ${flipBack}; }
    .face {
      position: absolute;
      inset: 0;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    }
    .face.rear { transform: rotateY(180deg); }
    .face::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(90deg, rgba(40, 20, 5, 0.28), rgba(40, 20, 5, 0.04) 60%, transparent);
      opacity: 0;
      animation: ${shade} 0.75s ease both;
    }
    .leaf.back .face::after, .leaf.fwd .face.rear::after { transform: scaleX(-1); }
  }

  @media ${DESK} and (max-height: 620px) {
    .stage { margin: 8px 82px 8px; }
    .page { padding-top: 14px; padding-bottom: 8px; }
  }

  @media (max-width: 380px) {
    .page { padding: 12px 16px 8px; }
    .pill { padding: 0 11px; }
    .stats.compact { grid-template-columns: 1fr 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet, .leaf, .face::after { animation: none !important; }
    .book, .book::before, .progress span, .open, .fade { transition: none !important; }
  }
`;
