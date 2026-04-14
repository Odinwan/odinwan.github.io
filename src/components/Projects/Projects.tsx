import React, { useEffect, useRef } from 'react';
import { ProjectsWrapper } from './Projects.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const Projects: React.FC = () => {
  const headRef = useScrollReveal();
  const gridRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const tr = t[lang].projects;

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
          <div className="s-label">{tr.label}</div>
          <h2 className="s-title">{tr.title}</h2>
          <p className="s-sub">{tr.sub}</p>
        </div>

        <div className="grid" ref={gridRef}>
          {tr.list.map((p) => (
            <div className="pc" key={p.title}>
              <div className="icon">{p.icon}</div>
              <h3 className="title">{p.title}</h3>
              <p className="desc">{p.desc}</p>
              <div className="tech">
                {p.tech.map((tag) => <span key={tag} className="tag">{tag}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProjectsWrapper>
  );
};

export default Projects;
