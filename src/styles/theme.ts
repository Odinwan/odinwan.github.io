export const theme = {
  colors: {
    page: '#0b0b0b',
    text: '#f5f0e6',
    dim: 'rgba(245,240,230,0.62)',
    line: 'rgba(245,240,230,0.14)',
  },
  fonts: {
    display: "'Unbounded', system-ui, sans-serif",
    sans: "'Onest', system-ui, sans-serif",
  },
  breakpoints: {
    /** Below this the feed is full-screen like a phone app. */
    desktop: '1024px',
  },
} as const;

export type Theme = typeof theme;
