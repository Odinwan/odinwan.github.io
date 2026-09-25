import styled, { keyframes } from 'styled-components';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const AboutWrapper = styled.section`
  background: ${({ theme }) => theme.colors.bg2};
  padding: 100px 0;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }

  .s-label {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.cyan};
    margin-bottom: 10px;
  }

  .s-title {
    font-size: clamp(32px, 4vw, 50px);
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 24px;
  }

  /* REVEAL ANIMATION */
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.65s ease, transform 0.65s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* LEFT — text */
  .text {
    p {
      color: ${({ theme }) => theme.colors.dim};
      line-height: 1.85;
      margin-bottom: 18px;
      font-size: 16px;

      strong { color: ${({ theme }) => theme.colors.text}; }

      &:last-child { margin-bottom: 0; }
    }

    .facts {
      margin-top: 28px;
      padding-top: 22px;
      border-top: 1px solid ${({ theme }) => theme.colors.border};
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .fact {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .fact-label {
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${({ theme }) => theme.colors.cyan};
    }

    .fact-value {
      color: ${({ theme }) => theme.colors.text};
      font-size: 15px;
      line-height: 1.6;
    }
  }

  /* RIGHT — highlight cards */
  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition-delay: 0.15s;
  }

  .card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 20px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    transition: border-color 0.3s, background 0.3s;
    cursor: default;

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderHover};
      background: ${({ theme }) => theme.colors.surfaceHover};
    }

    .icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: ${({ theme }) => theme.colors.cyanDim};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .body {
      h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      p { font-size: 13px; color: ${({ theme }) => theme.colors.muted}; line-height: 1.5; }
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 70px 0;
    .reveal { transition-duration: 0.3s; }

    .container { padding: 0 24px; }
    .grid { grid-template-columns: 1fr; gap: 40px; }
  }
`;
