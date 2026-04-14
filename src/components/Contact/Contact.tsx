import React from 'react';
import { ContactWrapper } from './Contact.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';

const links = [
  { icon: '✉️', label: 'Email', value: 'vlad.kupnyy@gmail.com', href: 'mailto:vlad.kupnyy@gmail.com' },
  { icon: '💼', label: 'LinkedIn', value: 'vladislav-cupnii', href: 'https://linkedin.com/in/vladislav-cupnii' },
  { icon: '✈️', label: 'Telegram', value: '@Odinwan', href: 'https://t.me/Odinwan' },
  { icon: '📱', label: 'Phone', value: '+373 777 90 714', href: 'tel:+37377790714' },
];

const Contact: React.FC = () => {
  const leftRef = useScrollReveal();
  const rightRef = useScrollReveal();

  return (
    <ContactWrapper id="contact">
      <div className="container">
        <div className="grid">
          <div className="info reveal" ref={leftRef}>
            <div className="s-label">Get in touch</div>
            <h2 className="s-title">Let's work together</h2>
            <p>
              Open to new opportunities — full-time roles, contract projects, or technical consultations.
              Let's talk about how I can help your team build great products.
            </p>
            <div className="links">
              {links.map((l) => (
                <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="link">
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
              Open to work
            </div>
            <h3>Ready for new challenges</h3>
            <p>Looking for exciting roles in frontend engineering, full-stack, or technical leadership.</p>
            <a href="mailto:vlad.kupnyy@gmail.com" className="btn-primary">
              Send me a message →
            </a>
          </div>
        </div>
      </div>
    </ContactWrapper>
  );
};

export default Contact;
