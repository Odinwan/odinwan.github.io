import styled from 'styled-components';

export const ProjectsWrapper = styled.section`
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
    max-width: 480px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    gap: 22px;
  }

  .pc {
    padding: 30px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(18px);
    transition: all 0.45s ease;
    cursor: default;

    &.visible { opacity: 1; transform: translateY(0); }

    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: ${({ theme }) => theme.gradients.main};
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderHover};
      background: ${({ theme }) => theme.colors.surfaceHover};
      transform: translateY(-6px);
      box-shadow: ${({ theme }) => theme.shadows.card};

      &::before { opacity: 1; }
    }

    .icon {
      width: 50px; height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin-bottom: 18px;
      background: ${({ theme }) => theme.colors.cyanDim};
    }

    .title {
      font-size: 19px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: -0.3px;
    }

    .desc {
      font-size: 14px;
      color: ${({ theme }) => theme.colors.muted};
      line-height: 1.7;
      margin-bottom: 18px;
    }

    .tech {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 11px;
      font-family: ${({ theme }) => theme.fonts.mono};
      font-weight: 500;
      background: ${({ theme }) => theme.colors.purpleDim};
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: ${({ theme }) => theme.colors.purple};
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 70px 0;
    .container { padding: 0 24px; }
  }
`;
