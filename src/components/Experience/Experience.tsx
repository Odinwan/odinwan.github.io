import React, { useEffect, useRef } from 'react';
import { ExperienceWrapper } from './Experience.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const Experience: React.FC = () => {
  const headRef = useScrollReveal();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const tr = t[lang].experience;

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const items = Array.from(timeline.querySelectorAll<HTMLElement>('.ti'));
    items.forEach(el => el.classList.remove('visible'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = items.indexOf(entry.target as HTMLElement);
            setTimeout(() => entry.target.classList.add('visible'), idx * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [lang]);

  return (
    <ExperienceWrapper id="experience">
      <div className="container">
        <div className="head reveal" ref={headRef}>
          <div className="s-label">{tr.label}</div>
          <h2 className="s-title">{tr.title}</h2>
          <p className="s-sub">{tr.sub}</p>
        </div>

        <div className="timeline" ref={timelineRef}>
          {tr.jobs.map((job) => (
            <div className="ti" key={`${job.company}-${job.role}`}>
              <div className={`dot ${job.current ? 'cur' : ''}`} />
              <div className="card">
                <div className="card-header">
                  <div className="role">{job.role}</div>
                  <div className="period">{job.period}</div>
                </div>
                <div className="company">{job.company}</div>
                <ul className="list">
                  {job.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ExperienceWrapper>
  );
};

export default Experience;
