import React from 'react';
import { ContactWrapper } from './Contact.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const Contact: React.FC = () => {
  const leftRef = useScrollReveal();
  const rightRef = useScrollReveal();
  const { lang } = useLanguage();
  const tr = t[lang].contact;

  return (
    <ContactWrapper id="contact">
      <div className="container">
        <div className="grid">
          <div className="info reveal" ref={leftRef}>
            <div className="s-label">{tr.label}</div>
            <h2 className="s-title">{tr.title}</h2>
            <p>{tr.desc}</p>
            <div className="links">
              {tr.links.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="link"
                >
                  <div className="link-icon">{l.icon}</div>
                  <div className="link-text">
                    <div className="link-label">{l.label}</div>
                    <div className="link-value">{l.value}</div>
                  </div>
                  <div className="link-arrow">→</div>
                </a>
              ))}
            </div>
          </div>

          <div className="avail reveal" ref={rightRef}>
            <span className="avail-icon">🚀</span>
            <div className="status">
              <span className="dot" />
              {tr.availStatus}
            </div>
            <h3>{tr.availTitle}</h3>
            <p>{tr.availDesc}</p>
            <a href="mailto:vlad.kupnyy@gmail.com" className="btn-primary">
              {tr.sendMsg}
            </a>
          </div>
        </div>
      </div>
    </ContactWrapper>
  );
};

export default Contact;
