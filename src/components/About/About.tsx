import React from 'react';
import { AboutWrapper } from './About.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const About: React.FC = () => {
  const textRef = useScrollReveal();
  const cardsRef = useScrollReveal();
  const { lang } = useLanguage();
  const tr = t[lang].about;

  const [titleLine1, titleLine2] = tr.title.split('\n');

  return (
    <AboutWrapper id="about">
      <div className="container">
        <div className="grid">
          <div className="text reveal" ref={textRef}>
            <div className="s-label">{tr.label}</div>
            <h2 className="s-title">
              {titleLine1}<br />{titleLine2}
            </h2>
            <p dangerouslySetInnerHTML={{ __html: tr.p1 }} />
            <p dangerouslySetInnerHTML={{ __html: tr.p2 }} />
            <p dangerouslySetInnerHTML={{ __html: tr.p3 }} />
            <div className="facts">
              <div className="fact"><span className="fact-label">{tr.eduLabel}</span><span className="fact-value">{tr.edu}</span></div>
              <div className="fact"><span className="fact-label">{tr.langLabel}</span><span className="fact-value">{tr.langs}</span></div>
            </div>
          </div>

          <div className="cards reveal" ref={cardsRef}>
            {tr.highlights.map((h) => (
              <div className="card" key={h.title}>
                <div className="icon">{h.icon}</div>
                <div className="body">
                  <h4>{h.title}</h4>
                  <p>{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AboutWrapper>
  );
};

export default About;
