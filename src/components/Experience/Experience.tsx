import React, { useEffect, useRef } from 'react';
import { ExperienceWrapper } from './Experience.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';

const jobs = [
  {
    role: 'Senior Frontend Developer',
    company: 'Doc Space',
    period: 'Nov 2024 — Mar 2026',
    current: true,
    items: [
      'Developed a reusable npm module to improve code maintainability across projects',
      'Built a calendar management system with advanced scheduling functionality',
      'Developed a contacts management service',
      'Built an admin panel for managing users and access permissions',
    ],
  },
  {
    role: 'Full Stack Developer',
    company: 'Unicorn Energy Platform',
    period: '2025',
    current: false,
    items: [
      'Financial platform with monorepo architecture and REST API',
      'Implemented a 15-level referral system',
      'Zion crypto wallet integration',
      'Admin panel with Docker + CI/CD pipeline',
    ],
  },
  {
    role: 'Senior Frontend Developer',
    company: 'KIVORK',
    period: 'Apr 2024 — Nov 2024',
    current: false,
    items: [
      'System for managing property data and sales channels',
      'Integrated hotel and ticket information with external providers',
      'Automated booking and payment processing flows',
      'Built a Google Chrome Extension for the sales team',
    ],
  },
  {
    role: 'Technical Lead',
    company: 'WebProfy',
    period: 'Jan 2023 — Mar 2024',
    current: false,
    items: [
      'Team management, architecture design, and code reviews',
      'Financial services calculator for international trade (FEA)',
      'Service for calculating customs duties and delivery costs',
    ],
  },
  {
    role: 'Middle+ Frontend Developer',
    company: 'WebProfy',
    period: 'Jan 2022 — Jan 2023',
    current: false,
    items: [
      'Service for managing hotels and sales channels',
      'Booking and payment collection system',
    ],
  },
  {
    role: 'Middle Frontend Developer',
    company: 'WebProfy',
    period: 'Jan 2021 — Jan 2022',
    current: false,
    items: [
      'Service for managing hotels and sales channels',
      'Booking and payment processing system',
    ],
  },
  {
    role: 'Junior+ Frontend Developer',
    company: 'Laaty Solution',
    period: 'Aug 2020 — Dec 2020',
    current: false,
    items: ['Interactive application for creating and completing tasks'],
  },
  {
    role: 'Junior Frontend Developer',
    company: 'Gamega',
    period: 'Sep 2019 — Aug 2020',
    current: false,
    items: ['Service for checking sales quality (Secret Shopper)'],
  },
  {
    role: 'Bitrix Engineer',
    company: 'Rich Code',
    period: 'Feb 2018 — Sep 2019',
    current: false,
    items: ['Online stores, landing pages, and corporate websites'],
  },
];

const Experience: React.FC = () => {
  const headRef = useScrollReveal();
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = timelineRef.current?.querySelectorAll<HTMLElement>('.ti');
    if (!items) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
          }
        });
      },
      { threshold: 0.05 }
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <ExperienceWrapper id="experience">
      <div className="container">
        <div className="head reveal" ref={headRef}>
          <div className="s-label">Work History</div>
          <h2 className="s-title">Experience</h2>
          <p className="s-sub">From Bitrix Engineer to Technical Lead — 8 years, 9 companies, countless shipped products</p>
        </div>

        <div className="timeline" ref={timelineRef}>
          {jobs.map((job) => (
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
