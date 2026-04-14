import styled, { keyframes } from 'styled-components';

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

export const ContactWrapper = styled.section`
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

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
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
    margin-bottom: 16px;
  }

  /* LEFT INFO */
  .info {
    > p {
      font-size: 16px;
      color: ${({ theme }) => theme.colors.dim};
      line-height: 1.8;
      margin-bottom: 36px;
    }
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .link {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 15px 18px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    text-decoration: none;
    color: ${({ theme }) => theme.colors.text};
    transition: border-color 0.3s, background 0.3s, transform 0.3s;

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderHover};
      background: ${({ theme }) => theme.colors.surfaceHover};
      transform: translateX(4px);
    }

    .link-icon {
      width: 38px; height: 38px;
      border-radius: 10px;
      background: ${({ theme }) => theme.colors.cyanDim};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .link-text {
      flex: 1;

      .link-label { font-size: 11px; color: ${({ theme }) => theme.colors.muted}; text-transform: uppercase; letter-spacing: 1px; }
      .link-value { font-size: 14px; font-weight: 500; }
    }

    .link-arrow { color: ${({ theme }) => theme.colors.muted}; font-size: 16px; }
  }

  /* RIGHT AVAIL CARD */
  .avail {
    padding: 36px;
    background: linear-gradient(135deg, rgba(0,212,255,0.07), rgba(139,92,246,0.07));
    border: 1px solid rgba(0, 212, 255, 0.18);
    border-radius: 20px;
    text-align: center;
    transition-delay: 0.15s;

    .avail-icon { font-size: 56px; margin-bottom: 18px; display: block; }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 14px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 100px;
      font-size: 13px;
      color: ${({ theme }) => theme.colors.green};
      font-weight: 500;
      margin-bottom: 18px;

      .dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: ${({ theme }) => theme.colors.green};
        animation: ${blink} 2s ease-in-out infinite;
      }
    }

    h3 {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }

    > p {
      font-size: 15px;
      color: ${({ theme }) => theme.colors.muted};
      margin-bottom: 26px;
    }
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
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

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 70px 0;

    .container { padding: 0 24px; }
    .grid { grid-template-columns: 1fr; gap: 40px; }
  }
`;
