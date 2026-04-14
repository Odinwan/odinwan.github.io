import React from 'react';
import { AboutWrapper } from './About.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';

const highlights = [
  { icon: '🏗️', title: 'Architecture & Systems', desc: 'Designed scalable monorepo architectures and UI platforms used across 10+ projects' },
  { icon: '👥', title: 'Technical Leadership', desc: 'Led engineering teams, code reviews, and defined frontend architecture standards' },
  { icon: '🎨', title: 'Design Systems', desc: 'Full Design System: npm library, Storybook docs, Figma design token sync' },
  { icon: '🌐', title: 'Full Stack Capable', desc: 'Node.js, NestJS, GraphQL, MongoDB, Redis, Docker — comfortable end-to-end' },
];

const About: React.FC = () => {
  const textRef = useScrollReveal();
  const cardsRef = useScrollReveal();

  return (
    <AboutWrapper id="about">
      <div className="container">
        <div className="grid">
          <div className="text reveal" ref={textRef}>
            <div className="s-label">About me</div>
            <h2 className="s-title">Turning ideas into<br />exceptional products</h2>
            <p>
              I'm a Senior Frontend Developer based in <strong>Moldova</strong> with{' '}
              <strong>8+ years of experience</strong> building everything from complex financial
              platforms to design systems used across 10+ products.
            </p>
            <p>
              My path went from Bitrix Engineer to <strong>Technical Lead at WebProfy</strong>,
              where I led teams, shaped architecture, and delivered mission-critical tools for
              international trade and customs duty calculation.
            </p>
            <p>
              I care deeply about <strong>code quality, developer tooling, and user experience</strong>.
              Whether it's an npm design system, a Playwright scraper, or a Chrome Extension with
              WebSocket — I build things that actually work at scale.
            </p>
          </div>

          <div className="cards reveal" ref={cardsRef}>
            {highlights.map((h) => (
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
