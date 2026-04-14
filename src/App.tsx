import React, { useEffect, useRef } from 'react';
import Nav from '@components/Nav/Nav';
import Hero from '@components/Hero/Hero';
import About from '@components/About/About';
import Skills from '@components/Skills/Skills';
import Experience from '@components/Experience/Experience';
import Projects from '@components/Projects/Projects';
import Contact from '@components/Contact/Contact';
import { AppWrapper, Footer } from './App.styled';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let animId: number;
    const mouse = { x: null as number | null, y: null as number | null };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    const particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; a: number }> = [];
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        a: Math.random() * 0.45 + 0.1,
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) { p.x -= dx * 0.012; p.y -= dy * 0.012; }
        }
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.a})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,212,255,${0.1 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <AppWrapper>
      <Nav />
      <Hero canvasRef={canvasRef} />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Contact />
      <Footer>
        <div className="container">
          <span className="copy">© 2026 Vladislav Cupnii. All rights reserved.</span>
          <span className="mono">Moldova · React · TypeScript · Next.js</span>
        </div>
      </Footer>
    </AppWrapper>
  );
};

export default App;
