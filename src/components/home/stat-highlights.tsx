'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './story-sections.module.css';

export function StatHighlights({ children, label = 'Company statistics' }: { children: ReactNode; label?: string }) {
  const list = useRef<HTMLDListElement>(null);
  useEffect(() => {
    if (!list.current || !('IntersectionObserver' in window)) return;
    const numbers = list.current.querySelectorAll('dd');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-highlight', 'visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.5 });
    numbers.forEach(number => {
      number.dataset.highlight = 'pending';
      observer.observe(number);
    });
    return () => {
      observer.disconnect();
      numbers.forEach(number => { delete number.dataset.highlight; });
    };
  }, []);
  return <dl ref={list} className={styles.proofFacts} aria-label={label}>{children}</dl>;
}
