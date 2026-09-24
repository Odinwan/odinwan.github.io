import React, { RefObject } from 'react';
import { HeroWrapper } from './Hero.styled';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

interface Props {
  canvasRef: RefObject<HTMLCanvasElement>;
}

const Hero: React.FC<Props> = ({ canvasRef }) => {
  const { lang } = useLanguage();
  const tr = t[lang].hero;

  return (
    <HeroWrapper id="hero">
      <canvas ref={canvasRef} className="canvas" />
      <div className="glow g1" />
      <div className="glow g2" />

      <div className="inner">
        <div className="text">
          <div className="badge">
            <span className="dot" />
            {tr.badge}
          </div>

          <h1 className="name">
            <span className="l1">Vladislav</span>
            <span className="l2">Cupnii</span>
          </h1>

          <p className="title">
            <span className="br">&lt;</span> Senior Fullstack Developer <span className="br">/&gt;</span>
          </p>

          <p className="desc" dangerouslySetInnerHTML={{ __html: tr.desc }} />

          <div className="stats">
            <div className="stat">
              <span className="val">8+</span>
              <span className="lbl">{tr.yearsLabel}</span>
            </div>
            <div className="stat">
              <span className="val">7</span>
              <span className="lbl">{tr.companiesLabel}</span>
            </div>
            <div className="stat">
              <span className="val">10+</span>
              <span className="lbl">{tr.productsLabel}</span>
            </div>
          </div>

          <div className="actions">
            <a href="#experience" className="btn-primary">{tr.viewExp}</a>
            <a
              href="/Vladislav_Cupnii_Senior_Fullstack_CV.pdf"
              download
              className="btn-download"
            >
              ↓ {tr.downloadCV}
            </a>
            <a href="mailto:vlad.kupnyy@gmail.com" className="btn-secondary">{tr.contact}</a>
          </div>
        </div>

        <div className="photo-wrap">
          <div className="photo-frame">
            <img src="/photo.jpg" alt="Vladislav Cupnii" />
            <div className="badge-card card-bottom">
              <span className="icon">⚡</span>
              <div>
                <div className="sm">{tr.currentFocus}</div>
                <div className="vl">React · Next.js · Node.js</div>
              </div>
            </div>
            <div className="badge-card card-top">
              <div className="vl grad">8+</div>
              <div className="sm">{tr.yearsLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </HeroWrapper>
  );
};

export default Hero;
