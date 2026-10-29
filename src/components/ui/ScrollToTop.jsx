import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop({ targetRef }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = targetRef?.current || window;

    const handleScroll = () => {
      const scrollTop = targetRef?.current
        ? targetRef.current.scrollTop
        : window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    return () => target.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  const scrollToTop = () => {
    if (targetRef?.current) {
      targetRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`group fixed bottom-6 right-6 z-50 grid place-items-center w-11 h-11 rounded-full bg-primrose-fill ring-1 ring-primary-400/70 shadow-glow-primary transition-all duration-300 ease-spring hover:-translate-y-1 active:scale-95 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <ArrowUp size={18} className="stroke-[2.5] transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
