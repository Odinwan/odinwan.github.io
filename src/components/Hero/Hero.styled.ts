import styled, { keyframes } from 'styled-components';

const float1 = keyframes`
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-40px, 30px); }
`;

const float2 = keyframes`
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -25px); }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const gradText = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const HeroWrapper = styled.section`
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  overflow: hidden;

  .canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;

    &.g1 {
      width: 700px; height: 700px;
      background: rgba(0, 212, 255, 0.07);
      top: -200px; right: -100px;
      animation: ${float1} 9s ease-in-out infinite;
    }

    &.g2 {
      width: 600px; height: 600px;
      background: rgba(139, 92, 246, 0.07);
      bottom: -150px; left: -100px;
      animation: ${float2} 11s ease-in-out infinite;
    }
  }

  .inner {
    position: relative;
    z-index: 2;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 80px;
    align-items: center;
    width: 100%;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: ${({ theme }) => theme.colors.cyanDim};
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 100px;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.cyan};
    margin-bottom: 24px;

    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.green};
      animation: ${blink} 2s ease-in-out infinite;
    }
  }

  .name {
    font-size: clamp(50px, 7vw, 92px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -3px;
    margin-bottom: 16px;

    .l1 { display: block; color: ${({ theme }) => theme.colors.text}; }

    .l2 {
      display: block;
      background: ${({ theme }) => theme.gradients.main};
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ${gradText} 4s ease infinite;
    }
  }

  .title {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 15px;
    color: ${({ theme }) => theme.colors.dim};
    margin-bottom: 22px;

    .br { color: ${({ theme }) => theme.colors.cyan}; }
  }

  .desc {
    font-size: 17px;
    color: ${({ theme }) => theme.colors.dim};
    max-width: 520px;
    line-height: 1.8;
    margin-bottom: 36px;

    strong { color: ${({ theme }) => theme.colors.text}; font-weight: 600; }
  }

  .stats {
    display: flex;
    gap: 44px;
    margin-bottom: 40px;

    .stat {
      display: flex;
      flex-direction: column;
    }

    .val {
      font-size: 34px;
      font-weight: 800;
      background: ${({ theme }) => theme.gradients.main};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }

    .lbl {
      font-size: 12px;
      color: ${({ theme }) => theme.colors.muted};
      margin-top: 4px;
    }
  }

  .actions {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: ${({ theme }) => theme.gradients.main};
    border: none;
    border-radius: 8px;
    color: ${({ theme }) => theme.colors.white};
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${({ theme }) => theme.shadows.glow};
    }
  }

  .btn-download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border: 1px solid ${({ theme }) => theme.colors.cyan};
    border-radius: 8px;
    color: ${({ theme }) => theme.colors.cyan};
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    background: transparent;

    &:hover {
      background: ${({ theme }) => theme.colors.cyanDim};
      transform: translateY(-2px);
      box-shadow: ${({ theme }) => theme.shadows.glow};
    }
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    color: ${({ theme }) => theme.colors.dim};
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.3s ease;
    background: transparent;

    &:hover {
      border-color: ${({ theme }) => theme.colors.cyan};
      color: ${({ theme }) => theme.colors.cyan};
      background: ${({ theme }) => theme.colors.cyanDim};
    }
  }

  /* PHOTO */
  .photo-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .photo-frame {
    position: relative;
    width: 300px;
    height: 370px;

    &::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: ${({ theme }) => theme.gradients.main};
      border-radius: 24px;
      z-index: -1;
    }

    &::after {
      content: '';
      position: absolute;
      inset: -24px;
      background: ${({ theme }) => theme.gradients.main};
      border-radius: 32px;
      z-index: -2;
      opacity: 0.12;
      filter: blur(24px);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 22px;
      display: block;
    }
  }

  .badge-card {
    position: absolute;
    background: rgba(6, 6, 15, 0.92);
    backdrop-filter: blur(12px);
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 10px 16px;

    .sm { font-size: 11px; color: ${({ theme }) => theme.colors.muted}; }
    .vl { font-size: 14px; font-weight: 700; }
    .vl.grad {
      font-size: 24px;
      font-weight: 800;
      background: ${({ theme }) => theme.gradients.main};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }

    &.card-bottom {
      bottom: -18px;
      left: -28px;
      display: flex;
      align-items: center;
      gap: 10px;

      .icon { font-size: 22px; }
    }

    &.card-top {
      top: -14px;
      right: -22px;
      text-align: center;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    .inner {
      grid-template-columns: 1fr;
      padding: 90px 24px 40px;
      gap: 40px;
    }

    .photo-wrap { display: none; }
    .stats { gap: 24px; }
  }
`;
