export const theme = {
  colors: {
    bg: '#06060f',
    bg2: '#0d0d1a',
    surface: 'rgba(255,255,255,0.04)',
    surfaceHover: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(0,212,255,0.35)',
    text: '#e2e8f0',
    muted: '#64748b',
    dim: '#94a3b8',
    cyan: '#00d4ff',
    cyanDim: 'rgba(0,212,255,0.12)',
    purple: '#8b5cf6',
    purpleDim: 'rgba(139,92,246,0.12)',
    green: '#10b981',
    white: '#ffffff',
  },
  gradients: {
    main: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
  },
  fonts: {
    sans: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  breakpoints: {
    mobile: '900px',
  },
  shadows: {
    glow: '0 20px 50px rgba(0,212,255,0.25)',
    card: '0 30px 60px rgba(0,0,0,0.4)',
  },
} as const;

export type Theme = typeof theme;
