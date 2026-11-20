import React from 'react';
import styled from 'styled-components';
import VariantSwitcher from './VariantSwitcher';
import { VariantId } from './variants';

/** Height of the strip that holds the design menu — the same place in every design. */
const BAR = 44;

/** The strip borrows each design's colours so it reads as part of it. */
const SKIN: Record<VariantId, { bg: string; fg: string; line: string }> = {
  classic: { bg: '#e9e7e1', fg: '#17130e', line: 'rgba(23, 19, 14, 0.14)' },
  tale: { bg: '#1a0f16', fg: '#ffe2a1', line: 'rgba(233, 180, 76, 0.3)' },
};

const Frame = styled.div`
  --app-bar: calc(${BAR}px + env(safe-area-inset-top, 0px));
  /* Every design sizes itself to this instead of the full viewport. */
  --app-h: calc(100dvh - var(--app-bar));

  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bar-bg);

  .app-bar {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--app-bar);
    padding: env(safe-area-inset-top, 0px) 8px 0;
    border-bottom: 1px solid var(--bar-line);
    background: var(--bar-bg);
    color: var(--bar-fg);
    font-family: ${({ theme }) => theme.fonts.sans};
  }

  .app-view {
    position: relative;
    flex: none;
    height: var(--app-h);
    overflow: hidden;
  }

  @media print {
    height: auto;
    display: block;
    --app-h: auto;
    .app-bar { display: none; }
    .app-view { height: auto; overflow: visible; }
  }
`;

/** Wraps every design with the menu that switches between them. */
const Shell: React.FC<React.PropsWithChildren<{ variant: VariantId }>> = ({ variant, children }) => {
  const skin = SKIN[variant];
  return (
    <Frame style={{ '--bar-bg': skin.bg, '--bar-fg': skin.fg, '--bar-line': skin.line } as React.CSSProperties}>
      <header className="app-bar">
        <VariantSwitcher />
      </header>
      <div className="app-view">{children}</div>
    </Frame>
  );
};

export default Shell;
