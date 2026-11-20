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
  height: 100dvh;
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
  &.mode-3d .gl { opacity: 1; }
  &.mode-flat .gl { display: none; }
  /* Dims the room behind the open book. A plain overlay: filters on a WebGL canvas stutter. */
  .dim {
    position: absolute;
    inset: 0;
    background: rgba(12, 7, 14, 0.78);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }
  &.phase-reading .dim { opacity: 1; }

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
  &.mode-flat .paper, &.mode-loading .paper { display: none; }

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
    background: linear-gradient(to bottom, rgba(18, 12, 20, 0.85), transparent);
  }

  .variants { flex: 1 1 0; min-width: 0; }

  .lang {
    flex-shrink: 0;
    padding: 7px 12px;
    border: 1px solid rgba(246, 234, 208, 0.3);
    border-radius: 99px;
    background: rgba(18, 12, 20, 0.5);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    &:hover { border-color: currentColor; }
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
      padding: 12px 24px;
      border: 1px solid var(--gold);
      border-radius: 99px;
      background: rgba(30, 16, 14, 0.8);
      color: #ffe2a1;
      font: 400 18px var(--fairy, 'Lora'), 'Lora', Georgia, serif;
      letter-spacing: 0.02em;
      cursor: pointer;
      backdrop-filter: blur(4px);
      &:hover { background: var(--gold); color: #2a1608; }
    }

    span { font-size: 14px; font-style: italic; opacity: 0.8; text-shadow: 0 1px 6px #000; }
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
    .lang { order: 1; margin-left: auto; }
    .hint span { font-size: 13px; }
    .bubble { font-size: 14px; max-width: min(240px, calc(100% - 24px)); }

    --tilt: 52deg;
    --bw: clamp(190px, 56vw, 250px);

    .table { top: 40%; }
    .book { top: 40px; }
    .shelf { top: 22%; transform: scale(0.8); transform-origin: right top; }
    .candle { margin-left: calc(var(--bw) * 0.5 + 24px); top: 10px; transform: rotateX(calc(var(--tilt) * -1)) scale(0.85); }
    .mug { margin-left: calc(var(--bw) * -0.5 - 84px); top: 20px; transform: rotateX(calc(var(--tilt) * -1)) scale(0.8); }
  }

  @media (prefers-reduced-motion: reduce) {
    .room, .desk, .cover, .book { transition: none; }
    .flame, .glow, .light, .fly, .window i, .steam, .halo { animation: none; }
    .bubble { animation-duration: 0.01s; animation-fill-mode: none; }
  }
`;

/** The open book, laid over the dimmed room. */
export const Reader = styled.div`
  position: fixed;
  inset: 0;
  z-index: 5;
  animation: ${fadeIn} 0.45s ease both;

  &.closing { opacity: 0; transition: opacity 0.3s ease; pointer-events: none; animation: none; }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
