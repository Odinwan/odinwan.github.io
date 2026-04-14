import React, { RefObject } from 'react';
import { HeroWrapper } from './Hero.styled';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
}

const Hero: React.FC<Props> = ({ canvasRef }) => (
  <HeroWrapper id="hero">
    <canvas ref={canvasRef} className="canvas" />
    <div className="glow g1" />
    <div className="glow g2" />

    <div className="inner">
      <div className="text">
        <div className="badge">
          <span className="dot" />
          Available for opportunities
        </div>

        <h1 className="name">
          <span className="l1">Vladislav</span>
          <span className="l2">Cupnii</span>
        </h1>

        <p className="title">
          <span className="br">&lt;</span> Senior Frontend Engineer <span className="br">/&gt;</span>
        </p>

        <p className="desc">
          Building <strong>scalable web applications</strong> with React, Next.js &amp; TypeScript for over{' '}
          <strong>8 years</strong>. Design systems, real-time apps, Chrome Extensions — I love solving hard
          problems with clean code.
        </p>

        <div className="stats">
          <div className="stat">
            <span className="val">8+</span>
            <span className="lbl">Years exp.</span>
          </div>
          <div className="stat">
            <span className="val">9</span>
            <span className="lbl">Companies</span>
          </div>
          <div className="stat">
            <span className="val">10+</span>
            <span className="lbl">Products built</span>
          </div>
        </div>

        <div className="actions">
          <a href="#experience" className="btn-primary">View Experience →</a>
          <a href="mailto:vlad.kupnyy@gmail.com" className="btn-secondary">Get in touch</a>
        </div>
      </div>

      <div className="photo-wrap">
        <div className="photo-frame">
          <img src="/photo.jpg" alt="Vladislav Cupnii" />
          <div className="badge-card card-bottom">
            <span className="icon">⚡</span>
            <div>
              <div className="sm">Current focus</div>
              <div className="vl">React & Next.js</div>
            </div>
          </div>
          <div className="badge-card card-top">
            <div className="vl grad">8+</div>
            <div className="sm">years</div>
          </div>
        </div>
      </div>
    </div>
  </HeroWrapper>
);

export default Hero;
