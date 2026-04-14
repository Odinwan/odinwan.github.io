import React, { useEffect, useState } from 'react';
import { NavWrapper } from './Nav.styled';
import { useLanguage } from '@hooks/useLanguage';
import { t } from '../../translations';

const Nav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang } = useLanguage();
  const tr = t[lang].nav;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <NavWrapper $scrolled={scrolled}>
      <a href="#hero" className="logo">VC<span>.</span></a>
      <ul className="links">
        <li><a href="#about">{tr.about}</a></li>
        <li><a href="#skills">{tr.skills}</a></li>
        <li><a href="#experience">{tr.experience}</a></li>
        <li><a href="#projects">{tr.projects}</a></li>
        <li><a href="#contact" className="cta">{tr.hire}</a></li>
      </ul>
      <div className="lang-switcher">
        <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
        <span className="sep">|</span>
        <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>RU</button>
      </div>
    </NavWrapper>
  );
};

export default Nav;
