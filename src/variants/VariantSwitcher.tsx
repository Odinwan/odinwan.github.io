import React from 'react';
import styled from 'styled-components';
import { useLanguage } from '@hooks/useLanguage';
import { VARIANTS, setVariant, useVariant } from './variants';

const Nav = styled.nav`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  color: inherit;
  font-size: 13px;
  line-height: 1;
  &::-webkit-scrollbar { display: none; }

  button {
    flex-shrink: 0;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: 99px;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0.55;
    cursor: pointer;
    transition: opacity 0.15s ease, border-color 0.15s ease;

    &:hover { opacity: 1; }
    &[aria-current='page'] { opacity: 1; border-color: currentColor; cursor: default; }
  }

  .home { padding: 7px 8px; font-size: 1.15em; }

  &.stacked {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    button { text-align: left; }
    .home { padding: 7px 10px; font-size: inherit; }
  }
`;

interface Props {
  className?: string;
  /** Hide the "all designs" button that returns to the entry screen. */
  noHome?: boolean;
  /** Vertical list instead of a row. */
  stacked?: boolean;
}

/**
 * Buttons that switch between the CV designs. Inherits font and `color` from its
 * parent and has no background of its own, so it sits on any header; restyle it
 * with `styled(VariantSwitcher)` if a design needs more.
 */
const VariantSwitcher: React.FC<Props> = ({ className = '', noHome, stacked }) => {
  const { variant } = useVariant();
  const { lang } = useLanguage();
  const label = lang === 'ru' ? 'Вид резюме' : 'CV design';
  const home = lang === 'ru' ? 'Все варианты' : 'All designs';

  return (
    <Nav className={`${stacked ? 'stacked' : ''} ${className}`.trim()} aria-label={label}>
      {!noHome && (
        <button type="button" className="home" onClick={() => setVariant(null)} aria-label={home} title={home}>{stacked ? `⊞ ${home}` : '⊞'}</button>
      )}
      {VARIANTS.map((v) => (
        <button
          type="button"
          key={v.id}
          aria-current={v.id === variant ? 'page' : undefined}
          onClick={() => setVariant(v.id)}
        >
          {v.label}
        </button>
      ))}
    </Nav>
  );
};

export default VariantSwitcher;
