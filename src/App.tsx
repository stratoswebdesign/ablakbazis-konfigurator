import { useReducer } from 'react';
import type { BrandConfig } from './config/types';
import { Configurator, ViewerStage } from './configurator/Configurator';
import { initialState, reducerFor } from './configurator/state';
import { Footer, Header, Hero } from './site/Site';

export function App({ brand }: { brand: BrandConfig }) {
  const [s, dispatch] = useReducer(reducerFor(brand), brand, initialState);
  const embed = new URLSearchParams(window.location.search).get('embed') === '1';
  if (embed) {
    // csak a 3D nézet – render- és moodboard-képekhez
    return (
      <main className="embed">
        <ViewerStage brand={brand} s={s} dispatch={dispatch} embed />
      </main>
    );
  }
  return (
    <>
      <a className="skip-link" href="#osszeallito">
        Ugrás az összeállítóhoz
      </a>
      <Header brand={brand} dispatch={dispatch} />
      <main>
        <Hero brand={brand} s={s} dispatch={dispatch} />
        <Configurator brand={brand} s={s} dispatch={dispatch} />
      </main>
      <Footer brand={brand} />
    </>
  );
}
