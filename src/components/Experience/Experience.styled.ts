import styled, { keyframes } from 'styled-components';

/** Keep in sync with COLLAPSED_ITEMS in Experience.tsx. */
const COLLAPSED_ITEMS = 3;

const pulseDot = keyframes`
  0%, 100% { box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
  50% { box-shadow: 0 0 0 8px rgba(16,185,129,0.08); }
`;

export const ExperienceWrapper = styled.section`
  background: ${({ theme }) => theme.colors.bg2};
  padding: 100px 0;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
  }

  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.65s ease, transform 0.65s ease;

    &.visible { opacity: 1; transform: translateY(0); }
  }

  .head { margin-bottom: 56px; }

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
    margin-bottom: 14px;
  }

  .s-sub {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.muted};
    max-width: 580px;
  }

  /* TIMELINE */
  .timeline {
    position: relative;
    padding-left: 30px;

    &::before {
      content: '';
      position: absolute;
      left: 0; top: 8px; bottom: 0;
      width: 1px;
      background: linear-gradient(to bottom, ${({ theme }) => theme.colors.cyan}, transparent);
    }
  }

  .ti {
    position: relative;
    margin-bottom: 44px;
    opacity: 0;
    transform: translateX(-16px);
    transition: opacity 0.5s ease, transform 0.5s ease;

    &.visible { opacity: 1; transform: translateX(0); }

    &:last-child { margin-bottom: 0; }
  }

  .dot {
    position: absolute;
    left: -36px; top: 6px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.cyan};
    border: 2px solid ${({ theme }) => theme.colors.bg2};
    box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.15);

    &.cur {
      background: ${({ theme }) => theme.colors.green};
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
      animation: ${pulseDot} 2s ease-in-out infinite;
    }
  }

  .card {
    padding: 26px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 16px;
    transition: border-color 0.3s, background 0.3s;

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderHover};
      background: ${({ theme }) => theme.colors.surfaceHover};
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 6px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .role {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .period {
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 11px;
      color: ${({ theme }) => theme.colors.cyan};
      padding: 3px 10px;
      background: ${({ theme }) => theme.colors.cyanDim};
      border-radius: 100px;
      white-space: nowrap;
    }

    .company {
      font-size: 13px;
      color: ${({ theme }) => theme.colors.purple};
      font-weight: 600;
      margin-bottom: 14px;
    }

    .note {
      font-size: 12px;
      color: ${({ theme }) => theme.colors.dim};
      font-style: italic;
      margin-top: -8px;
      margin-bottom: 14px;
    }

    .list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;

      li {
        font-size: 14px;
        color: ${({ theme }) => theme.colors.dim};
        padding-left: 14px;
        position: relative;
        line-height: 1.6;

        &::before {
          content: '▸';
          position: absolute;
          left: 0;
          color: ${({ theme }) => theme.colors.cyan};
          font-size: 11px;
          top: 2px;
        }
      }
    }
  }

  .more {
    display: none;
    margin-top: 14px;
    padding: 8px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    background: transparent;
    color: ${({ theme }) => theme.colors.cyan};
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.3s ease, background 0.3s ease;

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderHover};
      background: ${({ theme }) => theme.colors.cyanDim};
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 70px 0;
    .reveal, .ti { transition-duration: 0.3s; }
    .container { padding: 0 24px; }

    .card .list:not(.open) li:nth-child(n + ${COLLAPSED_ITEMS + 1}) { display: none; }
    .more { display: inline-flex; }
  }
`;
