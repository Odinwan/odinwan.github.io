import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root { height: 100%; }

  /*
   * Phones: every design scrolls inside its own container, so the document itself
   * must never move — otherwise iOS drags the whole page with the finger and the
   * layout "slides" sideways or bounces.
   */
  html {
    overflow: hidden;
    overscroll-behavior: none;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  body {
    background: ${({ theme }) => theme.colors.page};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.sans};
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    overscroll-behavior: none;
    position: fixed;
    inset: 0;
    width: 100%;
    touch-action: manipulation;
  }

  a { color: inherit; }
  button { font: inherit; color: inherit; }
  :focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

  /* iOS zooms the page when a focused field has text smaller than 16px. */
  @media (pointer: coarse) {
    input, textarea, select { font-size: 16px !important; }
  }

  @media print {
    html, body { position: static !important; overflow: visible !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`;
