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
    const grid = gridRef.current;
    if (!grid) return;

    // Reset visibility on language change so new elements animate in
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.pc'));
    cards.forEach(el => el.classList.remove('visible'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Use DOM index for correct stagger regardless of callback batch
            const idx = cards.indexOf(entry.target as HTMLElement);
            setTimeout(() => entry.target.classList.add('visible'), idx * 120);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);

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
