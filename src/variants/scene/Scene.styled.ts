import styled, { keyframes } from 'styled-components';

const flicker = keyframes`
  0%, 100% { transform: translateX(-50%) scale(1, 1) rotate(-1deg); opacity: 1; }
  25% { transform: translateX(-52%) scale(0.94, 1.06) rotate(2deg); opacity: 0.92; }
  50% { transform: translateX(-49%) scale(1.04, 0.96) rotate(-2deg); }
  75% { transform: translateX(-51%) scale(0.97, 1.04) rotate(1deg); opacity: 0.95; }
`;

const breathe = keyframes`
  0%, 100% { opacity: 0.85; }
  40% { opacity: 1; }
  70% { opacity: 0.78; }
`;

const drift = keyframes`
  0% { transform: translate(0, 0); opacity: 0; }
  15% { opacity: 0.9; }
  50% { transform: translate(18px, -26px); opacity: 0.5; }
  85% { opacity: 0.9; }
  100% { transform: translate(-10px, -52px); opacity: 0; }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.25; }
`;

const steam = keyframes`
  0% { transform: translateY(0) scaleX(1); opacity: 0; }
  30% { opacity: 0.5; }
  100% { transform: translateY(-34px) scaleX(1.6); opacity: 0; }
`;

const shimmer = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 214, 120, 0), 0 0 30px 4px rgba(255, 190, 90, 0.25); }
  50% { box-shadow: 0 0 0 6px rgba(255, 214, 120, 0.18), 0 0 46px 12px rgba(255, 190, 90, 0.45); }
`;

const pop = keyframes`
  0% { opacity: 0; transform: translate(-50%, calc(-100% - 6px)) scale(0.6); }
  7% { opacity: 1; transform: translate(-50%, calc(-100% - 18px)) scale(1.06); }
  11% { transform: translate(-50%, calc(-100% - 16px)) scale(1); }
  88% { opacity: 1; transform: translate(-50%, calc(-100% - 16px)) scale(1); }
  100% { opacity: 0; transform: translate(-50%, calc(-100% - 24px)) scale(0.96); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
`;

const blink = keyframes`
  0%, 60%, 100% { opacity: 0.2; }
  30% { opacity: 1; }
`;

const slide = keyframes`
  0% { transform: translateX(-110%); }
  100% { transform: translateX(260%); }
`;

const flash = keyframes`
  0%, 45% { opacity: 0; }
  51% { opacity: 0.55; }
  62% { opacity: 0.18; }
  100% { opacity: 0; }
`;

const tagIn = keyframes`
  from { opacity: 0; transform: translate(-50%, calc(-100% - 4px)) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, calc(-100% - 12px)) scale(1); }
`;

const envIn = keyframes`
  0% { opacity: 0; transform: translateY(60px) scale(0.5) rotate(-8deg); }
  25% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
  70% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
  100% { opacity: 0; transform: translateY(150px) scale(0.9) rotate(3deg); }
`;
const flapOpen = keyframes`
  0%, 28% { transform: rotateX(0deg); }
  55%, 100% { transform: rotateX(-180deg); }
`;
const sealPop = keyframes`
  0%, 24% { opacity: 1; transform: scale(1); }
  34%, 100% { opacity: 0; transform: scale(1.8); }
`;
const letterGlow = keyframes`
  0%, 30% { opacity: 0; transform: scale(0.4); }
  52% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.22; transform: scale(1.25); }
`;
const paperRise = keyframes`
  0%, 40% { opacity: 0; transform: translateY(70px) scale(0.45, 0.08) rotate(0deg); }
  50% { opacity: 1; }
  72% { opacity: 1; transform: translateY(-22px) scale(1.04, 1.04) rotate(-2.4deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(-1.2deg); }
`;
const dimIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: none; }
`;

export const Root = styled.div`
  --px: 0;
  --py: 0;
  --tilt: 56deg;
  /* Book size on the table, in the table's own (un-tilted) pixels. */
  --bw: clamp(200px, 21vw, 260px);
  --bh: calc(var(--bw) * 1.34);
  --cover: #7a1f2b;
  --cover-dark: #4f111a;
  --gold: #e9b44c;

  position: relative;
  height: var(--app-h, 100dvh);
  overflow: hidden;
  background: #120c14;
  color: #f6ead0;
  font-family: 'Lora', Georgia, serif;

  /* ---------- the 3D stage ---------- */
  .gl {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.8s ease;
  }
  &.mode-3d.shown .gl { opacity: 1; }
  &.mode-flat .gl { display: none; }
  /* Dims the room behind the open book. A plain overlay: filters on a WebGL canvas stutter. */
  .dim {
    position: absolute;
    inset: 0;
    background: rgba(12, 7, 14, 0.88);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }
  &.phase-reading .dim { opacity: 1; }

  /* The moment the book bursts open. Timed to the 3.6 s opening shot in the 3D stage. */
  .flash {
    position: absolute;
    inset: 0;
    background: radial-gradient(60% 55% at 50% 60%, #fffbe6 0%, rgba(255, 226, 150, 0.85) 35%, rgba(255, 190, 90, 0) 75%);
    opacity: 0;
    pointer-events: none;
  }
  &.mode-3d.phase-opening .flash { animation: ${flash} 3.6s linear both; }
  &.mode-3d.phase-opening .vignette { background: radial-gradient(90% 75% at 50% 60%, transparent 30%, rgba(4, 2, 8, 0.9) 100%); }
  .vignette { transition: background 1.2s ease; }

  /* Shown while the 3D room loads. */
  .loader {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    background: radial-gradient(60% 50% at 50% 45%, #3a1f2c, #120c14 75%);
    color: #ffe2a1;

    p { margin: 0; font: 400 clamp(20px, 5vw, 28px)/1.2 var(--fairy, 'Lora'), 'Lora', Georgia, serif; letter-spacing: 0.03em; }
  }
  .loader-hero { width: min(42vw, 170px); height: auto; animation: ${bob} 1.5s ease-in-out infinite; filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.5)); }
  .dots i { font-style: normal; animation: ${blink} 1.2s infinite; }
  .dots i:nth-child(2) { animation-delay: 0.2s; }
  .dots i:nth-child(3) { animation-delay: 0.4s; }
  .loader-bar {
    width: min(60vw, 240px);
    height: 6px;
    border: 1px solid rgba(233, 180, 76, 0.6);
    border-radius: 99px;
    overflow: hidden;
    i { display: block; width: 40%; height: 100%; border-radius: 99px; background: var(--gold); animation: ${slide} 1.3s ease-in-out infinite; }
  }

  /* A small plaque that says what you can do in the scene. */
  .help {
    position: absolute;
    left: 14px;
    bottom: calc(18px + env(safe-area-inset-bottom));
    z-index: 3;
    width: min(300px, calc(100% - 28px));
    padding: 12px 14px 12px 16px;
    border: 2px solid #2a1810;
    border-radius: 14px;
    background: linear-gradient(160deg, #fff6dc, #ecd9a8);
    color: #2a1810;
    box-shadow: 0 5px 0 rgba(42, 24, 16, 0.4), 0 14px 26px rgba(0, 0, 0, 0.4);

    /* A ruled inner border, as on an old proclamation. */
    &::before { content: ''; position: absolute; inset: 4px; border: 1px dashed rgba(122, 80, 30, 0.5); border-radius: 9px; pointer-events: none; }
    h2 { margin: 0 26px 7px 0; color: #96201a; font: 400 16px/1.2 var(--fairy, 'Lora'), 'Lora', Georgia, serif; }
    ul { margin: 0; padding: 0; list-style: none; }
    li {
      position: relative;
      padding-left: 16px;
      font: 500 13px/1.4 'Lora', Georgia, serif;
    }
    li + li { margin-top: 4px; }
    li::before { content: ''; position: absolute; left: 2px; top: 0.5em; width: 7px; height: 7px; border-radius: 50%; background: #d8402a; }
  }

  .help-x {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 50%;
    background: rgba(42, 24, 16, 0.1);
    color: inherit;
    font-size: 12px;
    cursor: pointer;
    &:hover { background: rgba(42, 24, 16, 0.22); }
  }

  .help-open {
    position: absolute;
    left: 14px;
    bottom: calc(18px + env(safe-area-inset-bottom));
    z-index: 3;
    width: 44px;
    height: 44px;
    border: 2px solid #2a1810;
    border-radius: 50%;
    background: linear-gradient(180deg, #fbe3a0, #e9b44c 55%, #c98f2e);
    color: #2a1810;
    font: 700 20px 'Lora', Georgia, serif;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 4px 0 rgba(42, 24, 16, 0.6), 0 10px 18px rgba(0, 0, 0, 0.35);
    cursor: pointer;
    &:hover { filter: brightness(1.08); }
  }

  /* Name of the thing under the pointer — the sign that it can be clicked. */
  .tag {
    position: absolute;
    z-index: 4;
    padding: 5px 11px;
    border: 1.5px solid #2a1810;
    border-radius: 99px;
    background: var(--gold);
    color: #2a1810;
    font: 700 13px/1.2 'Lora', Georgia, serif;
    white-space: nowrap;
    box-shadow: 0 3px 0 rgba(42, 24, 16, 0.45);
    transform: translate(-50%, calc(-100% - 12px));
    pointer-events: none;
    animation: ${tagIn} 0.16s ease-out both;
  }

  /* Call a visitor: owl, letter or knock. Bottom right, out of the way of the table. */
  .callers {
    position: absolute;
    right: 14px;
    bottom: calc(18px + env(safe-area-inset-bottom));
    z-index: 3;
    display: flex;
    gap: 8px;

    align-items: center;

    /* The three callers are round; the tip button beside them keeps its own shape. */
    > button:not([class]) {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      padding: 0;
      border: 2px solid #2a1810;
      border-radius: 50%;
      background: linear-gradient(180deg, #fbe3a0, #e9b44c 55%, #c98f2e);
      font-size: 21px;
      line-height: 1;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 4px 0 rgba(42, 24, 16, 0.6), 0 10px 18px rgba(0, 0, 0, 0.35);
      cursor: pointer;
      transition: transform 0.12s ease, filter 0.12s ease;
      &:hover { filter: brightness(1.08); transform: translateY(-2px); }
      &:active { transform: translateY(3px); }
    }
  }

  /* The note that greets you at the door. */
  .welcome {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: grid;
    place-items: center;
    padding: 20px;

    article {
      position: relative;
      width: min(440px, 100%);
      max-height: 100%;
      overflow-y: auto;
      padding: 18px 28px 20px;
      border: 2px solid #2a1810;
      border-radius: 16px;
      background:
        radial-gradient(90% 60% at 20% 10%, rgba(255, 255, 255, 0.55), transparent 60%),
        linear-gradient(170deg, #fff6dc, #ecd9a8);
      color: #2a1810;
      text-align: center;
      box-shadow: 0 8px 0 rgba(42, 24, 16, 0.4), 0 26px 50px rgba(0, 0, 0, 0.55);
      animation: ${fadeIn} 0.4s ease both;
    }
    article::before { content: ''; position: absolute; inset: 6px; border: 1px dashed rgba(122, 80, 30, 0.45); border-radius: 11px; pointer-events: none; }
    h2 { margin: 0 0 10px; color: #96201a; font: 400 clamp(20px, 5.4vw, 24px)/1.2 var(--fairy, 'Lora'), 'Lora', Georgia, serif; }
    p { margin: 0 0 10px; font: 500 16px/1.5 'Lora', Georgia, serif; text-wrap: pretty; }
  }
  .welcome-veil { position: absolute; inset: 0; border: 0; background: rgba(12, 7, 14, 0.6); cursor: pointer; animation: ${dimIn} 0.4s ease both; }
  .welcome-hero { display: block; width: 112px; height: auto; margin: 0 auto 2px; animation: ${bob} 2.4s ease-in-out infinite; }
  .welcome-go {
    position: relative;
    margin: 6px 0 10px;
    padding: 11px 24px 12px;
    border: 2px solid #2a1810;
    border-radius: 13px;
    background: linear-gradient(180deg, #fbe3a0, #e9b44c 55%, #c98f2e);
    color: #2a1810;
    font: 400 18px/1.1 var(--fairy, 'Lora'), 'Lora', Georgia, serif;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 4px 0 rgba(42, 24, 16, 0.6), 0 10px 18px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.12s ease, filter 0.12s ease;
    &:hover { filter: brightness(1.08); transform: translateY(-2px); }
    &:active { transform: translateY(3px); }
  }
  .welcome .welcome-note { margin: 0; color: #6c5947; font-size: 13px; font-style: italic; }

  /* A letter that blew in, lying open over the room. */
  .letter {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: grid;
    place-items: center;
    padding: 20px;

    article {
      position: relative;
      width: min(420px, 100%);
      padding: 26px 28px 22px;
      border: 2px solid #2a1810;
      border-radius: 6px 14px 8px 16px;
      background:
        radial-gradient(90% 60% at 20% 10%, rgba(255, 255, 255, 0.55), transparent 60%),
        linear-gradient(170deg, #fff6dc, #ecd9a8);
      color: #2a1810;
      box-shadow: 0 8px 0 rgba(42, 24, 16, 0.4), 0 26px 50px rgba(0, 0, 0, 0.55);
      transform: rotate(-1.2deg);
      transform-origin: 50% 70%;
      animation: ${paperRise} 1.7s cubic-bezier(0.3, 0.7, 0.3, 1) both;
    }
    article::before { content: ''; position: absolute; inset: 6px; border: 1px dashed rgba(122, 80, 30, 0.45); border-radius: 4px 10px 6px 12px; pointer-events: none; }
  }
  .letter-back { position: absolute; inset: 0; border: 0; background: rgba(12, 7, 14, 0.62); cursor: pointer; animation: ${dimIn} 0.5s ease both; }
  .letter-glow {
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(760px, 130vw);
    aspect-ratio: 1;
    margin: calc(min(760px, 130vw) / -2) 0 0 calc(min(760px, 130vw) / -2);
    background: radial-gradient(closest-side, rgba(255, 244, 200, 0.85), rgba(255, 205, 110, 0.4) 40%, rgba(255, 190, 90, 0) 72%);
    pointer-events: none;
    animation: ${letterGlow} 1.7s ease-out both;
  }
  .env {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 280px;
    height: 180px;
    margin: -60px 0 0 -140px;
    border: 2px solid #2a1810;
    border-radius: 6px;
    background:
      linear-gradient(to top right, transparent 49.4%, rgba(122, 80, 30, 0.5) 49.6% 50.4%, transparent 50.6%),
      linear-gradient(to top left, transparent 49.4%, rgba(122, 80, 30, 0.5) 49.6% 50.4%, transparent 50.6%),
      linear-gradient(170deg, #fff6dc, #e6d09c);
    box-shadow: 0 8px 0 rgba(42, 24, 16, 0.4), 0 22px 40px rgba(0, 0, 0, 0.5);
    perspective: 700px;
    pointer-events: none;
    animation: ${envIn} 1.5s ease both;
  }
  .flap {
    position: absolute;
    inset: -2px -2px auto -2px;
    height: 62%;
    background: linear-gradient(180deg, #f3e2b4, #dcc48c);
    clip-path: polygon(0 0, 100% 0, 50% 100%);
    transform-origin: 50% 0;
    animation: ${flapOpen} 1.5s ease both;
  }
  .seal {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 34px;
    height: 34px;
    margin: -17px 0 0 -17px;
    border: 2px solid #5a0c08;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #e8473a, #96201a);
    animation: ${sealPop} 1.5s ease both;
  }
  .letter-text { margin: 0 0 14px; font: italic 500 18px/1.5 'Lora', Georgia, serif; text-wrap: pretty; }
  .letter-from { margin: 0 0 18px; color: #96201a; font: 400 16px/1.3 var(--fairy, 'Lora'), 'Lora', Georgia, serif; text-align: right; }
  .letter-ok {
    display: block;
    margin: 0 auto;
    padding: 9px 18px 10px;
    border: 2px solid #2a1810;
    border-radius: 11px;
    background: linear-gradient(180deg, #fbe3a0, #e9b44c 55%, #c98f2e);
    color: #2a1810;
    font: 600 14px/1.2 'Lora', Georgia, serif;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 3px 0 rgba(42, 24, 16, 0.6);
    cursor: pointer;
    &:hover { filter: brightness(1.08); }
  }

  /* What the props say when you poke them. */
  .bubble {
    position: absolute;
    z-index: 4;
    max-width: min(280px, calc(100% - 24px));
    padding: 10px 14px 11px;
    border: 2px solid #2a1810;
    border-radius: 18px;
    background: #fff6dc;
    color: #2a1810;
    font: italic 500 15px/1.35 'Lora', Georgia, serif;
    text-align: center;
    text-wrap: balance;
    box-shadow: 0 6px 0 rgba(42, 24, 16, 0.35), 0 14px 26px rgba(0, 0, 0, 0.35);
    transform: translate(-50%, calc(-100% - 16px));
    transform-origin: 50% 100%;
    animation: ${pop} 2.9s ease both;
    pointer-events: none;
    &.long { animation-duration: 6s; }

    &::after {
      content: '';
      position: absolute;
      left: calc(50% + var(--tail, 0px));
      bottom: -9px;
      width: 14px;
      height: 14px;
      border-right: 2px solid #2a1810;
      border-bottom: 2px solid #2a1810;
      background: #fff6dc;
      transform: translateX(-50%) rotate(45deg);
    }
  }

  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(120% 95% at 50% 55%, transparent 50%, rgba(20, 8, 12, 0.6) 100%);
    pointer-events: none;
  }

  /* Paper tooth over the whole picture, so it reads as paint on paper rather than a render. */
  .paper {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='320' height='320' filter='url(%23n)'/%3E%3C/svg%3E");
    mix-blend-mode: soft-light;
    opacity: 0.6;
    pointer-events: none;
  }
  &.mode-flat .paper, &:not(.shown) .paper { display: none; }

  .hero-src { position: absolute; width: 0; height: 0; overflow: hidden; visibility: hidden; }

  /* ---------- flat fallback: the room behind the table ---------- */
  .room, .desk {
    position: absolute;
    inset: 0;
    transition: transform 0.9s cubic-bezier(0.5, 0, 0.2, 1), filter 0.9s ease, opacity 0.9s ease;
  }

  .room {
    inset: -3%;
    background:
      radial-gradient(60% 50% at 62% 58%, rgba(255, 170, 80, 0.2), transparent 70%),
      linear-gradient(to bottom, #1a1326 0%, #2a1a2c 45%, #3a2127 62%, #1a0f10 100%);
    transform: translate(calc(var(--px) * -10px), calc(var(--py) * -6px));
  }

  .wall { position: absolute; inset: 0 0 50% 0; }

  .window {
    position: absolute;
    left: clamp(16px, 12%, 180px);
    top: 14%;
    width: clamp(110px, 17vw, 210px);
    aspect-ratio: 3 / 4;
    border: 10px solid #2c1a14;
    border-bottom-width: 16px;
    border-radius: 999px 999px 6px 6px;
    background: linear-gradient(to bottom, #0b1436 0%, #1c2a63 60%, #3b3f86 100%);
    box-shadow: 0 0 60px 10px rgba(80, 110, 220, 0.18), inset 0 0 30px rgba(0, 0, 0, 0.5);
    overflow: hidden;

    /* Glazing bars. */
    &::before, &::after { content: ''; position: absolute; background: #2c1a14; }
    &::before { left: calc(50% - 3px); top: 0; bottom: 0; width: 6px; }
    &::after { top: 58%; left: 0; right: 0; height: 6px; }

    i {
      position: absolute;
      border-radius: 50%;
      background: #fff8dc;
      animation: ${twinkle} 3.2s ease-in-out infinite;
    }
  }

  .moon {
    position: absolute;
    right: 14%;
    top: 12%;
    width: 30%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fffbe6, #f3d98a 70%);
    box-shadow: 0 0 26px 8px rgba(255, 236, 170, 0.45);
  }

  .shelf {
    position: absolute;
    right: clamp(12px, 9%, 150px);
    top: 30%;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    padding: 0 10px;
    border-bottom: 8px solid #2c1a14;
    opacity: 0.9;

    span { display: block; width: 14px; border-radius: 2px 2px 0 0; }
    span:nth-child(1) { height: 58px; background: #5b2a3a; }
    span:nth-child(2) { height: 70px; width: 18px; background: #2f4a3a; }
    span:nth-child(3) { height: 50px; background: #6a4a22; }
    span:nth-child(4) { height: 66px; width: 12px; background: #2a3558; }
    span:nth-child(5) { height: 60px; width: 20px; background: #7a2f22; transform: rotate(8deg); transform-origin: bottom left; margin-left: 4px; }
    span:nth-child(6) { height: 44px; background: #4a3a5a; margin-left: 12px; }
  }

  /* Candle light filling the room. */
  .glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(42% 40% at 68% 56%, rgba(255, 176, 84, 0.34), rgba(255, 140, 60, 0.1) 45%, transparent 72%);
    animation: ${breathe} 3.6s ease-in-out infinite;
    pointer-events: none;
  }

  .fly {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #ffe9a8;
    box-shadow: 0 0 8px 3px rgba(255, 220, 130, 0.7);
    animation: ${drift} 7s ease-in-out infinite;
    pointer-events: none;
  }

  /* ---------- the table, seen from where you sit ---------- */
  .desk {
    perspective: 1000px;
    perspective-origin: 50% 18%;
    transform: translate(calc(var(--px) * -22px), calc(var(--py) * -10px));
    pointer-events: none;
  }

  .table {
    position: absolute;
    left: -60%;
    right: -60%;
    top: 42%;
    height: 1500px;
    transform-origin: 50% 0;
    transform: rotateX(var(--tilt));
    transform-style: preserve-3d;
    background:
      repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.28) 0 2px, transparent 2px 210px),
      repeating-linear-gradient(91deg, rgba(255, 255, 255, 0.035) 0 2px, transparent 2px 9px, rgba(0, 0, 0, 0.05) 9px 11px, transparent 11px 23px),
      linear-gradient(to bottom, #3b2014 0%, #6a3c20 26%, #7b4826 60%, #5a3219 100%);
    box-shadow: inset 0 22px 30px -10px rgba(0, 0, 0, 0.75);
  }

  /* Pool of candle light on the wood. */
  .light {
    position: absolute;
    left: 50%;
    top: 0;
    width: 1100px;
    height: 900px;
    margin-left: -470px;
    background: radial-gradient(closest-side, rgba(255, 190, 100, 0.42), rgba(255, 160, 70, 0.14) 55%, transparent);
    animation: ${breathe} 3.6s ease-in-out infinite;
  }

  /* Upright things stand on the tilted plane by tilting back the same amount. */
  .candle, .mug {
    position: absolute;
    left: 50%;
    transform-origin: 50% 100%;
    transform: rotateX(calc(var(--tilt) * -1));
    transform-style: preserve-3d;
  }

  .candle {
    top: 40px;
    width: 60px;
    height: 150px;
    margin-left: calc(var(--bw) * 0.5 + 70px);

    .wax {
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 6px;
      height: 96px;
      border-radius: 5px 5px 3px 3px;
      background: linear-gradient(90deg, #d8c9a4, #fff4d6 45%, #cdbb90);
      box-shadow: inset 0 14px 14px -6px rgba(255, 200, 120, 0.9);
    }
    .dish {
      position: absolute;
      left: -8px;
      right: -8px;
      bottom: 0;
      height: 14px;
      border-radius: 50%;
      background: linear-gradient(#b98a3a, #6f4d17);
      box-shadow: 0 6px 10px rgba(0, 0, 0, 0.5);
    }
    .wick { position: absolute; left: 50%; bottom: 100px; width: 2px; height: 9px; margin-left: -1px; background: #2a1a12; }
    .flame {
      position: absolute;
      left: 50%;
      bottom: 104px;
      width: 20px;
      height: 40px;
      border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
      background: radial-gradient(ellipse at 50% 78%, #fffbe0 0 22%, #ffd75e 45%, #ff8a2a 78%, rgba(255, 110, 30, 0) 100%);
      box-shadow: 0 0 30px 12px rgba(255, 170, 70, 0.55), 0 0 90px 40px rgba(255, 150, 60, 0.25);
      transform-origin: 50% 100%;
      animation: ${flicker} 1.7s ease-in-out infinite;
    }
  }

  .mug {
    top: 150px;
    width: 64px;
    height: 70px;
    margin-left: calc(var(--bw) * -0.5 - 150px);

    .cup {
      position: absolute;
      inset: 14px 6px 0 0;
      border-radius: 4px 4px 14px 14px;
      background: linear-gradient(90deg, #a8321f, #e25a3c 45%, #8f2716);
      box-shadow: 0 8px 10px rgba(0, 0, 0, 0.45);
    }
    .cup::after {
      content: '';
      position: absolute;
      right: -15px;
      top: 9px;
      width: 15px;
      height: 26px;
      border: 5px solid #a8321f;
      border-left: 0;
      border-radius: 0 12px 12px 0;
    }
    .steam {
      position: absolute;
      left: 16px;
      top: 0;
      width: 8px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      filter: blur(4px);
      animation: ${steam} 3.4s ease-out infinite;
    }
    .steam + .steam { left: 32px; animation-delay: 1.6s; }
  }

  /* ---------- the book ---------- */
  .book {
    position: absolute;
    left: 50%;
    top: 26px;
    width: var(--bw);
    height: var(--bh);
    margin-left: calc(var(--bw) * -0.5);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    pointer-events: auto;
    transform-style: preserve-3d;
    transform: rotateZ(-7deg);
    transition: transform 0.35s ease;
    outline: none;

    > span { position: absolute; inset: 0; display: block; transform-style: preserve-3d; }

    &:disabled { cursor: default; }
    &:not(:disabled):hover, &:not(:disabled):focus-visible { transform: rotateZ(-5deg) translateZ(14px); }
    &:focus-visible .front { outline: 3px solid #fff3c4; outline-offset: 4px; }
  }

  .shade {
    inset: 6px -10px -14px 8px !important;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.55);
    filter: blur(14px);
    transform: translateZ(1px);
  }

  .halo { border-radius: 9px; transform: translateZ(1px); animation: ${shimmer} 3s ease-in-out infinite; }

  .back { border-radius: 4px 9px 9px 4px; background: var(--cover-dark); transform: translateZ(2px); }

  .pages {
    inset: 5px 6px 5px 3px !important;
    border-radius: 2px 5px 5px 2px;
    background: repeating-linear-gradient(to bottom, #f3e6c6 0 2px, #e2d2ab 2px 3px);
    box-shadow: inset 0 0 0 1px rgba(90, 60, 20, 0.25);
  }
  .p1 { transform: translateZ(7px); }
  .p2 { transform: translateZ(13px); }
  .p3 { transform: translateZ(19px); }
  .p4 { transform: translateZ(25px); background: #f6ead0; }

  .cover {
    transform: translateZ(30px);
    transform-origin: 0 50%;
    transition: transform 0.9s cubic-bezier(0.45, 0, 0.2, 1);
  }

  .front, .inside {
    position: absolute;
    inset: 0;
    border-radius: 4px 9px 9px 4px;
    backface-visibility: hidden;
  }

  .front {
    padding: 7%;
    background:
      linear-gradient(90deg, rgba(0, 0, 0, 0.42) 0 5%, rgba(255, 255, 255, 0.1) 6% 7%, transparent 9%),
      radial-gradient(120% 90% at 70% 20%, #96283a, var(--cover) 55%, var(--cover-dark));
  }

  .inside { background: #ead9b2; transform: rotateY(180deg); }

  .frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2%;
    height: 100%;
    padding: 6% 5%;
    border: 2px solid var(--gold);
    border-radius: 6px;
    outline: 1px solid rgba(233, 180, 76, 0.55);
    outline-offset: -7px;
    color: var(--gold);
    text-align: center;
    line-height: 1.1;
  }

  .t1, .t3 { font-size: calc(var(--bw) * 0.062); font-style: italic; letter-spacing: 0.04em; }
  .t2 { font-size: calc(var(--bw) * 0.105); font-weight: 700; color: #ffe2a1; text-wrap: balance; }
  .emblem { width: 46%; height: auto; margin: 4% 0 1%; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.45)); }
  .by { font-size: calc(var(--bw) * 0.05); letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.85; }

  /* ---------- overlay controls ---------- */
  .bar {
    position: absolute;
    inset: 0 0 auto 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 14px;
    font-family: ${({ theme }) => theme.fonts.sans};
    pointer-events: none;
    > * { pointer-events: auto; }
  }

  .variants { flex: 1 1 0; min-width: 0; }

  .lang.sound { margin-left: auto; font-size: 18px; s { opacity: 0.45; } }
  .lang + .lang { margin-left: 0; }

  .lang {
    flex-shrink: 0;
    margin-left: auto;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    padding: 0;
    border: 2px solid #2a1810;
    border-radius: 50%;
    background: linear-gradient(180deg, #fbe3a0, #e9b44c 55%, #c98f2e);
    color: #2a1810;
    font: 700 13px/1 'Lora', Georgia, serif;
    letter-spacing: 0.03em;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 3px 0 rgba(42, 24, 16, 0.6), 0 8px 14px rgba(0, 0, 0, 0.35);
    cursor: pointer;
    transition: transform 0.12s ease, filter 0.12s ease;
    &:hover { filter: brightness(1.08); transform: translateY(-1px); }
    &:active { transform: translateY(2px); }
  }

  .hint {
    position: absolute;
    left: 50%;
    bottom: calc(22px + env(safe-area-inset-bottom));
    z-index: 3;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: max-content;
    max-width: calc(100% - 32px);
    text-align: center;

    button {
      padding: 12px 22px 13px;
      border: 2px solid #2a1810;
      border-radius: 14px;
      background: linear-gradient(180deg, #fbe3a0, #e9b44c 55%, #c98f2e);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), inset 0 -2px 0 rgba(120, 70, 10, 0.35), 0 4px 0 rgba(42, 22, 8, 0.6), 0 12px 20px rgba(0, 0, 0, 0.4);
      color: #2a1810;
      font: 400 19px/1.1 var(--fairy, 'Lora'), 'Lora', Georgia, serif;
      letter-spacing: 0.02em;
      text-shadow: 0 1px 0 rgba(255, 244, 200, 0.7);
      cursor: pointer;
      transition: transform 0.12s ease, filter 0.12s ease;
      &:hover { filter: brightness(1.08); transform: translateY(-2px); }
      &:active { transform: translateY(3px); }
      /* Little stars either side, like a title on a playbill. */
      &:not(.second)::before, &:not(.second)::after { content: '✦'; content: '✦' / ''; display: inline-block; margin: 0 0.6em; color: #96201a; font-size: 0.7em; vertical-align: 0.15em; text-shadow: none; }
    }

    span { font-size: 14px; font-style: italic; opacity: 0.8; text-shadow: 0 1px 6px #000; }

    .second {
      padding: 8px 16px 9px;
      border-radius: 11px;
      background: linear-gradient(160deg, #fff6dc, #ecd9a8);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 3px 0 rgba(42, 22, 8, 0.6), 0 9px 16px rgba(0, 0, 0, 0.35);
      font: 600 14px/1.2 'Lora', Georgia, serif;
      letter-spacing: 0;
      text-shadow: none;
    }
  }


  /* ---------- opening and closing ---------- */
  &.phase-opening .cover, &.phase-reading .cover { transform: translateZ(30px) rotateY(-168deg); }
  &.phase-opening .halo, &.phase-reading .halo { animation: none; }

  /* Lean in over the book. */
  &.phase-opening .desk, &.phase-reading .desk {
    transform: translateY(-14%) scale(2.1);
    filter: blur(5px) brightness(0.6);
  }
  &.phase-opening .room, &.phase-reading .room { filter: blur(6px) brightness(0.55); transform: scale(1.15); }
  &.phase-reading .desk { transition: none; }

  &.phase-closing .cover { transition-duration: 0.6s; }
  &.phase-closing .room, &.phase-closing .desk { transition-duration: 0.6s; }

  @media (max-width: 700px) {
    .bar { flex-wrap: wrap; row-gap: 2px; padding: 8px 10px; }
    .variants { order: 2; flex: 1 0 100%; }
    .lang { order: 1; }
    .hint { bottom: calc(18px + env(safe-area-inset-bottom)); }
    /* On a phone the row sits just above the buttons, across from the "?", clear of the things on the table. */
    .callers { right: 10px; bottom: calc(124px + env(safe-area-inset-bottom)); > button:not([class]) { width: 42px; height: 42px; font-size: 19px; } }
    /* On phones the plaque sits above both buttons and above the callers' row. */
    .help { left: 10px; width: min(300px, calc(100% - 20px)); bottom: calc(180px + env(safe-area-inset-bottom)); }
    /* The "?" goes up with it: beside the buttons there is no room for it on a narrow screen. */
    .help-open { left: 10px; bottom: calc(124px + env(safe-area-inset-bottom)); }
    .bubble { font-size: 14px; max-width: min(240px, calc(100% - 24px)); }

    --tilt: 52deg;
    --bw: clamp(190px, 56vw, 250px);

    .table { top: 40%; }
    .book { top: 40px; }
    .shelf { top: 22%; transform: scale(0.8); transform-origin: right top; }
    .candle { margin-left: calc(var(--bw) * 0.5 + 24px); top: 10px; transform: rotateX(calc(var(--tilt) * -1)) scale(0.85); }
    .mug { margin-left: calc(var(--bw) * -0.5 - 84px); top: 20px; transform: rotateX(calc(var(--tilt) * -1)) scale(0.8); }
  }

  /* Tablets: the plaque in the corner would reach under the buttons, so it sits above them. */
  @media (min-width: 701px) and (max-width: 940px) {
    .help { bottom: calc(124px + env(safe-area-inset-bottom)); }
  }

  /* A phone on its side: the picture is short, so the buttons shrink to leave the book in view. */
  @media (max-height: 480px) and (orientation: landscape) and (max-width: 999px) {
    .hint { bottom: calc(12px + env(safe-area-inset-bottom)); gap: 6px; }
    .hint button { padding: 8px 18px 9px; font-size: 16px; }
    .hint .second { padding: 6px 12px 7px; font-size: 13px; }
    .callers { flex-direction: row; right: 14px; bottom: calc(18px + env(safe-area-inset-bottom)); }
    .help-open { left: 14px; bottom: calc(18px + env(safe-area-inset-bottom)); }
    .help { left: 14px; width: min(300px, calc(100% - 28px)); bottom: calc(100px + env(safe-area-inset-bottom)); max-height: calc(100% - 108px - env(safe-area-inset-bottom)); overflow-y: auto; }
  }

  @media (prefers-reduced-motion: reduce) {
    .room, .desk, .cover, .book { transition: none; }
    .flame, .glow, .light, .fly, .window i, .steam, .halo, .flash, .loader-hero, .dots i, .loader-bar i, .welcome-hero { animation: none; }
    .welcome article, .welcome-veil { animation: none; }
    .letter article, .letter-back { animation: none; }
    .env, .letter-glow { display: none; }
    .bubble { animation-duration: 0.01s; animation-fill-mode: none; }
  }
`;

/** The open book, laid over the dimmed room. */
export const Reader = styled.div`
  position: absolute;
  inset: 0;
  z-index: 5;
  animation: ${fadeIn} 0.45s ease both;

  &.closing { opacity: 0; transition: opacity 0.3s ease; pointer-events: none; animation: none; }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
