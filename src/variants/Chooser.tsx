import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useLanguage } from '@hooks/useLanguage';
import { PHOTO_URL } from '../data/links';
import { t } from '../translations';
import { Tomato } from './tale/Tomato';
import { useFonts } from './useFonts';
import { VARIANTS, setVariant } from './variants';

const twinkle = keyframes`
  0%, 100% { opacity: 0.25; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.15); }
`;
const sway = keyframes`
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg) translateY(-3px); }
`;

const Wrap = styled.main`
  height: 100dvh;
  overflow-y: auto;
  display: grid;
  place-items: safe center;
  padding: 32px 20px;

  .box { width: min(100%, 620px); }

  .top {
    display: flex;
    align-items: center;
    gap: 14px;

    img {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      object-position: 50% 20%;
    }

    strong { display: block; font-size: 17px; }
    span { font-size: 14px; color: ${({ theme }) => theme.colors.dim}; }
  }

  .lang {
    margin-left: auto;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.colors.line};
    border-radius: 99px;
    background: none;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  h1 {
    margin: 36px 0 8px;
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: clamp(26px, 7vw, 40px);
    font-weight: 800;
    line-height: 1.1;
    text-wrap: balance;
  }

  .hint { color: ${({ theme }) => theme.colors.dim}; }

  ul {
    list-style: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 28px;
  }
  li { display: grid; }

  .item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    min-height: 228px;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  }
  .kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
  .go { margin-top: auto; padding-top: 14px; font-size: 14px; font-weight: 700; }

  /* Classic: a sheet of paper. Straight edges, black on white, nothing that moves. */
  .classic {
    padding: 20px 20px 18px;
    border: 1px solid #d9d9d9;
    border-radius: 3px;
    background: #fff;
    color: #111;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    box-shadow: 0 1px 0 #bdbdbd, 0 10px 24px rgba(0, 0, 0, 0.35);

    .kicker { color: #6b6b6b; }
    .sheet { display: grid; gap: 5px; width: 46px; margin: 14px 0 16px; padding: 8px 7px; border: 1.5px solid #111; }
    .sheet i { display: block; height: 2px; background: #111; }
    .sheet i:nth-child(1) { width: 60%; height: 3px; }
    .sheet i:nth-child(3) { width: 80%; }
    .sheet i:nth-child(5) { width: 45%; }
    b { display: block; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
    small { display: block; margin-top: 4px; color: #444; font-size: 14px; line-height: 1.4; }
    .go { color: #111; border-top: 1px solid #111; width: 100%; }
    &:hover { transform: translateY(-2px); box-shadow: 0 1px 0 #bdbdbd, 0 16px 30px rgba(0, 0, 0, 0.45); }
  }

  /* Tale: the cover of an adventure. Night sky, gold, a hero who waves at you. */
  .tale {
    padding: 20px 20px 18px;
    border: 2px solid #e9b44c;
    border-radius: 18px;
    background:
      radial-gradient(120% 80% at 80% 0%, rgba(120, 90, 220, 0.5), transparent 60%),
      radial-gradient(90% 70% at 10% 100%, rgba(255, 150, 60, 0.35), transparent 65%),
      linear-gradient(160deg, #2a1640, #4a1626 70%, #6a2416);
    color: #ffe2a1;
    font-family: 'Lora', Georgia, serif;
    box-shadow: inset 0 0 0 4px rgba(233, 180, 76, 0.18), 0 6px 0 rgba(0, 0, 0, 0.45), 0 16px 34px rgba(0, 0, 0, 0.5);

    .kicker { color: #f7d98a; }
    .hero { width: 96px; height: 96px; margin: 2px 0 2px -6px; transform-origin: 50% 90%; animation: ${sway} 3.2s ease-in-out infinite; filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.5)); }
    b { display: block; font: 400 26px/1.1 var(--chooser-fairy), 'Lora', Georgia, serif; letter-spacing: 0.02em; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45); }
    small { display: block; margin: 5px 0 14px; color: #f6ead0; font-size: 14.5px; font-style: italic; line-height: 1.4; }
    .go {
      margin-top: auto;
      padding: 8px 14px 9px;
      border: 2px solid #2a1810;
      border-radius: 11px;
      background: linear-gradient(180deg, #fbe3a0, #e9b44c 55%, #c98f2e);
      color: #2a1810;
      font: 400 15px/1.1 var(--chooser-fairy), 'Lora', Georgia, serif;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 3px 0 rgba(42, 24, 16, 0.6);
    }
    .star { position: absolute; color: #fff3c4; font-size: 14px; animation: ${twinkle} 2.6s ease-in-out infinite; pointer-events: none; }
    .star:nth-of-type(1) { right: 22px; top: 20px; }
    .star:nth-of-type(2) { right: 62px; top: 52px; font-size: 10px; animation-delay: 0.8s; }
    .star:nth-of-type(3) { right: 30px; top: 92px; font-size: 18px; animation-delay: 1.5s; }
    .star:nth-of-type(4) { right: 96px; top: 24px; font-size: 9px; animation-delay: 2.1s; }
    &:hover { transform: translateY(-4px) rotate(-1deg); box-shadow: inset 0 0 0 4px rgba(233, 180, 76, 0.3), 0 8px 0 rgba(0, 0, 0, 0.45), 0 22px 40px rgba(0, 0, 0, 0.55), 0 0 34px rgba(233, 180, 76, 0.35); }
  }

  @media (max-width: 560px) {
    ul { grid-template-columns: 1fr; }
    .item { min-height: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .tale .hero, .tale .star { animation: none; }
  }
`;

/** Entry screen: pick one of the CV designs. */
const Chooser: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const tr = t[lang];
  const ru = lang === 'ru';
  useFonts('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;1,500&family=Ruslan+Display&family=Uncial+Antiqua&display=swap');
  const kicker = { classic: ru ? 'Строго и по делу' : 'Strictly business', tale: ru ? 'Приключение' : 'An adventure' } as const;
  const go = { classic: ru ? 'Открыть резюме →' : 'Open the CV →', tale: ru ? 'В сказку!' : 'Into the tale!' } as const;

  return (
    <Wrap style={{ '--chooser-fairy': ru ? "'Ruslan Display'" : "'Uncial Antiqua'" } as React.CSSProperties}>
      <div className="box">
        <div className="top">
          <img src={PHOTO_URL} alt="" />
          <div>
            <strong>{tr.intro.name}</strong>
            <span>{tr.intro.role}</span>
          </div>
          <button type="button" className="lang" onClick={() => setLang(ru ? 'en' : 'ru')}>
            {ru ? 'EN' : 'RU'}
          </button>
        </div>

        <h1>{ru ? 'Одно резюме — выберите, как его читать' : 'One CV — choose how to read it'}</h1>
        <p className="hint">
          {ru ? 'Выберите вид. Переключиться можно в любой момент.' : 'Pick a design. You can switch at any time.'}
        </p>

        <ul>
          {VARIANTS.map((v) => (
            <li key={v.id}>
              <button type="button" className={`item ${v.id}`} onClick={() => setVariant(v.id)}>
                <span className="kicker">{kicker[v.id]}</span>
                {v.id === 'classic' ? (
                  <span className="sheet" aria-hidden="true"><i /><i /><i /><i /><i /></span>
                ) : (
                  <>
                    <i className="star" aria-hidden="true">✦</i><i className="star" aria-hidden="true">✦</i>
                    <i className="star" aria-hidden="true">✦</i><i className="star" aria-hidden="true">✦</i>
                    <Tomato prop="wave" crown cape className="hero" />
                  </>
                )}
                <b>{v.label}</b>
                <small>{v.desc[lang]}</small>
                <span className="go">{go[v.id]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Wrap>
  );
};

export default Chooser;
