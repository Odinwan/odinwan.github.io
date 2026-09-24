import React from 'react';
import { SkillsWrapper } from './Skills.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const groups = [
  { title: 'Frontend', tags: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'React Native', 'HTML5', 'CSS3', 'SCSS', 'Styled Components'], highlight: ['React', 'Next.js', 'TypeScript'] },
  { title: 'Backend & Data', tags: ['Node.js', 'Express.js', 'REST APIs', 'WebSocket', 'MongoDB', 'Redis', 'Firebase / Firestore'], highlight: ['Node.js', 'Express.js'] },
  { title: 'State Management', tags: ['Redux', 'Effector', 'RxJS', 'MobX'], highlight: ['Redux', 'Effector'] },
  { title: 'UI Libraries', tags: ['Mantine', 'Material UI', 'Ant Design'], highlight: ['Mantine'] },
  { title: 'Tooling', tags: ['Storybook', 'Playwright', 'Vite', 'Webpack', 'Git'], highlight: ['Storybook', 'Playwright'] },
  { title: 'Delivery & DevOps', tags: ['Docker', 'GitHub Actions', 'CI/CD', 'Architecture', 'Hiring', 'Estimation'], highlight: ['Docker', 'GitHub Actions'] },
  { title: 'AI', tags: ['Codex', 'Claude', 'GitHub Copilot'], highlight: [] as string[] },
];

const Skills: React.FC = () => {
  const headRef = useScrollReveal();
  const { lang } = useLanguage();
  const tr = t[lang].skills;

  return (
    <SkillsWrapper id="skills">
      <div className="container">
        <div className="head reveal" ref={headRef}>
          <div className="s-label">{tr.label}</div>
          <h2 className="s-title">{tr.title}</h2>
          <p className="s-sub">{tr.sub}</p>
        </div>

        <div className="grid">
          {groups.map((g) => (
            <div className="group" key={g.title}>
              <div className="group-title">{g.title}</div>
              <div className="tags">
                {g.tags.map((tag) => (
                  <span key={tag} className={g.highlight.includes(tag) ? 'tag hi' : 'tag'}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkillsWrapper>
  );
};

export default Skills;
