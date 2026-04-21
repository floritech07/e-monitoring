import { useEffect, useState } from 'react';

/**
 * Hook qui renvoie 'light' ou 'dark' selon la classe `.light-mode` sur <html>.
 * Observe les changements pour réagir au toggle de thème dans le header.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => readTheme());

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const target = document.documentElement;
    const obs = new MutationObserver(() => setTheme(readTheme()));
    obs.observe(target, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return theme;
}

function readTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light-mode') ? 'light' : 'dark';
}
