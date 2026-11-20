import React from 'react';

export type TomatoProp = 'none' | 'laptop' | 'bindle' | 'flag' | 'star' | 'wave' | 'chest';

interface Props {
  /** What the hero holds or does. */
  prop?: TomatoProp;
  crown?: boolean;
  cape?: boolean;
  /** Accessible name; without it the picture is decorative. */
  title?: string;
  className?: string;
}

const INK = '#3a2418';
const RED = '#ff5b36';
const RED_DARK = '#d93a1f';
const LEAF = '#4c9a48';
const LEAF_DARK = '#2f6b33';
const GOLD = '#e9b44c';
const CREAM = '#f6ead0';

const star = (cx: number, cy: number, R: number, r: number, points = 5): string =>
  Array.from({ length: points * 2 }, (_, i) => {
    const rad = i % 2 === 0 ? R : r;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

const stroke = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** The hero of the tale: an original round tomato in glasses. One drawing, several poses. */
export const Tomato: React.FC<Props> = ({ prop = 'none', crown, cape, title, className }) => {
  const raised = prop === 'star' || prop === 'wave';
  const sitting = prop === 'laptop';

  const leftArm = sitting ? 'M46 128 Q40 156 64 164' : 'M44 124 Q28 136 32 150';
  let rightArm = 'M156 124 Q172 136 168 150';
  let rightHand: [number, number] = [168, 150];
  if (sitting) { rightArm = 'M154 128 Q160 156 136 164'; rightHand = [136, 164]; }
  if (raised) { rightArm = 'M154 110 Q176 100 180 78'; rightHand = [180, 78]; }
  if (prop === 'bindle') { rightArm = 'M156 122 Q170 130 159 140'; rightHand = [159, 140]; }
  if (prop === 'flag') { rightArm = 'M156 122 Q168 128 176 118'; rightHand = [176, 118]; }
  const leftHand: [number, number] = sitting ? [64, 164] : [32, 150];

  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <ellipse cx="100" cy="186" rx="52" ry="6" fill={INK} opacity="0.13" />

      {cape && (
        <path d="M54 92 Q26 150 40 180 Q70 164 100 172 Q130 164 160 180 Q174 150 146 92 Z" fill={GOLD} {...stroke} />
      )}

      {prop === 'bindle' && (
        <g>
          <path d="M150 166 L184 62" fill="none" {...stroke} strokeWidth={4} stroke="#8a5a2b" />
          <circle cx="181" cy="58" r="15" fill={LEAF} {...stroke} />
          <circle cx="176" cy="54" r="2.2" fill={CREAM} />
          <circle cx="186" cy="60" r="2.2" fill={CREAM} />
          <circle cx="179" cy="65" r="2.2" fill={CREAM} />
        </g>
      )}
      {prop === 'flag' && (
        <g>
          <path d="M176 178 L176 38" fill="none" {...stroke} strokeWidth={4} stroke="#8a5a2b" />
          <path d="M176 40 L199 50 L176 62 Z" fill={LEAF} {...stroke} />
        </g>
      )}

      {/* legs */}
      {sitting ? (
        <g fill={INK}>
          <ellipse cx="50" cy="188" rx="11" ry="5" />
          <ellipse cx="150" cy="188" rx="11" ry="5" />
        </g>
      ) : (
        <g>
          <path d="M82 164 L80 180 M118 164 L120 180" fill="none" {...stroke} strokeWidth={4} />
          <ellipse cx="75" cy="182" rx="10" ry="4.5" fill={INK} />
          <ellipse cx="125" cy="182" rx="10" ry="4.5" fill={INK} />
        </g>
      )}

      {/* body */}
      <path d="M100 62 C140 56 166 84 164 118 C162 152 134 170 100 170 C66 170 38 152 36 118 C34 84 60 56 100 62 Z" fill={RED} {...stroke} />
      <path d="M152 96 C160 132 136 160 100 165 C134 170 161 150 162 118 C162 110 158 102 152 96 Z" fill={RED_DARK} opacity="0.55" />
      <ellipse cx="64" cy="92" rx="8" ry="15" transform="rotate(28 64 92)" fill="#fff" opacity="0.38" />

      {/* leafy top */}
      <g fill={LEAF} {...stroke} strokeWidth={2.5}>
        <path d="M100 64 Q84 50 64 58 Q82 72 100 64 Z" />
        <path d="M100 64 Q116 50 136 58 Q118 72 100 64 Z" />
        <path d="M100 64 Q90 80 76 84 Q84 66 100 64 Z" />
        <path d="M100 64 Q110 80 124 84 Q116 66 100 64 Z" />
        <path d="M100 64 Q88 50 82 36 Q100 46 100 64 Z" />
      </g>
      <path d="M100 64 Q101 50 108 42" fill="none" {...stroke} stroke={LEAF_DARK} strokeWidth={5} />

      {crown && (
        <g transform="rotate(16 132 48)">
          <path d="M114 60 L111 36 L123 47 L132 31 L141 47 L153 36 L150 60 Z" fill={GOLD} {...stroke} strokeWidth={2.5} />
          <circle cx="132" cy="52" r="2.6" fill={RED_DARK} />
        </g>
      )}

      {/* face */}
      <circle cx="62" cy="130" r="7" fill="#ffb199" opacity="0.75" />
      <circle cx="138" cy="130" r="7" fill="#ffb199" opacity="0.75" />
      <g fill="rgba(255,255,255,0.4)" {...stroke}>
        <circle cx="80" cy="108" r="15" />
        <circle cx="120" cy="108" r="15" />
      </g>
      <path d="M95 106 Q100 101 105 106 M65 106 L56 102 M135 106 L144 102" fill="none" {...stroke} />
      <circle cx="82" cy="110" r="3.6" fill={INK} />
      <circle cx="118" cy="110" r="3.6" fill={INK} />
      <path d="M86 134 Q100 147 114 134" fill="none" {...stroke} />

      {/* arms */}
      <path d={leftArm} fill="none" {...stroke} strokeWidth={4} />
      <path d={rightArm} fill="none" {...stroke} strokeWidth={4} />
      <circle cx={leftHand[0]} cy={leftHand[1]} r="5" fill={RED} {...stroke} strokeWidth={2.5} />
      <circle cx={rightHand[0]} cy={rightHand[1]} r="5" fill={RED} {...stroke} strokeWidth={2.5} />

      {prop === 'star' && <polygon points={star(182, 56, 17, 7.5)} fill={GOLD} {...stroke} strokeWidth={2.5} />}
      {prop === 'wave' && (
        <path d="M191 64 Q197 74 193 86 M168 66 Q172 58 182 58" fill="none" {...stroke} strokeWidth={2.5} opacity="0.6" />
      )}

      {sitting && (
        <g>
          <rect x="64" y="144" width="72" height="42" rx="5" fill={CREAM} {...stroke} />
          <path d="M100 172 Q90 164 94 156 Q104 158 100 172 Z M100 172 Q110 166 108 158" fill={LEAF} {...stroke} strokeWidth={2} />
          <rect x="54" y="184" width="92" height="8" rx="4" fill="#d9c8a2" {...stroke} strokeWidth={2.5} />
        </g>
      )}

      {prop === 'chest' && (
        <g>
          <path d="M122 156 Q151 128 180 156 Z" fill="#b9793a" {...stroke} />
          <rect x="122" y="156" width="58" height="32" rx="3" fill="#a3642c" {...stroke} />
          <path d="M136 156 V188 M166 156 V188" fill="none" {...stroke} strokeWidth={2} opacity="0.6" />
          <rect x="145" y="150" width="12" height="14" rx="2" fill={GOLD} {...stroke} strokeWidth={2.5} />
          <polygon points={star(186, 126, 9, 3, 4)} fill={GOLD} {...stroke} strokeWidth={1.5} />
          <polygon points={star(170, 114, 6, 2, 4)} fill={GOLD} {...stroke} strokeWidth={1.5} />
        </g>
      )}
    </svg>
  );
};

/** Ornamental divider: two vines meeting at a little tomato. */
export const Flourish: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`flourish ${className}`.trim()} viewBox="0 0 180 20" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M4 10 H58 Q68 10 72 5 Q74 10 68 12" />
      <path d="M176 10 H122 Q112 10 108 5 Q106 10 112 12" />
    </g>
    <circle cx="16" cy="10" r="1.6" fill="currentColor" />
    <circle cx="164" cy="10" r="1.6" fill="currentColor" />
    <circle cx="90" cy="11.5" r="6" fill={RED_DARK} />
    <path d="M90 6.5 Q84 2 80 5 Q85 8 90 6.5 Z M90 6.5 Q96 2 100 5 Q95 8 90 6.5 Z" fill={LEAF} />
  </svg>
);
