import styled from 'styled-components';

export const SkillsWrapper = styled.section`
  background: ${({ theme }) => theme.colors.bg};
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

  .head {
    margin-bottom: 56px;
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
    margin-bottom: 14px;
  }

  .s-sub {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.muted};
    max-width: 480px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .group {
    padding: 26px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 16px;
    transition: border-color 0.3s, background 0.3s, transform 0.3s;

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderHover};
      background: ${({ theme }) => theme.colors.surfaceHover};
      transform: translateY(-4px);
    }

    .group-title {
      font-family: ${({ theme }) => theme.fonts.mono};
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${({ theme }) => theme.colors.cyan};
      margin-bottom: 14px;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .tag {
      padding: 4px 11px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid ${({ theme }) => theme.colors.border};
      color: ${({ theme }) => theme.colors.dim};
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      cursor: default;

      &:hover {
        border-color: ${({ theme }) => theme.colors.cyan};
        color: ${({ theme }) => theme.colors.cyan};
        background: ${({ theme }) => theme.colors.cyanDim};
      }

      &.hi {
        border-color: rgba(0, 212, 255, 0.35);
        color: ${({ theme }) => theme.colors.cyan};
        background: ${({ theme }) => theme.colors.cyanDim};
      }
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 70px 0;
    .reveal { transition-duration: 0.3s; }
    .container { padding: 0 24px; }
  }
`;
