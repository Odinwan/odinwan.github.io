import React from 'react';
import { SkillsWrapper } from './Skills.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';

const groups = [
  { title: 'Frontend', tags: ['React', 'Next.js', 'TypeScript', 'React Native', 'HTML5', 'CSS3', 'SCSS'], highlight: ['React', 'Next.js', 'TypeScript'] },
  { title: 'State Management', tags: ['Redux', 'RxJS', 'MobX', 'Effector'], highlight: ['Redux'] },
  { title: 'UI Libraries', tags: ['Mantine', 'Material UI', 'Ant Design', 'Arc UI'], highlight: ['Mantine'] },
  { title: 'Backend', tags: ['Node.js', 'NestJS', 'Express.js', 'REST API', 'GraphQL'], highlight: [] },
  { title: 'Infrastructure', tags: ['MongoDB', 'Redis', 'Docker', 'CI/CD', 'Firebase'], highlight: [] },
  { title: 'Tools & AI', tags: ['Storybook', 'Playwright', 'Webpack', 'Vite', 'ChatGPT', 'Claude', 'Copilot'], highlight: [] },
];

const Skills: React.FC = () => {
  const headRef = useScrollReveal();

  return (
    <SkillsWrapper id="skills">
      <div className="container">
        <div className="head reveal" ref={headRef}>
          <div className="s-label">Tech Stack</div>
          <h2 className="s-title">Skills & Technologies</h2>
          <p className="s-sub">A comprehensive toolkit built over 8 years of professional engineering</p>
        </div>

        <div className="grid">
          {groups.map((g) => (
            <div className="group" key={g.title}>
              <div className="group-title">{g.title}</div>
              <div className="tags">
                {g.tags.map((t) => (
                  <span key={t} className={g.highlight.includes(t) ? 'tag hi' : 'tag'}>{t}</span>
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
