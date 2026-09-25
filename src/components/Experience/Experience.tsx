import React, { useEffect, useRef, useState } from 'react';
import { ExperienceWrapper } from './Experience.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

/** Bullets shown per job on mobile before the "more" toggle. */
const COLLAPSED_ITEMS = 3;

const Experience: React.FC = () => {
  const headRef = useScrollReveal();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const tr = t[lang].experience;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const items = Array.from(timeline.querySelectorAll<HTMLElement>('.ti'));
    items.forEach(el => el.classList.remove('visible'));

    const observer = new IntersectionObserver(
      (entries) => {
        // Stagger only within the batch that entered together (e.g. several
        // cards on a tall desktop screen). On mobile each card enters alone,
        // so it must appear immediately instead of waiting for its DOM index.
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => items.indexOf(a.target as HTMLElement) - items.indexOf(b.target as HTMLElement))
          .forEach((entry, i) => {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            observer.unobserve(entry.target);
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
          {tr.jobs.map((job) => {
            const key = `${job.company}-${job.role}`;
            const hidden = job.items.length - COLLAPSED_ITEMS;
            const isOpen = !!expanded[key];
            return (
              <div className="ti" key={key}>
                <div className={`dot ${job.current ? 'cur' : ''}`} />
                <div className="card">
                  <div className="card-header">
                    <div className="role">{job.role}</div>
                    <div className="period">{job.period}</div>
                  </div>
                  <div className="company">{job.company}</div>
                  {'note' in job && <div className="note">{job.note}</div>}
                  <ul className={`list ${isOpen ? 'open' : ''}`}>
                    {job.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {hidden > 0 && (
                    <button type="button" className="more" onClick={() => toggle(key)} aria-expanded={isOpen}>
                      {isOpen ? tr.less : `+${hidden} ${tr.more}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ExperienceWrapper>
  );
};

export default Experience;
