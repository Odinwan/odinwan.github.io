import React, { useEffect, useState } from 'react';
import { NavWrapper } from './Nav.styled';

const Nav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <NavWrapper $scrolled={scrolled}>
      <a href="#hero" className="logo">VC<span>.</span></a>
      <ul className="links">
        <li><a href="#about">About</a></li>
        <li><a href="#skills">Skills</a></li>
        <li><a href="#experience">Experience</a></li>
        <li><a href="#projects">Projects</a></li>
        <li><a href="#contact" className="cta">Hire me</a></li>
      </ul>
    </NavWrapper>
  );
};

export default Nav;
