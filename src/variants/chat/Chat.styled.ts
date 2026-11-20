import styled, { keyframes } from 'styled-components';
import VariantSwitcher from '../VariantSwitcher';

const rise = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: none; }
`;

const riseMine = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.94); }
  to { opacity: 1; transform: none; }
`;

const chipIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
`;

const flash = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(201, 242, 107, 0); }
  20%, 60% { box-shadow: 0 0 0 3px rgba(201, 242, 107, 0.75); }
`;

const blink = keyframes`
  0%, 60%, 100% { opacity: 0.3; transform: none; }
  30% { opacity: 1; transform: translateY(-3px); }
`;

export const Switcher = styled(VariantSwitcher)`
  font-size: 12px;
`;

export const Root = styled.div`
  --bg: #14111b;
  --panel: #1b1724;
  --raised: #262135;
  --raised-2: #2f2941;
  --line: rgba(255, 255, 255, 0.1);
  --text: #f0ebf8;
  --muted: #aaa2bd;
  --me: #ff7a59;
  --me-ink: #1e0e08;
  --lime: #c9f26b;
  --lime-ink: #151d05;
  --soft: #d7d0e4;
  --pad: 12px;

  /* Positioned, so absolutely placed helpers (screen-reader text) are clipped here and never widen the page. */
  position: relative;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  color: var(--text);
  font-family: 'Onest', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  background:
    radial-gradient(900px 520px at 12% -10%, rgba(255, 122, 89, 0.16), transparent 60%),
    radial-gradient(760px 520px at 100% 110%, rgba(201, 242, 107, 0.1), transparent 60%),
    var(--bg);

  *, *::before, *::after { box-sizing: border-box; }
  h1, h3, h4, p, ul, ol, dl, dd, dt { margin: 0; }
  ul, ol { padding: 0; list-style: none; }
  button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  a { color: inherit; text-decoration: none; }

  :focus-visible {
    outline: 2px solid var(--lime);
    outline-offset: 2px;
  }

  .visually-hidden {
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

  /* ---------- layout ---------- */

  .frame {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    height: 100%;
  }

  .side { display: none; }

  .chat {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    background: var(--panel);
  }

  /* ---------- header ---------- */

  .head {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'who lang' 'switch switch';
    align-items: center;
    gap: 4px 12px;
    padding: calc(10px + env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) 4px max(14px, env(safe-area-inset-left));
    border-bottom: 1px solid var(--line);
    background: var(--panel);
  }

  .who {
    grid-area: who;
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }

  .avatar {
    position: relative;
    flex: none;
    width: 42px;
    height: 42px;

    img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 14px;
      object-fit: cover;
      background: var(--raised);
    }

    i {
      position: absolute;
      right: -1px;
      bottom: -1px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--lime);
      box-shadow: 0 0 0 3px var(--panel);
    }
  }

  .who-text {
    min-width: 0;

    h1 {
      overflow: hidden;
      font-family: 'Unbounded', 'Onest', sans-serif;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.01em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    p {
      overflow: hidden;
      color: var(--muted);
      font-size: 12.5px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    p.is-typing { color: var(--lime); }

    /* the green dot already says "online" where there is no room for the word */
    @media (max-width: 419px) {
      .on { display: none; }
    }
  }

  .lang {
    grid-area: lang;
    display: flex;
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: 12px;

    button {
      min-width: 38px;
      min-height: 32px;
      padding: 5px 8px;
      border: 0;
      border-radius: 9px;
      background: none;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      transition: background 0.15s ease, color 0.15s ease;

      &:hover { color: var(--text); }
      &[aria-pressed='true'] { background: var(--lime); color: var(--lime-ink); }
    }
  }

  .switch {
    grid-area: switch;
    justify-self: start;
    min-width: 0;
    margin-left: -8px;
    color: var(--text);
  }

  /* ---------- message list ---------- */

  .stage {
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .list {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 14px max(var(--pad), env(safe-area-inset-right)) 14px max(var(--pad), env(safe-area-inset-left));
    scrollbar-width: thin;
    scrollbar-color: var(--raised-2) transparent;
    background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 22px 22px;

    &:focus-visible { outline-offset: -2px; }
  }

  /* Like in any messenger, a short conversation sits at the bottom, next to the questions. */
  .thread {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    margin-top: auto;
  }

  .intro {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 8px 0 4px;
    text-align: center;

    img {
      width: 76px;
      height: 76px;
      margin-bottom: 10px;
      border-radius: 26px;
      object-fit: cover;
      background: var(--raised);
      box-shadow: 0 0 0 1px var(--line), 0 14px 30px rgba(0, 0, 0, 0.35);
    }

    .intro-name {
      font-family: 'Unbounded', 'Onest', sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .intro-role { color: var(--muted); font-size: 13.5px; }
  }

  .day {
    display: flex;
    justify-content: center;
    margin: 12px 0 4px;

    span {
      padding: 3px 11px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--muted);
      font-size: 11.5px;
      font-weight: 600;
    }
  }

  .msg {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    transform-origin: 0 100%;
    animation: ${rise} 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both;

    &.first { margin-top: 12px; }

    &.me {
      justify-content: flex-end;
      transform-origin: 100% 100%;
      animation-name: ${riseMine};
    }
  }

  .mini {
    display: none;
    flex: none;
    width: 30px;
    height: 30px;

    img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 10px;
      object-fit: cover;
    }
  }

  .body {
    min-width: 0;
    max-width: 86%;
  }

  .msg.wide .body {
    flex: 1;
    max-width: 100%;
  }

  .bubble {
    padding: 9px 14px;
    border-radius: 6px 18px 18px 6px;
    background: var(--raised);
    overflow-wrap: anywhere;
  }

  .msg.them.first .bubble { border-top-left-radius: 18px; }
  .msg.them.last .bubble { border-bottom-left-radius: 18px; }

  .msg.me .bubble {
    border-radius: 18px 6px 6px 18px;
    background: var(--me);
    color: var(--me-ink);
    font-weight: 500;
  }

  .msg.me.first .bubble { border-top-right-radius: 18px; }
  .msg.flash .bubble { animation: ${flash} 1.4s ease; }

  .meta {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
    padding: 0 4px;
    color: var(--muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .msg.me .meta { justify-content: flex-end; }

  .ticks {
    transition: color 0.2s ease;
    &.read { color: var(--lime); }
  }

  .accent { color: var(--lime); font-weight: 600; }

  .typing {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    animation: ${rise} 0.2s ease both;

    &.first { margin-top: 12px; }
  }

  .dots {
    display: inline-flex;
    gap: 5px;
    padding: 14px 15px;
    border-radius: 6px 18px 18px 18px;
    background: var(--raised);

    i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--muted);
      animation: ${blink} 1.1s infinite;
    }

    i:nth-child(2) { animation-delay: 0.15s; }
    i:nth-child(3) { animation-delay: 0.3s; }
  }

  .typing.first .dots { border-top-left-radius: 18px; }

  .latest {
    position: absolute;
    right: max(14px, env(safe-area-inset-right));
    bottom: 12px;
    z-index: 3;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--raised-2);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
    transition: opacity 0.18s ease, transform 0.18s ease, border-color 0.15s ease;

    &:hover { border-color: var(--lime); }

    &[data-show='false'] {
      opacity: 0;
      transform: translateY(8px) scale(0.9);
      pointer-events: none;
    }
  }

  /* ---------- rich replies ---------- */

  .facts-list {
    display: grid;
    gap: 10px;

    dt {
      color: var(--muted);
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  }

  .job, .card, .project {
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--raised);
  }

  .badge {
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--lime);
    color: var(--lime-ink);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    line-height: 1.35;
    text-transform: uppercase;
  }

  .chev {
    flex: none;
    transition: transform 0.2s ease;
  }

  [aria-expanded='true'] > .chev { transform: rotate(180deg); }

  .note { color: var(--muted); font-size: 13.5px; }

  .items {
    display: grid;
    gap: 8px;
    color: var(--soft);
    font-size: 14px;
    line-height: 1.5;

    li {
      position: relative;
      padding-left: 16px;
    }

    li::before {
      content: '';
      position: absolute;
      top: 0.62em;
      left: 2px;
      width: 6px;
      height: 6px;
      border-radius: 2px;
      background: var(--lime);
    }
  }

  .job {
    max-width: 560px;
    padding: 14px 16px;

    &.current { border-color: rgba(201, 242, 107, 0.45); }

    .job-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 12.5px;
      font-variant-numeric: tabular-nums;
    }

    h3 {
      margin-top: 6px;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.3;
    }

    .company { color: var(--me); font-weight: 600; }
    .note { margin-top: 4px; }

    .items {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed var(--line);
    }

    .more {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 36px;
      margin-top: 12px;
      padding: 6px 10px 6px 14px;
      border: 1px solid var(--line);
      border-radius: 99px;
      background: none;
      font-size: 13px;
      font-weight: 600;
      transition: border-color 0.15s ease, background 0.15s ease;

      &:hover { border-color: var(--lime); }
      &[aria-expanded='true'] { background: var(--raised-2); }
    }
  }

  /* The career as one compact card: a rail with a row per job. */
  .path {
    max-width: 560px;
    padding: 6px;

    > ol > li {
      position: relative;
    }

    /* the rail */
    > ol > li::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 16px;
      width: 2px;
      background: var(--raised-2);
    }

    > ol > li:first-child::before { top: 22px; }
    > ol > li:last-child::before { bottom: auto; height: 22px; }
    > ol > li:first-child:last-child::before { display: none; }

    > ol > li.late { animation: ${rise} 0.3s ease both; }
  }

  .path-head {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 10px;
    width: 100%;
    padding: 10px 10px 10px 36px;
    border: 0;
    border-radius: 13px;
    background: none;
    text-align: left;
    transition: background 0.15s ease;

    &:hover, &[aria-expanded='true'] { background: rgba(255, 255, 255, 0.045); }

    /* the dot on the rail */
    &::before {
      content: '';
      position: absolute;
      top: 17px;
      left: 7px;
      width: 8px;
      height: 8px;
      border: 3px solid var(--raised);
      border-radius: 50%;
      background: #6f6887;
      box-sizing: content-box;
    }

    > * { grid-column: 1; }

    .period {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 8px;
      color: var(--muted);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      line-height: 1.5;
    }

    strong {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.3;
    }

    .company {
      color: var(--me);
      font-size: 13.5px;
      font-weight: 600;
      line-height: 1.4;
    }

    .chev {
      grid-column: 2;
      grid-row: 1 / span 3;
      color: var(--muted);
    }
  }

  .path .current .path-head::before {
    background: var(--lime);
    box-shadow: 0 0 0 3px rgba(201, 242, 107, 0.22);
  }

  .path-body {
    display: grid;
    gap: 10px;
    padding: 6px 12px 14px 36px;
    animation: ${rise} 0.24s ease both;
  }

  .path-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 42px;
    margin-top: 4px;
    padding: 8px 12px;
    border: 0;
    border-top: 1px solid var(--line);
    border-radius: 0 0 13px 13px;
    background: none;
    color: var(--lime);
    font-size: 13.5px;
    font-weight: 600;

    &:hover { background: rgba(255, 255, 255, 0.045); }
  }

  /* ---------- horizontal scrollers (projects, suggestions) ---------- */

  .scroller {
    position: relative;
    min-width: 0;

    .track {
      display: flex;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .nav {
      position: absolute;
      top: 50%;
      z-index: 1;
      display: none;
      place-items: center;
      width: 34px;
      height: 34px;
      margin-top: -17px;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 50%;
      background: var(--raised-2);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
      transition: opacity 0.15s ease, border-color 0.15s ease;

      &:hover { border-color: var(--lime); }
      &:disabled { opacity: 0; pointer-events: none; }
    }

    @media (hover: hover) and (pointer: fine) {
      .nav { display: grid; }
    }
  }

  .carousel {
    /* bleeds to the edge of the list so the next card is visibly cut off */
    margin-right: calc(var(--pad) * -1);

    .track {
      gap: 10px;
      padding: 2px var(--pad) 2px 0;
      scroll-snap-type: x mandatory;
      scroll-padding-left: 0;
      border-radius: 18px 0 0 18px;
    }

    .nav.prev { left: -10px; }
    .nav.next { right: 10px; }

    .pager {
      display: flex;
      justify-content: center;
      gap: 5px;
      padding: 10px var(--pad) 2px 0;

      i {
        width: 6px;
        height: 6px;
        border-radius: 99px;
        background: rgba(255, 255, 255, 0.2);
        transition: width 0.2s ease, background 0.2s ease;
      }

      i.on { width: 18px; background: var(--lime); }
    }
  }

  .project {
    display: flex;
    flex: 0 0 min(310px, 84%);
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    scroll-snap-align: start;

    .kicker {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: var(--lime);
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .count {
      color: var(--muted);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    h3 {
      font-family: 'Unbounded', 'Onest', sans-serif;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }

    .desc { color: var(--soft); font-size: 14px; }

    .facts {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;

      div {
        padding: 8px;
        border-radius: 12px;
        background: var(--raised-2);
      }

      dt {
        font-family: 'Unbounded', 'Onest', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--me);
      }

      dd { color: var(--muted); font-size: 11.5px; line-height: 1.3; overflow-wrap: anywhere; }
    }

    .tags { margin-top: auto; padding-top: 2px; }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    li {
      padding: 3px 9px;
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 500;
    }

    li.core {
      border-color: var(--lime);
      background: var(--lime);
      color: var(--lime-ink);
      font-weight: 700;
    }
  }

  .card {
    max-width: 560px;
    padding: 16px;

    > h3 {
      font-family: 'Unbounded', 'Onest', sans-serif;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.35;
    }
  }

  .card.path { padding: 6px; }

  .skills {
    .legend {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      color: var(--muted);
      font-size: 13px;
    }

    .swatch {
      flex: none;
      width: 12px;
      height: 12px;
      border-radius: 4px;
      background: var(--lime);
    }

    .group { margin-top: 14px; }

    h4 {
      margin-bottom: 7px;
      color: var(--muted);
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  }

  .stats dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin-top: 12px;

    div {
      padding: 12px;
      border-radius: 14px;
      background: var(--raised-2);
    }

    dt {
      font-family: 'Unbounded', 'Onest', sans-serif;
      font-size: 26px;
      font-weight: 800;
      line-height: 1.1;
      color: var(--lime);
    }

    div:nth-child(even) dt { color: var(--me); }
    dd { margin-top: 4px; color: var(--soft); font-size: 13px; line-height: 1.35; }
  }

  .files, .contacts {
    display: grid;
    gap: 6px;
    max-width: 420px;
  }

  .files a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--raised);
    transition: border-color 0.15s ease;

    &:hover { border-color: var(--lime); }
    &:hover .get { background: var(--lime); color: var(--lime-ink); }
  }

  .doc {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 46px;
    border-radius: 8px 14px 8px 8px;
    background: var(--me);
    color: var(--me-ink);
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.06em;
  }

  .file-text {
    display: grid;
    flex: 1;
    min-width: 0;

    strong { font-weight: 700; }

    small {
      overflow: hidden;
      color: var(--muted);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .get {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: var(--raised-2);
    transition: background 0.15s ease, color 0.15s ease;
  }

  .contacts {
    a {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 48px;
      padding: 8px 12px 8px 14px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--raised);
      transition: border-color 0.15s ease;

      &:hover { border-color: var(--lime); }
      &:hover .go { color: var(--lime); transform: translate(1px, -1px); }
    }

    small {
      flex: none;
      width: 74px;
      color: var(--lime);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    strong { flex: 1; min-width: 0; font-weight: 600; overflow-wrap: anywhere; }
    .go { flex: none; color: var(--muted); transition: color 0.15s ease, transform 0.15s ease; }
  }

  .help {
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    button {
      min-height: 34px;
      padding: 5px 12px;
      border: 1px solid var(--line);
      border-radius: 99px;
      background: var(--raised-2);
      font-size: 13.5px;
      font-weight: 500;
      transition: border-color 0.15s ease;

      &:hover { border-color: var(--lime); }
    }
  }

  /* ---------- topic list (side panel and the sheet on small screens) ---------- */

  .progress {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 0 6px 8px;
    color: var(--muted);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .bar {
    height: 4px;
    margin: 0 6px 10px;
    border-radius: 4px;
    background: var(--raised-2);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: 4px;
      background: var(--lime);
      transform-origin: 0 50%;
      transition: transform 0.35s ease;
    }
  }

  .topics {
    display: grid;
    gap: 2px;

    button {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 7px 6px;
      border: 0;
      border-radius: 14px;
      background: none;
      text-align: left;
      transition: background 0.15s ease;

      &:hover { background: rgba(255, 255, 255, 0.06); }
    }

    .num {
      display: grid;
      flex: none;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 11px;
      background: var(--raised-2);
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .topic-text { display: grid; min-width: 0; }
    strong { font-weight: 600; line-height: 1.3; }

    small {
      overflow: hidden;
      color: var(--muted);
      font-size: 12.5px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .done .num { background: rgba(201, 242, 107, 0.16); color: var(--lime); }
    .done strong { color: var(--soft); }
  }

  /* ---------- footer: chips + composer ---------- */

  .foot {
    position: relative;
    z-index: 5;
    border-top: 1px solid var(--line);
    background: var(--panel);
    padding-bottom: max(10px, env(safe-area-inset-bottom));
  }

  .scrim {
    position: absolute;
    inset: 0;
    z-index: 4;
    background: rgba(12, 9, 17, 0.6);
    animation: ${chipIn} 0.18s ease both;
  }

  .sheet {
    position: absolute;
    right: 10px;
    bottom: calc(100% + 8px);
    left: 10px;
    max-width: 400px;
    max-height: min(62vh, 520px);
    padding: 16px 10px 10px;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: #221d30;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
    animation: ${rise} 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    transform-origin: 0 100%;
  }

  .chips {
    .track {
      gap: 6px;
      padding: 10px max(var(--pad), env(safe-area-inset-right)) 8px max(var(--pad), env(safe-area-inset-left));
    }

    /* fading edges say "there is more this way" */
    &[data-next='true'] .track {
      -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 56px), transparent);
      mask-image: linear-gradient(to right, #000 calc(100% - 56px), transparent);
    }

    &[data-prev='true'] .track {
      -webkit-mask-image: linear-gradient(to left, #000 calc(100% - 56px), transparent);
      mask-image: linear-gradient(to left, #000 calc(100% - 56px), transparent);
    }

    &[data-prev='true'][data-next='true'] .track {
      -webkit-mask-image: linear-gradient(to right, transparent, #000 56px, #000 calc(100% - 56px), transparent);
      mask-image: linear-gradient(to right, transparent, #000 56px, #000 calc(100% - 56px), transparent);
    }

    .nav { width: 30px; height: 30px; margin-top: -14px; }
    .nav.prev { left: 8px; }
    .nav.next { right: 8px; }

    li {
      flex: none;
      animation: ${chipIn} 0.28s ease both;
    }

    li:nth-child(2) { animation-delay: 0.04s; }
    li:nth-child(3) { animation-delay: 0.08s; }
    li:nth-child(4) { animation-delay: 0.12s; }
    li:nth-child(n + 5) { animation-delay: 0.16s; }

    li button {
      min-height: 38px;
      padding: 7px 14px;
      border: 1px solid rgba(201, 242, 107, 0.5);
      border-radius: 99px;
      background: rgba(201, 242, 107, 0.08);
      max-width: min(320px, 78vw);
      overflow: hidden;
      font-size: 14px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.12s ease;

      &:active { transform: scale(0.96); background: var(--lime); color: var(--lime-ink); }
    }

    @media (hover: hover) {
      li button:hover { background: var(--lime); color: var(--lime-ink); border-color: var(--lime); }
    }
  }

  .composer {
    display: flex;
    gap: 8px;
    padding: 0 max(var(--pad), env(safe-area-inset-right)) 0 max(var(--pad), env(safe-area-inset-left));

    input {
      flex: 1;
      min-width: 0;
      height: 46px;
      padding: 0 16px;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--bg);
      color: var(--text);
      font: inherit;
      font-size: 16px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &::placeholder { color: #8f879f; opacity: 1; }

      &:focus, &:focus-visible {
        outline: none;
        border-color: rgba(201, 242, 107, 0.7);
        box-shadow: 0 0 0 3px rgba(201, 242, 107, 0.14);
      }
    }

    .menu {
      position: relative;
      display: grid;
      flex: none;
      place-items: center;
      width: 46px;
      height: 46px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: none;
      color: var(--soft);
      font-size: 11px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;

      .ring {
        position: absolute;
        inset: 5px;
        transform: rotate(-90deg);

        circle {
          fill: none;
          stroke: var(--raised-2);
          stroke-width: 2.5;
        }

        .value {
          stroke: var(--lime);
          stroke-linecap: round;
          transition: stroke-dasharray 0.35s ease;
        }
      }

      &:hover, &[aria-expanded='true'] { color: var(--lime); }
    }

    .send {
      display: grid;
      flex: none;
      place-items: center;
      width: 46px;
      height: 46px;
      padding: 0;
      border: 0;
      border-radius: 16px;
      background: var(--me);
      color: var(--me-ink);
      transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;

      &:disabled { background: var(--raised-2); color: #7b7490; cursor: default; }
      &:not(:disabled):hover { transform: translateY(-1px); }
      &:not(:disabled):active { transform: scale(0.94); }
    }
  }

  /* ---------- wider screens ---------- */

  @media (min-width: 560px) {
    --pad: 20px;

    .mini { display: block; }
    .body { max-width: 78%; }
    .msg.wide .body { max-width: calc(100% - 38px); }
    .list { padding-top: 18px; padding-bottom: 16px; }
    .head { padding: 14px 20px 6px; }
    .foot { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
    .who-text h1 { font-size: 15px; }
    .sheet { left: 20px; right: auto; width: 360px; }
    .chips .nav.prev { left: 12px; }
    .chips .nav.next { right: 12px; }
  }

  @media (min-width: 760px) {
    .frame {
      grid-template-columns: minmax(0, 820px);
      justify-content: center;
      padding: 20px;
    }

    .chat {
      border: 1px solid var(--line);
      border-radius: 26px;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
    }
  }

  @media (min-width: 1100px) {
    .frame {
      grid-template-columns: 300px minmax(0, 820px);
      gap: 16px;
    }

    .intro, .scrim, .sheet, .composer .menu { display: none; }
    .day { margin-top: 0; }

    .side {
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 22px 16px 16px;
      overflow-y: auto;
      border: 1px solid var(--line);
      border-radius: 26px;
      background: var(--panel);
      scrollbar-width: thin;
      scrollbar-color: var(--raised-2) transparent;
    }

    .portrait {
      flex: none;
      width: 72px;
      height: 72px;
      margin: 0 6px;
      border-radius: 22px;
      object-fit: cover;
      background: var(--raised);
    }

    .side-name {
      margin: 14px 6px 0;
      font-family: 'Unbounded', 'Onest', sans-serif;
      font-size: 17px;
      font-weight: 700;
      line-height: 1.25;
    }

    .side-role { margin: 4px 6px 0; color: var(--muted); font-size: 13.5px; }

    .pill {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      gap: 7px;
      margin: 12px 6px 22px;
      padding: 4px 11px 4px 9px;
      border: 1px solid rgba(201, 242, 107, 0.35);
      border-radius: 99px;
      color: var(--lime);
      font-size: 12.5px;
      font-weight: 600;

      i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--lime);
      }
    }

    .side-cv {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
      margin: auto 6px 0;
      padding: 8px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      font-size: 13.5px;
      font-weight: 600;
      transition: border-color 0.15s ease, background 0.15s ease;

      &:hover { border-color: var(--lime); background: rgba(201, 242, 107, 0.08); }
    }

    .topics { margin-bottom: 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`;
