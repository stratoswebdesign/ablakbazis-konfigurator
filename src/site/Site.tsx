import { useState } from 'react';
import type { BrandConfig } from '../config/types';
import { Elevation } from '../configurator/Elevation';
import type { Action, State } from '../configurator/state';
import { Icon, Wordmark } from './ui';

const tel = (p: string) => `tel:${p.replace(/\s/g, '')}`;

export function Header({ brand, dispatch }: { brand: BrandConfig; dispatch: React.Dispatch<Action> }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href={brand.website} aria-label={`${brand.name} – főoldal`}>
          <Wordmark brand={brand} />
        </a>
        <nav className={`site-nav${open ? ' is-open' : ''}`} aria-label="Fő navigáció" id="site-nav">
          <ul>
            {brand.nav.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a className="site-header__phone" href={tel(brand.phone)}>
          <Icon name="phone" size={18} />
          {brand.phone}
        </a>
        <a
          className="btn btn--primary btn--small site-header__cta"
          href="#osszeallito"
          onClick={(e) => {
            e.preventDefault();
            dispatch({ type: 'step', step: 'osszegzes' });
            document.getElementById('osszeallito')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Ajánlatkérés
        </a>
        <button type="button" className="icon-btn site-header__menu" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((v) => !v)}>
          <Icon name={open ? 'close' : 'menu'} />
          <span className="sr-only">Menü</span>
        </button>
      </div>
    </header>
  );
}

export function Hero({ brand, s, dispatch }: { brand: BrandConfig; s: State; dispatch: React.Dispatch<Action> }) {
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const go = (id?: string) => {
    if (id) {
      dispatch({ type: 'product', id });
      dispatch({ type: 'step', step: 'meret' });
    }
    document.getElementById('osszeallito')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  };
  const sillProduct = brand.products.find((p) => p.kind === 'sill');
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__copy">
        <ul className="tags" aria-label="Jellemzők">
          {brand.hero.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h1 id="hero-title" className="hero__title">
          {brand.hero.title}
        </h1>
        <p className="hero__lead">{brand.hero.lead}</p>
        <div className="hero__ctas">
          <a className="btn btn--primary btn--large" href="#osszeallito" onClick={(e) => (e.preventDefault(), go())}>
            {brand.hero.primary}
            <Icon name="arrow-down" />
          </a>
          {sillProduct && (
            <button type="button" className="btn btn--card btn--large" onClick={() => go(sillProduct.id)}>
              {brand.hero.secondary}
            </button>
          )}
        </div>
      </div>
      <ul className="hero__cats" aria-label="Termékek">
        {brand.products.map((p) => {
          const n = p.fieldCounts.includes(2) ? 2 : p.fieldCounts[0];
          const size = p.defaultSize[n] ?? Object.values(p.defaultSize)[0];
          return (
            <li key={p.id}>
              <button type="button" className={`cat${s.productId === p.id ? ' is-current' : ''}`} onClick={() => go(p.id)}>
                <span className="cat__icon">
                  <Elevation product={p} width={size.w} height={size.h} fields={p.defaultFields[n]} detail="icon" sill={p.kind === 'sill'} symbols={p.kind !== 'sill'} />
                </span>
                <span className="cat__name">{p.name}</span>
                <span className="cat__desc">{p.short}</span>
                <Icon name="arrow-right" size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Footer({ brand }: { brand: BrandConfig }) {
  return (
    <footer className="site-footer" id="kapcsolat">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Wordmark brand={brand} as="div" />
          <p>Egyedi méretre gyártott nyílászárók felújításhoz és új építéshez.</p>
          <a className="site-footer__phone" href={tel(brand.phone)}>
            {brand.phone}
          </a>
        </div>
        <div>
          <p className="site-footer__h">Régióink</p>
          <ul className="site-footer__list">
            {brand.regions.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="site-footer__h">Oldalak</p>
          <ul className="site-footer__list">
            {brand.nav.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="site-footer__note">
        <p>{brand.disclaimer}</p>
        <p>{brand.credit}</p>
      </div>
    </footer>
  );
}
