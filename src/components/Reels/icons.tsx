import React from 'react';

type Props = { filled?: boolean };

const Svg: React.FC<React.PropsWithChildren> = ({ children }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const HeartIcon: React.FC<Props> = ({ filled }) => (
  <Svg>
    <path
      d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Svg>
);

export const DownloadIcon: React.FC = () => (
  <Svg>
    <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 20h14" />
  </Svg>
);

export const MailIcon: React.FC = () => (
  <Svg>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
);

export const ShareIcon: React.FC = () => (
  <Svg>
    <path d="M14 5l7 7-7 7v-4c-5 0-8.5 1.5-11 5 1-5 4-10 11-11V5z" />
  </Svg>
);

export const ArrowIcon: React.FC<{ up?: boolean }> = ({ up }) => (
  <Svg>
    <path d={up ? 'M12 19V5m0 0l-6 6m6-6l6 6' : 'M12 5v14m0 0l-6-6m6 6l6-6'} />
  </Svg>
);
