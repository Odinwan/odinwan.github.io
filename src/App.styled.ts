import styled from 'styled-components';

export const AppWrapper = styled.div`
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  overflow-x: hidden;
  line-height: 1.6;
  font-family: ${({ theme }) => theme.fonts.sans};
`;

export const Footer = styled.footer`
  padding: 28px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      flex-direction: column;
      gap: 8px;
      text-align: center;
      padding: 0 24px;
    }
  }

  .copy {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.muted};
  }

  .mono {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.muted};
  }
`;
