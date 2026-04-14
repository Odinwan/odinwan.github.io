import React, { useEffect, useRef } from 'react';
import { ProjectsWrapper } from './Projects.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';

const projects = [
  {
    icon: '🎨',
    title: 'Design System / UI Kit',
    desc: 'Built a full Design System in React + Mantine to unify interfaces across 10+ products. Includes an npm component library, complete Storybook documentation, Figma design token sync, and a unified theme architecture.',
    tech: ['React', 'Mantine', 'Storybook', 'npm', 'Figma'],
  },
  {
    icon: '🕷️',
    title: 'Web Scraping System',
    desc: 'High-performance scraping system for a news portal processing 5000+ pages across 60+ page types. Playwright-based crawler with robust type detection and content extraction pipeline.',
    tech: ['Playwright', 'Node.js', 'TypeScript'],
  },
  {
    icon: '🧩',
    title: 'Chrome Extension',
    desc: 'Sales-team Chrome Extension with real-time conversation context retrieval, WebSocket data transport, and AI-powered response generation through a custom backend integration.',
    tech: ['Chrome API', 'WebSocket', 'TypeScript', 'React'],
  },
  {
    icon: '📄',
    title: 'Static Pages Platform',
    desc: 'BFF + WordPress architecture for high-scale static page delivery with page versioning, MongoDB storage layer, and Redis caching for performance-critical content serving.',
    tech: ['Next.js', 'WordPress', 'MongoDB', 'Redis'],
  },
];

const Projects: React.FC = () => {
  const headRef = useScrollReveal();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('.pc');
    if (!cards) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 100);
          }
        });
      },
      { threshold: 0.08 }
    );

    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <ProjectsWrapper id="projects">
      <div className="container">
        <div className="head reveal" ref={headRef}>
          <div className="s-label">Notable Work</div>
          <h2 className="s-title">Interesting Projects</h2>
          <p className="s-sub">Selected technical challenges with measurable real-world impact</p>
        </div>

        <div className="grid" ref={gridRef}>
          {projects.map((p) => (
            <div className="pc" key={p.title}>
              <div className="icon">{p.icon}</div>
              <h3 className="title">{p.title}</h3>
              <p className="desc">{p.desc}</p>
              <div className="tech">
                {p.tech.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProjectsWrapper>
  );
};

export default Projects;
