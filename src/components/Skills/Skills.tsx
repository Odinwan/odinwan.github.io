import React from 'react';
import { SkillsWrapper } from './Skills.styled';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const groups = [
  { title: 'Frontend', tags: ['React', 'Next.js', 'Nuxt.js', 'TypeScript', 'React Native', 'HTML5', 'CSS3', 'SCSS', 'Styled Components'], highlight: ['React', 'Next.js', 'TypeScript'] },
  { title: 'State Management', tags: ['Redux', 'RxJS', 'MobX', 'Effector'], highlight: ['Redux', 'RxJS'] },
  { title: 'UI Libraries', tags: ['Mantine', 'Material UI', 'Ant Design', 'Arc UI'], highlight: ['Mantine'] },
  { title: 'API & Data', tags: ['REST', 'GraphQL', 'WebSocket', 'MongoDB', 'Redis'], highlight: [] as string[] },
  { title: 'Tools', tags: ['Storybook', 'Playwright', 'Webpack', 'Vite', 'Git', 'Locize', 'Formik'], highlight: ['Storybook', 'Playwright'] },
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
