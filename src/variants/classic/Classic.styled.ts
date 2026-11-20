import styled, { createGlobalStyle } from 'styled-components';
import VariantSwitcher from '../VariantSwitcher';

const SERIF = "'Source Serif 4', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif";
const SANS = "'Onest', system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Below this the sheet goes edge-to-edge and the two columns collapse. Screen only: an A4 page is ~690px wide. */
const PHONE = 'screen and (max-width: 760px)';

/**
 * The app shell locks the document to one viewport (`height: 100%`, `overflow: hidden`),
 * which would cut a printout after the first page — undo it for print only.
 */
export const PrintReset = createGlobalStyle`
  @page {
    size: A4;
    margin: 10mm 12mm 10mm;
  }

  @media print {
    html, body, #root {
      position: static !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      background: #fff !important;
      color: #000 !important;
    }
  }
`;

export const Switcher = styled(VariantSwitcher)`
  font-size: 13px;

  button { padding: 6px 10px; }
`;

export const Root = styled.div`
  --paper: #ffffff;
  --desk: #eceae5;
  --ink: #1b1a18;
  --body: #33312d;
  --muted: #615e57;
  --faint: #8b877f;
  --rule: #dcd8d0;
  --accent: #8a2f23;
  --label: 10.5rem;
  --gap: 2rem;

  position: relative;
  height: var(--app-h, 100dvh);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-padding-top: 72px;
  background: var(--desk);
  color: var(--ink);
  color-scheme: light;
  font-family: ${SANS};
  hyphens: manual;
  text-align: left;

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 2px;
  }

  ::selection { background: #f0ddd6; color: var(--ink); }

  .ico {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* ───────── toolbar ───────── */

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 16px;
    padding: 8px 20px;
    background: rgba(236, 234, 229, 0.94);
    border-bottom: 1px solid var(--rule);
    color: var(--ink);
    font-size: 13px;
    line-height: 1;

    @supports (backdrop-filter: blur(8px)) {
      background: rgba(236, 234, 229, 0.8);
      backdrop-filter: blur(8px);
    }
  }

  .toolbar > nav { min-width: 0; }

  .tools {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }

  .lang {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--rule);
    border-radius: 7px;
    background: var(--paper);

    button {
      padding: 6px 8px;
      border: 0;
      border-radius: 4px;
      background: none;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.04em;
      line-height: 1;
      cursor: pointer;
      transition: color 0.15s ease, background-color 0.15s ease;
    }
    button:hover { color: var(--ink); background: #f3f1ec; }
    button[aria-pressed='true'] { background: var(--ink); color: #fff; cursor: default; }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid var(--rule);
    border-radius: 7px;
    background: var(--paper);
    color: var(--ink);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }
  .btn:hover { border-color: #a9a498; }
  .btn:active { background: #f3f1ec; }
  .btn.primary { background: var(--ink); border-color: var(--ink); color: #fff; }
  .btn.primary:hover { background: #3a3733; border-color: #3a3733; }
  .btn.primary:active { background: #000; }
  .btn .short { display: none; }

  .dl { display: inline-flex; position: relative; }
  .dl > .btn.primary { border-radius: 7px 0 0 7px; }

  .more { position: static; display: flex; }
  .more > summary {
    list-style: none;
    padding: 0 8px;
    border-radius: 0 7px 7px 0;
    border-left-color: rgba(255, 255, 255, 0.22);
  }
  .more > summary::-webkit-details-marker { display: none; }
  .more .chev { transition: transform 0.15s ease; }
  .more[open] > summary { background: #000; }
  .more[open] .chev { transform: rotate(180deg); }

  .menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 20;
    min-width: 220px;
    padding: 6px;
    border: 1px solid var(--rule);
    border-radius: 9px;
    background: var(--paper);
    box-shadow: 0 1px 2px rgba(27, 26, 24, 0.06), 0 12px 28px -8px rgba(27, 26, 24, 0.22);

    p {
      padding: 7px 9px 6px;
      color: var(--muted);
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.1em;
      line-height: 1.3;
      text-transform: uppercase;
    }
    a {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding: 9px;
      border-radius: 5px;
      color: var(--ink);
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.3;
      text-decoration: none;
      white-space: nowrap;
    }
    a span { color: var(--faint); font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em; }
    a:hover, a:focus-visible { background: #f3f1ec; }
    a:hover span { color: var(--accent); }
  }

  /* ───────── page layout ───────── */

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 920px) minmax(0, 1fr);
    align-items: start;
    padding: 36px 24px 88px;
  }

  .toc {
    display: none;
    grid-column: 1;
    justify-self: end;
    position: sticky;
    top: 84px;
    margin-right: 32px;
    font-size: 12.5px;

    ol { list-style: none; border-left: 1px solid var(--rule); }
    a {
      display: block;
      padding: 5px 0 5px 14px;
      margin-left: -1px;
      border-left: 1px solid transparent;
      color: var(--muted);
      line-height: 1.3;
      text-decoration: none;
      transition: color 0.15s ease, border-color 0.15s ease;
    }
    a:hover { color: var(--ink); }
    a[aria-current] { color: var(--ink); font-weight: 600; border-left-color: var(--accent); }
  }
  @media screen and (min-width: 1300px) {
    .toc { display: block; }
  }

  .paper {
    grid-column: 2;
    min-width: 0;
    padding: 4.5rem 4.5rem 4rem;
    background: var(--paper);
    border: 1px solid #e2dfd8;
    border-radius: 2px;
    box-shadow: 0 1px 2px rgba(27, 26, 24, 0.04), 0 12px 40px -18px rgba(27, 26, 24, 0.18);
    color: var(--body);
    font-size: 15.5px;
    line-height: 1.6;
  }

  @media screen and (prefers-reduced-motion: no-preference) {
    .paper { animation: classic-rise 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
    .toc { animation: classic-fade 0.6s ease 0.25s both; }
    @keyframes classic-rise {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes classic-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  }

  .paper a {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: #c9c4b9;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.22em;
    transition: text-decoration-color 0.15s ease, color 0.15s ease;
  }
  .paper a:hover { color: var(--accent); text-decoration-color: currentColor; }

  .nohyph { hyphens: none; }

  /* ───────── header ───────── */

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    padding-bottom: 2.4rem;
  }
  .head-text { min-width: 0; }

  h1 {
    color: var(--ink);
    font-family: ${SERIF};
    font-size: 3.25em;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.05;
    text-wrap: balance;
  }
  h1:focus { outline: none; }

  .tagline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5em 0.9em;
    margin-top: 0.85em;
  }

  .role {
    color: var(--ink);
    font-size: 1.14em;
    font-weight: 500;
    line-height: 1.3;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.6em;
    padding: 0.42em 0.85em 0.42em 0.75em;
    border: 1px solid #e6cfc8;
    border-radius: 99px;
    background: #fbf4f1;
    color: var(--accent);
    font-size: 0.7em;
    font-weight: 700;
    letter-spacing: 0.1em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .status::before {
    content: '';
    width: 0.55em;
    height: 0.55em;
    border-radius: 50%;
    background: currentColor;
  }

  .contacts {
    display: grid;
    grid-template-rows: repeat(2, auto);
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    gap: 0.3em 3em;
    margin-top: 1.5em;
    list-style: none;
    font-size: 0.92em;

    li { display: flex; gap: 0.6em; align-items: baseline; min-width: 0; }
    .k {
      flex: 0 0 6.6em;
      color: var(--muted);
      font-size: 0.76em;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    a { color: var(--ink); white-space: nowrap; }
  }

  .photo {
    flex-shrink: 0;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    object-fit: cover;
    filter: saturate(0.9);
    box-shadow: 0 0 0 1px var(--rule), 0 0 0 5px var(--paper), 0 0 0 6px var(--rule);
  }

  /* ───────── sections ───────── */

  section {
    padding: 2rem 0;
    border-top: 1px solid var(--rule);
  }
  section:first-of-type { border-top-color: var(--ink); }
  section:last-of-type { padding-bottom: 0; }

  h2 {
    color: var(--accent);
    font-family: ${SANS};
    font-size: 0.74em;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1.5;
    text-transform: uppercase;
  }

  /* Label column + content column. Sized in rem so rows with different font sizes still line up. */
  .split, .row {
    display: grid;
    grid-template-columns: var(--label) minmax(0, 1fr);
    column-gap: var(--gap);
    align-items: baseline;
  }
  .split > h2 { padding-top: 0.35em; }

  .stacked > h2 { margin-bottom: 1.6rem; }

  .lead p {
    color: var(--ink);
    font-family: ${SERIF};
    font-size: 1.16em;
    line-height: 1.55;
    text-wrap: pretty;
  }
  .lead p + p { margin-top: 0.7em; }

  /* ───────── numbers ───────── */

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem 1.5rem;

    div { display: flex; flex-direction: column; gap: 0.35em; }
    dd {
      order: -1;
      color: var(--ink);
      font-family: ${SERIF};
      font-size: 2.1em;
      font-weight: 600;
      letter-spacing: -0.01em;
      line-height: 1;
      font-variant-numeric: lining-nums;
    }
    dt { color: var(--muted); font-size: 0.84em; line-height: 1.35; text-wrap: balance; }
  }
  #classic-numbers > h2 { align-self: start; padding-top: 0.75em; }

  /* ───────── experience ───────── */

  .job + .job { margin-top: 2rem; }

  .period {
    color: var(--muted);
    font-size: 0.84em;
    font-variant-numeric: tabular-nums;
    line-height: 1.5;
    white-space: nowrap;
  }
  .now {
    display: block;
    width: fit-content;
    margin-top: 0.35em;
    color: var(--accent);
    font-size: 0.82em;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .now::before {
    content: '';
    display: inline-block;
    width: 0.5em;
    height: 0.5em;
    margin-right: 0.5em;
    border-radius: 50%;
    background: currentColor;
    vertical-align: 0.08em;
  }

  h3 {
    color: var(--ink);
    font-family: ${SERIF};
    font-size: 1.28em;
    font-weight: 600;
    letter-spacing: -0.005em;
    line-height: 1.3;
    text-wrap: balance;
  }
  .company {
    color: var(--ink);
    font-size: 0.95em;
    font-weight: 600;
    line-height: 1.45;
  }
  .note {
    margin-top: 0.1em;
    color: var(--muted);
    font-family: ${SERIF};
    font-size: 0.98em;
    font-style: italic;
    line-height: 1.45;
  }

  .items {
    margin-top: 0.7em;
    list-style: none;

    li {
      position: relative;
      padding-left: 1.2em;
      text-wrap: pretty;
    }
    li + li { margin-top: 0.4em; }
    li::before {
      content: '';
      position: absolute;
      left: 0.1em;
      top: 0.78em;
      width: 0.45em;
      /* A border, not a background: browsers drop backgrounds when printing. */
      border-top: 1px solid var(--faint);
    }
  }

  .early-title {
    margin: 2.2rem 0 1.1rem;
    padding-top: 1.4rem;
    border-top: 1px dotted #c9c4b9;
  }
  .early-title span {
    grid-column: 2;
    color: var(--muted);
    font-size: 0.74em;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1.5;
    text-transform: uppercase;
  }

  .job.compact + .job.compact { margin-top: 0.95rem; }
  .job.compact .job-head { line-height: 1.45; }
  .job.compact .role-name {
    color: var(--ink);
    font-family: ${SERIF};
    font-size: 1.08em;
    font-weight: 600;
  }
  .job.compact .company { font-weight: 500; }
  .job.compact .company::before { content: '·'; margin: 0 0.45em; color: var(--faint); }
  .job.compact .one { margin-top: 0.1em; color: var(--body); font-size: 0.95em; text-wrap: pretty; }

  /* ───────── projects ───────── */

  .project + .project { margin-top: 1.8rem; }

  .kicker {
    color: var(--muted);
    font-size: 0.72em;
    font-weight: 700;
    letter-spacing: 0.12em;
    line-height: 1.6;
    text-transform: uppercase;
  }
  .project h3 { font-size: 1.18em; }
  /* A rubber stamp slapped across a project that is not public yet. */
  .stamp {
    float: right;
    margin: 0 0 6px 14px !important;
    padding: 5px 12px 6px;
    border: 3px double #b3261c;
    border-radius: 6px;
    color: #b3261c;
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    line-height: 1.15;
    text-align: center;
    text-transform: uppercase;
    transform: rotate(-7deg);
    opacity: 0.88;
    /* Ink that did not take evenly. */
    -webkit-mask-image: radial-gradient(circle at 30% 40%, #000 60%, rgba(0, 0, 0, 0.55) 100%), repeating-linear-gradient(33deg, #000 0 5px, rgba(0, 0, 0, 0.7) 5px 6px);
    mask-image: radial-gradient(circle at 30% 40%, #000 60%, rgba(0, 0, 0, 0.55) 100%), repeating-linear-gradient(33deg, #000 0 5px, rgba(0, 0, 0, 0.7) 5px 6px);
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
  }
  .stamp b { display: block; font-size: 14px; font-weight: 800; letter-spacing: 0.12em; }
  .stamp span { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; }
  /* Narrow phones: beside the heading the stamp leaves it one word per line, so it gets a line of its own. */
  @media screen and (max-width: 560px) {
    .stamp { float: none; width: fit-content; margin: -6px 0 8px auto !important; }
  }

  .project .desc { margin-top: 0.35em; text-wrap: pretty; }

  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3em 1.8em;
    margin-top: 0.7em;
    padding: 0.55em 0 0.5em;
    border-top: 1px solid #ece9e3;
    border-bottom: 1px solid #ece9e3;
    font-size: 0.87em;
    line-height: 1.4;

    div { display: flex; align-items: baseline; gap: 0.45em; }
    dd {
      order: -1;
      color: var(--ink);
      font-family: ${SERIF};
      font-size: 1.22em;
      font-weight: 600;
      font-variant-numeric: lining-nums;
      white-space: nowrap;
    }
    dt { color: var(--muted); }
  }

  .tech {
    margin-top: 0.6em;
    color: var(--muted);
    font-size: 0.84em;
    line-height: 1.5;

    .k {
      margin-right: 0.7em;
      color: var(--faint);
      font-size: 0.84em;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
  }

  /* ───────── skills ───────── */

  .skills .row { padding: 0.5em 0; border-top: 1px solid #ece9e3; }
  .skills .row:first-child { border-top: 0; padding-top: 0; }
  .skills dt { color: var(--ink); font-size: 0.87em; font-weight: 600; line-height: 1.6; }
  .skills dd { color: var(--muted); font-size: 0.95em; line-height: 1.6; }
  .skills .tag { white-space: nowrap; }
  .skills .core { color: var(--ink); font-weight: 600; }
  .legend { margin-top: 0.7rem; }
  .legend span {
    grid-column: 2;
    color: var(--faint);
    font-family: ${SERIF};
    font-size: 0.9em;
    font-style: italic;
  }

  /* ───────── education & contact ───────── */

  .facts-list .row + .row { margin-top: 0.55em; }
  .facts-list dt { color: var(--ink); font-size: 0.87em; font-weight: 600; line-height: 1.6; }

  .contact-block > p:first-child { color: var(--ink); text-wrap: pretty; }
  .contact-line {
    display: grid;
    grid-template-columns: repeat(2, max-content);
    gap: 0.25em 2em;
    margin-top: 0.7em;
    list-style: none;
    a { color: var(--ink); font-weight: 500; white-space: nowrap; }
  }
  .versions {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.3em 1.4em;
    margin-top: 1.3em;
    padding-top: 1.1em;
    border-top: 1px solid #ece9e3;
    color: var(--muted);
    font-size: 0.87em;

    > a { color: var(--ink); font-weight: 600; }
    .alt a { margin-left: 0.7em; }
  }

  .toolbar-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  @media (max-width: 560px) { .toolbar-name { display: none; } }

  section:focus, section:focus-visible { outline: none; }

  /* ───────── back to top ───────── */

  .top {
    position: absolute;
    right: 24px;
    bottom: 24px;
    z-index: 9;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--rule);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 6px 18px -8px rgba(27, 26, 24, 0.3);
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  .top[hidden] { display: none; }
  .top:hover { border-color: var(--ink); color: var(--accent); }
  .top .ico { width: 16px; height: 16px; }

  /* ───────── narrower screens ───────── */

  /* Short button labels before the toolbar gets cramped. */
  @media screen and (max-width: 1100px) {
    .btn .long { display: none; }
    .btn .short { display: inline; }
  }

  @media screen and (max-width: 1000px) {
    --label: 8.6rem;
    --gap: 1.5rem;

    .layout { padding: 24px 16px 72px; }
    .paper { padding: 3.2rem 3rem 3rem; }
  }

  @media screen and (max-width: 860px) {
    .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  /* ───────── phones ───────── */

  @media ${PHONE} {
    --gap: 0;

    .toolbar { gap: 6px; padding: 6px 12px 8px; }
    .toolbar > nav { flex: 1 1 100%; }
    .tools { flex: 1 1 100%; margin-left: 0; }
    .tools .dl { margin-left: auto; }

    .layout { display: block; padding: 0; }

    .paper {
      padding: 28px 20px 72px;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      font-size: 15px;
    }

    .head { align-items: flex-start; gap: 16px; padding-bottom: 1.8rem; }
    h1 { font-size: 2.2em; }
    .photo { width: 4.6rem; height: 4.6rem; box-shadow: 0 0 0 1px var(--rule); }
    .tagline { margin-top: 0.7em; }
    .role { flex-basis: 100%; }
    /* The photo only sits beside the name; the contacts use the full width below it. */
    .contacts { display: flex; flex-direction: column; gap: 0.35em; }
    .contacts .k { flex-basis: 7.2em; }

    section { padding: 1.7rem 0; }
    .split, .row { display: block; }
    .split > h2 { padding-top: 0; margin-bottom: 0.9rem; }
    #classic-numbers > h2 { padding-top: 0; }
    .stacked > h2 { margin-bottom: 1.2rem; }
    .lead p { font-size: 1.1em; }
    .stats dd { font-size: 1.9em; }

    .job + .job { margin-top: 1.8rem; }
    .job .period, .project .kicker { margin-bottom: 0.3em; }
    .now { display: inline; margin: 0 0 0 0.9em; }
    .early-title span, .legend span { display: block; }
    .skills dt { margin-bottom: 0.05em; }
    .skills .row { padding: 0.6em 0; }
    .facts-list dt { margin-bottom: 0.05em; }
    .facts-list .row + .row { margin-top: 0.8em; }
    .facts { flex-direction: column; gap: 0.15em; }

    .top { right: 14px; bottom: 14px; }
  }

  /* Bigger targets for a thumb. */
  @media screen and (pointer: coarse) {
    .lang button { padding: 9px 11px; }
    .btn { min-height: 36px; }
  }

  @media screen and (max-width: 380px) {
    .paper { padding-left: 16px; padding-right: 16px; }
    .toolbar { padding-left: 8px; padding-right: 8px; }
    .btn { padding-left: 10px; padding-right: 10px; }
  }

  /* ───────── print ───────── */

  @media print {
    --ink: #000;
    --body: #161616;
    --muted: #444;
    --faint: #666;
    --rule: #b9b9b9;
    --accent: #000;
    --label: 8.4em;
    --gap: 1.2em;

    display: block;
    height: auto !important;
    overflow: visible !important;
    background: #fff;
    color: #000;

    .toolbar, .toc, .top, .screen-only { display: none !important; }

    .layout { display: block; padding: 0; }

    .paper {
      max-width: none;
      padding: 0;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      background: #fff;
      font-size: 8.3pt;
      line-height: 1.34;
      animation: none;
    }

    .paper a { color: #000; text-decoration: none; }

    /* header: name, role + status on one line, contacts on one line */
    .head { align-items: center; gap: 1.5em; padding-bottom: 0.8em; }
    h1 { font-size: 2.35em; }
    .tagline { gap: 0 0.8em; margin-top: 0.35em; }
    .role { font-size: 1.1em; }
    .status { padding: 0; border: 0; background: none; font-size: 0.74em; }
    .contacts {
      display: flex;
      flex-wrap: wrap;
      gap: 0 1.5em;
      margin-top: 0.55em;
      font-size: 0.96em;
    }
    .contacts .k { flex: none; }
    .photo { width: 5em; height: 5em; filter: none; box-shadow: none; }

    section { padding: 0.62em 0; border-top-width: 0.6pt; }
    .stacked > h2 { margin-bottom: 0.55em; }
    .split > h2 { padding-top: 0.2em; }
    #classic-numbers > h2 { align-self: baseline; padding-top: 0; }

    .lead p { font-size: 1.04em; line-height: 1.38; }
    .lead p + p { margin-top: 0.3em; }

    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0 1.4em;
      div { flex-direction: row; align-items: baseline; gap: 0.35em; }
      dd { font-size: 1.25em; line-height: 1.2; }
      dt { font-size: 0.9em; text-wrap: nowrap; }
    }

    /*
     * Experience and projects drop the label column on paper: role and company share a line,
     * the dates (or the project kind) sit at its right end, and the text runs the full width.
     */
    .job.row, .project.row { display: block; }
    .period, .kicker { float: right; margin-left: 1.5em; }
    .job + .job { margin-top: 0.62em; }
    .job-head { display: block; }
    h3 { display: inline; font-size: 1.16em; line-height: 1.25; }
    .company { display: inline; }
    .company::before { content: '·'; margin: 0 0.5em; color: var(--faint); font-weight: 400; }
    .note { margin-top: 0; font-size: 0.96em; line-height: 1.3; }
    .period { color: var(--ink); font-size: 0.92em; line-height: 1.6; }
    .now { display: none; }
    .items { margin-top: 0.2em; }
    .items li { padding-left: 1em; }
    .items li + li { margin-top: 0.1em; }
    .items li::before { top: 0.66em; }

    .early-title { display: block; margin: 0.6em 0 0.25em; padding-top: 0.5em; }
    .job.compact + .job.compact { margin-top: 0.15em; }
    .job.compact .job-head { display: inline; }
    .job.compact .role-name { font-size: 1.02em; }
    .job.compact .period { line-height: inherit; }
    .job.compact .one { display: inline; margin: 0; font-size: 1em; }
    .job.compact .one::before { content: ' — '; color: var(--faint); }

    /* projects */
    .project + .project { margin-top: 0.6em; }
    .project h3 { font-size: 1.08em; }
    .project .desc { margin-top: 0.05em; }
    .project h3 { display: block; }
    .kicker { padding-top: 0.45em; font-size: 0.7em; line-height: 1.3; }
    .facts {
      display: inline;
      margin: 0;
      padding: 0;
      border: 0;
      font-size: 0.94em;
      div { display: inline-flex; gap: 0.35em; margin-right: 1.3em; }
      dd { font-size: 1.05em; }
    }
    .tech { margin-top: 0; font-size: 0.94em; }
    .facts + .tech { display: inline; }

    /* skills */
    .skills .row { padding: 0; border: 0; }
    .skills .row + .row { margin-top: 0.08em; }
    .skills dt { font-size: 0.94em; line-height: inherit; }
    .skills dd { font-size: 1em; line-height: inherit; }
    .legend { display: none; }

    .facts-list .row + .row { margin-top: 0.08em; }
    .facts-list dt { font-size: 0.94em; line-height: inherit; }

    /* The header already carries the contacts; keep only the availability line. */
    .contact-line { display: none; }
    #classic-contact { display: block; }
    #classic-contact > h2 { float: left; margin-right: 1.4em; padding-top: 0.2em; }

    h2, h3, .job-head, .note, .period, .kicker, .early-title {
      break-after: avoid;
      page-break-after: avoid;
    }
    .project, .head, .stats, .job.compact, .skills, .facts-list, .contact-block, .items li, .lead p {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    /* A long job may continue on the next page between bullets, but never right after its heading. */
    .items li:first-child { break-before: avoid; page-break-before: avoid; }
    section:last-of-type { break-before: avoid; page-break-before: avoid; }
    p, li { orphans: 3; widows: 3; }
  }
`;
