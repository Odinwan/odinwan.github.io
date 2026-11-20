import React from 'react';
import styled from 'styled-components';
import { useLanguage } from '@hooks/useLanguage';
import { PHOTO_URL } from '../data/links';
import { t } from '../translations';
import { VARIANTS, setVariant } from './variants';

const Wrap = styled.main`
  height: 100dvh;
  overflow-y: auto;
  display: grid;
  place-items: safe center;
  padding: 32px 20px;

  .box { width: min(100%, 560px); }

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
    gap: 10px;
    margin-top: 28px;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px 18px;
    border: 1px solid ${({ theme }) => theme.colors.line};
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.03);
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;

    &:hover { background: rgba(255, 255, 255, 0.08); border-color: currentColor; transform: translateX(4px); }
    .emoji { font-size: 26px; }
    b { display: block; font-size: 17px; }
    small { font-size: 14px; color: ${({ theme }) => theme.colors.dim}; }
    .go { margin-left: auto; font-size: 20px; opacity: 0.5; }
  }
`;

/** Entry screen: pick one of the CV designs. */
const Chooser: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const tr = t[lang];
  const ru = lang === 'ru';

  return (
    <Wrap>
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
              <button type="button" className="item" onClick={() => setVariant(v.id)}>
                <span className="emoji" aria-hidden="true">{v.emoji}</span>
                <span>
                  <b>{v.label}</b>
                  <small>{v.desc[lang]}</small>
                </span>
                <span className="go" aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Wrap>
  );
};

export default Chooser;
