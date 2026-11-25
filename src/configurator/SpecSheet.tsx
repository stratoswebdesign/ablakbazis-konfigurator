import { useEffect, useMemo, useRef } from 'react';
import type { BrandConfig } from '../config/types';
import { Icon, Wordmark } from '../site/ui';
import { Elevation } from './Elevation';
import { summaryRows } from './Steps';
import { productOf, type Action, type State } from './state';

declare global {
  interface Window {
    __snapshot?: () => string;
  }
}

/** Amit az értékesítő kap: nézetrajz, látványkép, adatok, érdeklődő – és amit neki kell kitöltenie. */
export function SpecSheet({ brand, s, dispatch }: { brand: BrandConfig; s: State; dispatch: React.Dispatch<Action> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const p = productOf(brand, s.productId);
  const rows = summaryRows(brand, s);
  const shot = useMemo(() => {
    try {
      return window.__snapshot?.() ?? null;
    } catch {
      return null;
    }
  }, []);
  const date = new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    // a dokumentum tetejére fókuszálunk (ne a lap alján lévő gombra ugorjon)
    titleRef.current?.focus({ preventScroll: true });
    d.scrollTop = 0;
    const onClose = () => dispatch({ type: 'closeSheet' });
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, [dispatch]);

  const c = s.contact;
  const ph = (v: string, label: string) => (v.trim() ? v : <span className="placeholder">[{label}]</span>);

  return (
    <dialog ref={ref} className="sheet-dialog" aria-labelledby="sheet-title">
      <article className="sheet">
        <header className="sheet__head">
          <Wordmark brand={brand} note={false} />
          <div className="sheet__meta">
            <h2 id="sheet-title" className="sheet__title" tabIndex={-1} ref={titleRef}>
              Ajánlatkérés – értékesítői adatlap
            </h2>
            <p className="mono">
              {s.refId} · {date}
            </p>
          </div>
        </header>
        <p className="sheet__sent">
          <Icon name="check" size={16} /> Ezt kapja meg a kollégánk. A bemutató változat nem küld adatot.
        </p>

        <div className="sheet__grid">
          <figure className="sheet__drawing">
            <Elevation
              product={p}
              width={s.width}
              height={s.height}
              fields={s.fields}
              shutter={s.shutterType === 'raepitheto'}
              sill={p.sills && s.sillIn !== 'none'}
              symbols={p.kind !== 'sill'}
              panelId={s.panelId}
              dims
              title="Nézetrajz, belső nézet"
            />
            <figcaption className="caption">Nézetrajz, belső nézet · méretek mm-ben</figcaption>
          </figure>
          <div className="sheet__side">
            {shot && (
              <figure className="sheet__shot">
                <img src={shot} alt={`Látványkép: ${p.name}`} />
                <figcaption className="caption">Látványkép az összeállítóból</figcaption>
              </figure>
            )}
            <dl className="spec-list spec-list--sheet">
              {rows.map((r) => (
                <div key={r.label} className="spec-list__row">
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <section className="sheet__section">
          <h3 className="sheet__h">Érdeklődő</h3>
          <dl className="spec-list spec-list--cols">
            <div className="spec-list__row">
              <dt>Név</dt>
              <dd>{ph(c.name, 'NÉV')}</dd>
            </div>
            <div className="spec-list__row">
              <dt>E-mail</dt>
              <dd>{ph(c.email, 'E-MAIL')}</dd>
            </div>
            <div className="spec-list__row">
              <dt>Telefon</dt>
              <dd>{ph(c.phone, 'TELEFON')}</dd>
            </div>
            <div className="spec-list__row">
              <dt>Régió</dt>
              <dd>{ph(c.region, 'RÉGIÓ')}</dd>
            </div>
            <div className="spec-list__row">
              <dt>Település</dt>
              <dd>{ph(c.city, 'TELEPÜLÉS')}</dd>
            </div>
            {c.note.trim() && (
              <div className="spec-list__row spec-list__row--wide">
                <dt>Megjegyzés</dt>
                <dd>{c.note}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="sheet__section sheet__section--todo">
          <h3 className="sheet__h">Az értékesítő tölti ki</h3>
          <dl className="spec-list spec-list--cols">
            <div className="spec-list__row">
              <dt>Hőátbocsátás</dt>
              <dd className="placeholder">{brand.placeholders.uValue}</dd>
            </div>
            <div className="spec-list__row">
              <dt>Ár</dt>
              <dd className="placeholder">{brand.placeholders.price}</dd>
            </div>
          </dl>
        </section>

        <footer className="sheet__foot">
          <p className="caption">{brand.disclaimer}</p>
          <div className="sheet__actions">
            <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
              <Icon name="print" />
              Nyomtatás
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'restart' })}>
              Új összeállítás
            </button>
            <button type="button" className="btn btn--primary" onClick={() => ref.current?.close()}>
              Bezárás
              <Icon name="close" />
            </button>
          </div>
        </footer>
      </article>
    </dialog>
  );
}
