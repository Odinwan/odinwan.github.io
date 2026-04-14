import styled from 'styled-components';

export const NavWrapper = styled.nav<{ $scrolled: boolean }>`
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ $scrolled }) => ($scrolled ? '14px 60px' : '22px 60px')};
  background: ${({ $scrolled, theme }) =>
    $scrolled ? 'rgba(6,6,15,0.88)' : 'transparent'};
  backdrop-filter: ${({ $scrolled }) => ($scrolled ? 'blur(20px)' : 'none')};
  border-bottom: ${({ $scrolled, theme }) =>
    $scrolled ? `1px solid ${theme.colors.border}` : '1px solid transparent'};
  transition: all 0.3s ease;

  .logo {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: 700;
    font-size: 18px;
    color: ${({ theme }) => theme.colors.cyan};
    text-decoration: none;

    span { color: ${({ theme }) => theme.colors.purple}; }
  }

  .links {
    display: flex;
    gap: 36px;
    list-style: none;

    a {
      color: ${({ theme }) => theme.colors.dim};
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.4px;
      transition: color 0.2s;

      &:hover { color: ${({ theme }) => theme.colors.cyan}; }

      &.cta {
        padding: 8px 22px;
        border: 1px solid ${({ theme }) => theme.colors.cyan};
        border-radius: 6px;
        color: ${({ theme }) => theme.colors.cyan};

        &:hover { background: ${({ theme }) => theme.colors.cyanDim}; }
      }
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 14px 24px;

    .links { display: none; }
  }
`;
