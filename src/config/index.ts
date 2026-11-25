import type { BrandConfig } from './types';
import { ablakbazis } from './brands/ablakbazis';

/** Az aktív márka. Másik ügyfélhez: új fájl a `brands/` mappában, és itt a hivatkozás cseréje. */
export const brand: BrandConfig = ablakbazis;

/** A tokenek CSS-változókká alakítása + a Google Fonts betöltése. */
export function applyBrand(b: BrandConfig = brand) {
  const r = document.documentElement.style;
  for (const [k, v] of Object.entries(b.tokens.color)) r.setProperty(`--c-${k}`, v);
  const f = b.tokens.font;
  r.setProperty('--font-display', f.display);
  r.setProperty('--font-body', f.body);
  r.setProperty('--font-mono', f.mono);
  r.setProperty('--display-stretch', f.displayStretch);
  r.setProperty('--display-weight', String(f.displayWeight));
  r.setProperty('--wordmark-stretch', f.wordmarkStretch);
  r.setProperty('--wordmark-weight', String(f.wordmarkWeight));
  r.setProperty('--mono-stretch', f.monoStretch);
  r.setProperty('--r-control', b.tokens.radius.control);
  r.setProperty('--r-panel', b.tokens.radius.panel);
  r.setProperty('--ease', b.tokens.motion.ease);
  r.setProperty('--t-fast', b.tokens.motion.fast);
  r.setProperty('--t-base', b.tokens.motion.base);
  if (!document.querySelector(`link[data-brand-font="${b.id}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = f.googleHref;
    l.dataset.brandFont = b.id;
    document.head.appendChild(l);
  }
  document.documentElement.dataset.brand = b.id;
}
