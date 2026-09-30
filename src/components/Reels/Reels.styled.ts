import styled, { keyframes } from 'styled-components';

const marquee = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const pop = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.3) rotate(-12deg); opacity: 0; }
  25% { transform: translate(-50%, -50%) scale(1.15) rotate(-8deg); opacity: 1; }
  45% { transform: translate(-50%, -50%) scale(0.95) rotate(-8deg); }
  100% { transform: translate(-50%, -110%) scale(1) rotate(-8deg); opacity: 0; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(61, 220, 132, 0.6); }
  50% { box-shadow: 0 0 0 6px rgba(61, 220, 132, 0); }
`;

const tint = (pct: number) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;

export const Layout = styled.div`
  --top: 64px;
  --rail: 70px;

  height: 100dvh;
  display: grid;
  grid-template-columns: 1fr;

  /* ---------- desktop sidebar ---------- */
  .side { display: none; }

  /* ---------- phone frame ---------- */
  .phone {
    position: relative;
    height: 100dvh;
    width: 100%;
    background: var(--bg);
    color: var(--fg);
  }

  /* Overlay controls: colours are set per element from the reel beneath it (see Reels.tsx). */
  [data-probe] { color: var(--fg); }

  .progress {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 10;
    background: ${tint(18)};

    i {
      display: block;
      height: 100%;
      background: currentColor;
      transform-origin: left;
      transition: transform 0.35s ease;
    }
  }

  .tabs {
    position: absolute;
    top: 3px;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    gap: 20px;
    padding: 14px 96px 12px 20px;
    overflow-x: auto;
    scrollbar-width: none;
    mask-image: linear-gradient(to right, #000 calc(100% - 120px), transparent calc(100% - 96px));
    &::-webkit-scrollbar { display: none; }

    button {
      position: relative;
      flex-shrink: 0;
      padding: 4px 0;
      background: none;
      border: 0;
      font-size: 15px;
      font-weight: 600;
      opacity: 0.55;
      cursor: pointer;
      transition: opacity 0.2s ease;

      &.on { opacity: 1; }
      &.on::after {
        content: '';
        position: absolute;
        left: 20%;
        right: 20%;
        bottom: -3px;
        height: 2.5px;
        border-radius: 2px;
        background: currentColor;
      }
    }
  }

  .feed {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  /* ---------- a single reel ---------- */
  .reel {
    position: relative;
    height: 100%;
    overflow: hidden;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    padding: var(--top) 20px 46px;
    background: var(--bg);
    color: var(--fg);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .deco {
    position: absolute;
    top: 9%;
    right: -6cqi;
    z-index: 0;
    font-family: ${({ theme }) => theme.fonts.display};
    font-weight: 900;
    font-size: 64cqi;
    line-height: 0.8;
    letter-spacing: -0.05em;
    white-space: nowrap;
    opacity: 0.08;
    pointer-events: none;
  }

  .stage {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    /* "safe" keeps the top visible (and scrollable) when content is taller than the screen. */
    justify-content: safe center;
    align-items: flex-start;
    gap: 14px;
    padding-right: var(--rail);
    /* Fallback for very short screens: scroll inside the reel instead of clipping. */
    overflow-y: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  .stage-end { justify-content: safe flex-end; }

  .giant {
    font-family: ${({ theme }) => theme.fonts.display};
    font-weight: 800;
    font-size: clamp(34px, 12.5cqi, 72px);
    line-height: 0.98;
    letter-spacing: -0.035em;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  .reel-intro .giant { font-size: clamp(30px, 9.6cqi, 64px); }

  .title {
    font-family: ${({ theme }) => theme.fonts.display};
    font-weight: 700;
    font-size: clamp(26px, 8cqi, 42px);
    line-height: 1.08;
    letter-spacing: -0.025em;
    text-wrap: balance;
    hyphens: auto;
    overflow-wrap: break-word;

    &.big { font-size: clamp(28px, 9cqi, 48px); }
  }

  .subtitle {
    font-size: 19px;
    font-weight: 600;
    line-height: 1.3;
  }

  .lead {
    font-size: 18px;
    line-height: 1.5;
    max-width: 36ch;
  }

  .note {
    font-size: 14px;
    line-height: 1.45;
    opacity: 0.75;
  }

  .period {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .now {
    margin-right: 10px;
    padding: 3px 10px;
    border-radius: 99px;
    background: var(--fg);
    color: var(--bg);
    font-weight: 700;
  }

  .chip {
    padding: 5px 12px;
    border: 1.5px solid currentColor;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 600;
  }

  /* ---------- intro ---------- */
  .reel-intro::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, transparent 18%),
      linear-gradient(to bottom, transparent 30%, rgba(0, 0, 0, 0.72) 52%, rgba(0, 0, 0, 0.92) 70%, rgba(0, 0, 0, 0.96) 100%);
  }

  /* Text over the photo gets a soft shadow so it stays legible on light patches. */
  .reel-intro .stage, .reel-intro .caption { text-shadow: 0 1px 12px rgba(0, 0, 0, 0.55); }

  .bg-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 22%;
    z-index: 0;
    transform: scale(1.06);
    transition: transform 6s ease-out;
  }

  .reel-intro.active .bg-photo { transform: scale(1); }
  .reel-intro .stage, .reel-intro .caption, .reel-intro .swipe { z-index: 2; }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);
    font-size: 14px;
    font-weight: 600;

    i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3ddc84;
      animation: ${pulse} 2s ease-in-out infinite;
    }
  }

  /* Primary call to action: always the brightest thing on the screen. */
  .cv-big {
    position: relative;
    z-index: 3;
    display: block;
    margin: 14px var(--rail) 0 0;
    padding: 15px 20px;
    border-radius: 16px;
    background: #d4f36b;
    color: #11140a;
    font-size: 17px;
    font-weight: 700;
    text-align: center;
    text-decoration: none;
    text-shadow: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    transition: transform 0.15s ease, filter 0.15s ease;

    &:hover { filter: brightness(1.05); }
    &:active { transform: scale(0.97); }
  }

  /* Always-visible CV button on phones, inverted against the current reel. */
  .cv-pill {
    position: absolute;
    top: 13px;
    right: 12px;
    z-index: 11;
    padding: 7px 14px;
    border-radius: 99px;
    background: var(--fg);
    color: var(--bg);
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  }

  .swipe {
    position: relative;
    align-self: center;
    margin-top: 12px;
    padding-right: var(--rail);
    font-size: 13px;
    font-weight: 600;
    opacity: 0.85;
    animation: ${bob} 1.6s ease-in-out infinite;
  }

  /* ---------- caption ---------- */
  /*
   * With a caption, stage and caption form one block centred on the screen.
   * The caption shrinks only when the block is taller than the screen, so text
   * is clipped (with a "more" sheet) only when it truly doesn't fit.
   */
  .reel:not(.reel-intro):has(.caption) {
    justify-content: safe center;

    .stage { flex: 0 0 auto; justify-content: flex-start; }
  }

  .caption {
    position: relative;
    z-index: 3;
    flex: 0 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-top: 24px;
    padding-right: var(--rail);
  }

  .reel-intro .stage { flex: 1 1 auto; justify-content: safe flex-end; }
  .reel-intro .caption { flex: 0 0 auto; }

  .handle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;

    img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      object-fit: cover;
      object-position: 50% 20%;
      border: 1.5px solid currentColor;
    }
  }

  .caption-body {
    flex: 0 1 auto;
    margin-top: 8px;
    font-size: 16px;
    line-height: 1.5;

    p + p { margin-top: 6px; }

    min-height: 3em;
    overflow: hidden;

    &.fade { mask-image: linear-gradient(to bottom, #000 50%, transparent); }
  }

  .read-all {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    margin-top: 8px;
    padding: 8px 16px;
    border: 0;
    border-radius: 99px;
    background: var(--fg);
    color: var(--bg);
    font-size: 15px;
    font-weight: 700;
    text-shadow: none;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:active { transform: scale(0.96); }
  }

  .hashtags { font-weight: 700; }

  .bullets {
    list-style: none;

    li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 8px;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.6em;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
    }
  }

  .facts {
    margin-top: 10px;

    div + div { margin-top: 8px; }
    dt { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; }
    dd { font-size: 15px; }
  }

  /* ---------- stats ---------- */
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 26px 18px;
    width: 100%;
    margin-top: 10px;

    dt {
      font-family: ${({ theme }) => theme.fonts.display};
      font-weight: 800;
      font-size: clamp(48px, 17cqi, 92px);
      line-height: 0.9;
      letter-spacing: -0.04em;
    }

    dd {
      margin-top: 8px;
      font-size: 15px;
      font-weight: 500;
      line-height: 1.35;
      max-width: 16ch;
    }

    &.compact {
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      dt { font-size: clamp(28px, 9.5cqi, 52px); }
      dd { font-size: 13px; }
    }
  }

  /* ---------- early career ---------- */
  .timeline {
    list-style: none;
    width: 100%;

    li {
      display: grid;
      gap: 2px;
      padding: 14px 0;
      border-top: 1px solid ${tint(22)};
    }

    .period { font-size: 13px; opacity: 0.7; }
    strong { font-family: ${({ theme }) => theme.fonts.display}; font-size: 20px; font-weight: 700; }
    .role { font-size: 15px; font-weight: 600; }
    .what { font-size: 15px; opacity: 0.8; line-height: 1.45; }
  }

  /* ---------- stack ---------- */
  .reel-stack .stage { justify-content: flex-start; padding-top: 8px; gap: 10px; }

  .stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .group-title {
    display: block;
    margin-bottom: 4px;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .pill {
    padding: 2px 9px;
    border: 1.5px solid ${tint(35)};
    border-radius: 99px;
    font-size: 13.5px;
    font-weight: 500;

    &.core {
      background: var(--fg);
      border-color: var(--fg);
      color: var(--bg);
      font-weight: 600;
    }
  }

  .legend { font-size: 13px; opacity: 0.8; margin-top: -4px; }

  /* ---------- contact ---------- */
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;
  }

  .btn {
    padding: 14px 20px;
    border: 2px solid currentColor;
    border-radius: 99px;
    font-size: 16px;
    font-weight: 700;
    text-decoration: none;
    transition: transform 0.15s ease;

    &:active { transform: scale(0.96); }
    &.solid { background: var(--fg); color: var(--bg); border-color: var(--fg); }
  }

  .links {
    list-style: none;
    width: 100%;
    margin-top: 6px;

    a {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      padding: 11px 0;
      border-bottom: 1px solid ${tint(22)};
      text-decoration: none;
    }

    .lbl { font-size: 14px; opacity: 0.7; }
    .val { font-size: 16px; font-weight: 600; overflow-wrap: anywhere; text-align: right; }
  }

  /* ---------- details sheet ---------- */
  .feed.locked { overflow: hidden; }

  .sheet-layer {
    position: absolute;
    inset: 0;
    z-index: 30;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
    visibility: hidden;
    transition: visibility 0s 0.3s;

    &.open { pointer-events: auto; visibility: visible; transition-delay: 0s; }
  }

  .sheet-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .sheet-layer.open .sheet-backdrop { opacity: 1; }

  .sheet {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    max-height: 88%;
    border-radius: 22px 22px 0 0;
    background: #fbf8f2;
    color: #17140f;
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.3);
    transform: translateY(105%);
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .sheet-layer.open .sheet { transform: translateY(0); }

  .sheet-head {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 22px 16px 14px 20px;
    border-bottom: 1px solid rgba(23, 20, 15, 0.1);
    touch-action: none;
  }

  .grabber {
    position: absolute;
    top: 8px;
    left: 50%;
    width: 40px;
    height: 5px;
    margin-left: -20px;
    border-radius: 3px;
    background: rgba(23, 20, 15, 0.2);
  }

  .sheet-titles {
    flex: 1;
    min-width: 0;

    strong {
      display: block;
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 20px;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    span {
      display: block;
      margin-top: 4px;
      font-size: 14px;
      color: rgba(23, 20, 15, 0.65);
    }
  }

  .sheet-close {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-top: -6px;
    border: 0;
    border-radius: 50%;
    background: rgba(23, 20, 15, 0.08);
    color: #17140f;
    cursor: pointer;

    &:hover { background: rgba(23, 20, 15, 0.14); }
  }

  .sheet-body {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 18px 20px calc(28px + env(safe-area-inset-bottom));
    font-size: 16.5px;
    line-height: 1.6;
    user-select: text;

    p + p, p + ul, ul + p, .stats + p { margin-top: 12px; }
    .note { margin-bottom: 12px; opacity: 1; color: rgba(23, 20, 15, 0.7); }
    .bullets li { margin-bottom: 12px; }
    .bullets li::before { background: #ff5b36; }
    .facts { margin-top: 16px; }
    .stats.compact { margin: 0 0 8px; }
  }

  /* ---------- sound line ---------- */
  .sound {
    position: absolute;
    left: 20px;
    right: calc(var(--rail) + 20px);
    bottom: 14px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.85;

    .marquee {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      mask-image: linear-gradient(to right, #000 88%, transparent);

      span {
        display: inline-block;
        padding-right: 8px;
        animation: ${marquee} 16s linear infinite;
        animation-play-state: paused;
      }
    }
  }

  .reel.active .sound .marquee span { animation-play-state: running; }

  /* ---------- entrance animation ---------- */
  .anim {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.45s ease, transform 0.45s ease;
  }

  .reel.active .anim { opacity: 1; transform: none; }
  .reel.active .anim:nth-child(2) { transition-delay: 0.06s; }
  .reel.active .anim:nth-child(3) { transition-delay: 0.12s; }
  .reel.active .anim:nth-child(4) { transition-delay: 0.18s; }
  .reel.active .anim:nth-child(n + 5) { transition-delay: 0.24s; }

  .burst {
    position: absolute;
    z-index: 6;
    color: #ff3b5c;
    pointer-events: none;
    animation: ${pop} 0.9s ease-out forwards;

    svg { width: 110px; height: 110px; filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25)); }
  }

  /* ---------- action rail ---------- */
  .rail {
    position: absolute;
    right: 8px;
    bottom: 58px;
    z-index: 8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--fg);
  }

  .avatar {
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;

    img {
      display: block;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      object-fit: cover;
      object-position: 50% 20%;
      border: 2px solid currentColor;
    }
  }

  .act {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 0;
    background: none;
    border: 0;
    text-decoration: none;
    cursor: pointer;

    &:disabled { opacity: 0.3; cursor: default; }
    &:not(:disabled):active .ico { transform: scale(0.9); }
  }

  .ico {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: ${tint(14)};
    backdrop-filter: blur(6px);
    transition: transform 0.15s ease;

    &.lang {
      font-family: ${({ theme }) => theme.fonts.display};
      font-size: 13px;
      font-weight: 800;
    }
  }

  .act:hover .ico { background: ${tint(24)}; }
  .liked .ico { color: #ff3b5c; }
  .act.cv .ico { background: var(--fg); color: var(--bg); }

  .lbl {
    font-size: 11px;
    font-weight: 600;
  }

  .steps { display: none; }

  .counter {
    font-size: 12px;
    font-weight: 700;
    opacity: 0.75;
  }

  .toast {
    position: absolute;
    left: 50%;
    bottom: 96px;
    z-index: 20;
    transform: translateX(-50%);
    padding: 10px 16px;
    border-radius: 99px;
    background: #111;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* ---------- short phones (iPhone SE and similar) ---------- */
  @media (max-height: 720px) {
    --top: 56px;

    .tabs { padding-top: 10px; button { font-size: 14px; } }
    .stage { gap: 10px; }
    .subtitle { font-size: 17px; }
    .lead { font-size: 16px; }
    .caption { margin-top: 16px; }
    .caption-body { font-size: 15px; }
    .stats { gap: 16px 14px; dt { font-size: clamp(40px, 14cqi, 80px); } }
    .stack { gap: 7px; }
    .stage .stats.compact { display: none; }
    .reel-intro .hashtags { display: none; }
    .note { font-size: 13px; }
    .giant { font-size: clamp(30px, 11cqi, 60px); }
    .pill { font-size: 12.5px; padding: 1px 8px; }
    .links a { padding: 8px 0; }
    .btn { padding: 11px 18px; font-size: 15px; }
    .rail { gap: 9px; }
    .ico { width: 42px; height: 42px; }
    .avatar img { width: 42px; height: 42px; }
    .rail .counter { display: none; }
  }

  /* Tiny phones (first-gen iPhone SE): the intro keeps only name, role and CV. */
  @media (max-height: 600px) {
    .reel-intro .caption { display: none; }
  }

  @media (max-width: 360px) {
    .links a { flex-direction: column; align-items: flex-start; gap: 0; }
    .links .val { text-align: left; }
  }

  /* ---------- desktop: TikTok-web style ---------- */
  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    --top: 34px;
    --rail: 0px;

    grid-template-columns: 1fr auto 1fr;
    align-items: center;

    .side {
      display: block;
      justify-self: end;
      width: 250px;
      margin-right: 48px;
      color: ${({ theme }) => theme.colors.text};
    }

    .me {
      display: flex;
      align-items: center;
      gap: 12px;

      img {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        object-fit: cover;
        object-position: 50% 20%;
      }

      strong { display: block; font-size: 16px; }
      span { font-size: 13px; color: ${({ theme }) => theme.colors.dim}; }
    }

    .chapters {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 28px;

      button {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 11px 14px;
        border: 0;
        border-radius: 12px;
        background: none;
        color: ${({ theme }) => theme.colors.dim};
        font-size: 15px;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;

        &:hover { color: ${({ theme }) => theme.colors.text}; }
        &.on { background: rgba(255, 255, 255, 0.08); color: ${({ theme }) => theme.colors.text}; font-weight: 600; }
        em { font-style: normal; font-size: 12px; opacity: 0.6; }
      }
    }

    .cv-big { margin: 24px 0 0; font-size: 16px; }
    .cv-pill { display: none; }
    .act.cv .ico { background: #d4f36b; color: #11140a; }
    .act.cv:hover .ico { background: #e0f78f; }

    .keys {
      margin-top: 20px;
      padding-left: 14px;
      font-size: 12px;
      color: ${({ theme }) => theme.colors.dim};
    }

    .phone {
      height: min(calc(100dvh - 40px), 940px);
      width: auto;
      aspect-ratio: 9 / 16;
      border-radius: 24px;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
    }

    .feed { border-radius: 24px; }

    .progress {
      top: 12px;
      left: 20px;
      right: 20px;
      border-radius: 3px;
      overflow: hidden;
    }

    .tabs { display: none; }

    .rail {
      right: auto;
      left: calc(100% + 20px);
      bottom: 0;
      color: ${({ theme }) => theme.colors.text};
    }

    .rail [data-probe] { color: ${({ theme }) => theme.colors.text}; }
    .ico { background: rgba(255, 255, 255, 0.08); }
    .act:hover .ico { background: rgba(255, 255, 255, 0.16); }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 6px;
    }
  }
`;
