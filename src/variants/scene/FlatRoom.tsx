import React from 'react';
import { Tomato } from '../tale/Tomato';

/** Fixed positions so the fireflies don't jump between renders. */
const FIREFLIES = [
  [8, 34, 0], [17, 58, 2.1], [26, 22, 4.3], [34, 47, 1.2], [44, 16, 3.4], [57, 38, 0.6], [63, 12, 5.1],
  [72, 52, 2.7], [81, 28, 1.7], [90, 44, 3.9], [14, 14, 4.8], [50, 60, 2.2], [68, 66, 0.3], [94, 18, 1.4],
];

const STARS = [
  [18, 16, 2], [32, 34, 1.5], [70, 14, 2], [80, 40, 1.5], [44, 58, 1.5], [24, 66, 2], [84, 70, 1.5], [58, 30, 1],
];

interface Props {
  label: string;
  title: readonly [string, string, string];
  author: string;
  disabled: boolean;
  onOpen: () => void;
}

/** The same table drawn with CSS only — shown when the browser has no WebGL. */
const FlatRoom: React.FC<Props> = ({ label, title, author, disabled, onOpen }) => (
  <>
    <div className="room" role="img" aria-label={label}>
      <div className="wall">
        <div className="window">
          <span className="moon" />
          {STARS.map(([x, y, r], i) => (
            <i key={i} style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, animationDelay: `${i * 0.7}s` }} />
          ))}
        </div>
        <div className="shelf">
          <span /><span /><span /><span /><span /><span />
        </div>
      </div>
      <div className="glow" />
      {FIREFLIES.map(([x, y, d], i) => (
        <i key={i} className="fly" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `-${d}s` }} />
      ))}
    </div>

    <div className="desk">
      <div className="table">
        <div className="light" />
        <div className="candle">
          <span className="flame" />
          <span className="wick" />
          <span className="wax" />
          <span className="dish" />
        </div>
        <div className="mug">
          <span className="steam" /><span className="steam" />
          <span className="cup" />
        </div>
        <button type="button" className="book" onClick={onOpen} disabled={disabled} tabIndex={-1} aria-hidden="true">
          <span className="shade" />
          <span className="halo" />
          <span className="back" />
          <span className="pages p1" /><span className="pages p2" /><span className="pages p3" /><span className="pages p4" />
          <span className="cover">
            <span className="front">
              <span className="frame">
                <span className="t1">{title[0]}</span>
                <span className="t2">{title[1]}</span>
                <span className="t3">{title[2]}</span>
                <Tomato crown className="emblem" />
                <span className="by">{author}</span>
              </span>
            </span>
            <span className="inside" />
          </span>
        </button>
      </div>
    </div>
  </>
);

export default FlatRoom;
