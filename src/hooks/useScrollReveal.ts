import { useEffect, useRef } from 'react';

const MOBILE_QUERY = '(max-width: 900px)';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Observer options for reveal-on-scroll.
 *
 * On phones people flick through the page far faster than a mouse wheel scrolls,
 * and Safari can delay IntersectionObserver callbacks during momentum scrolling.
 * A negative bottom margin there leaves blank areas on screen for most of a second,
 * so on mobile we start the reveal well before the element reaches the viewport.
 * On desktop we keep the reveal close to the fold so the effect stays visible.
 */
export const getRevealOptions = (): IntersectionObserverInit => {
  const mobile = typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
  return mobile
    ? { threshold: 0, rootMargin: '0px 0px 50% 0px' }
    : { threshold: 0, rootMargin: '0px 0px -40px 0px' };
};

export const useScrollReveal = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      el.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { ...getRevealOptions(), ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
};
