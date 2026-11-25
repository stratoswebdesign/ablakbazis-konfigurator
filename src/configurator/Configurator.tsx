import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { BrandConfig } from '../config/types';
import { Icon } from '../site/ui';
import { Elevation } from './Elevation';
import { SpecSheet } from './SpecSheet';
import { nextLabel, StepBody, STEP_COPY } from './Steps';
import { productOf, STEP_LABELS, stepsFor, type Action, type State } from './state';

const Viewer = lazy(() => import('../three/Viewer'));

/** Ha a WebGL nem indul (régi eszköz), a nézetrajz marad – az összeállító akkor is használható. */
class ViewerBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface Props {
  brand: BrandConfig;
  s: State;
  dispatch: React.Dispatch<Action>;
  embed?: boolean;
}

/** A 3D nézet csak akkor töltődik be, amikor a szakasz a képernyő közelébe ér (lazy load). */
function useNearViewport<T extends Element>(margin = '300px') {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setNear(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [near, margin]);
  return [ref, near] as const;
}

export function ViewerStage({ brand, s, dispatch, embed }: Props) {
  const [ref, near] = useNearViewport<HTMLDivElement>();
  const [touched, setTouched] = useState(false);
  const p = productOf(brand, s.productId);
  const count = s.fields.length;
  const poster = (
    <div className="viewer-poster" aria-hidden="true">
      <Elevation product={p} width={s.width} height={s.height} fields={s.fields} detail="full" />
      <span className="viewer-poster__label">3D modell betöltése</span>
    </div>
  );
  return (
    <div className={`viewer${embed ? ' viewer--embed' : ''}`} ref={ref} onPointerDown={() => setTouched(true)}>
      {near ? (
        <ViewerBoundary fallback={poster}>
          <Suspense fallback={poster}>
            <Viewer state={s} brand={brand} dispatch={dispatch} />
          </Suspense>
        </ViewerBoundary>
      ) : (
        poster
      )}
      {!embed && (
        <>
          <div className="viewer__bar viewer__bar--top">
            <div className="segmented segmented--glass" role="group" aria-label="Nézet">
              <button type="button" className="segmented__btn" aria-pressed={s.view === 'inside'} onClick={() => dispatch({ type: 'view', value: 'inside' })}>
                Belülről
              </button>
              <button type="button" className="segmented__btn" aria-pressed={s.view === 'outside'} onClick={() => dispatch({ type: 'view', value: 'outside' })}>
                Kívülről
              </button>
            </div>
            <div className="viewer__toggles" role="group" aria-label="Rajzi jelölések">
              <button type="button" className="chip" aria-pressed={s.showDims} onClick={() => dispatch({ type: 'dims', value: !s.showDims })}>
                Méretek
              </button>
              <button type="button" className="chip" aria-pressed={s.showSymbols} onClick={() => dispatch({ type: 'symbols', value: !s.showSymbols })}>
                Nyitásjelölés
              </button>
            </div>
          </div>
          <div className="viewer__bar viewer__bar--bottom">
            <p className="viewer__disclaimer">{brand.disclaimer}</p>
            <p className={`viewer__hint${touched ? ' is-hidden' : ''}`} aria-hidden="true">
              <Icon name="rotate" size={16} />
              Húzd a forgatáshoz
            </p>
          </div>
          <p className="sr-only" aria-live="polite">
            {`${p.name}, ${s.width} × ${s.height} mm, ${count} mező.`}
          </p>
        </>
      )}
    </div>
  );
}

function Progress({ brand, s, dispatch }: Props) {
  const steps = stepsFor(productOf(brand, s.productId));
  const cur = steps.indexOf(s.step);
  return (
    <nav className="progress" aria-label="Lépések">
      <ol className="progress__list" style={{ ['--n' as string]: steps.length, ['--cur' as string]: cur }}>
        {steps.map((st, i) => (
          <li key={st} className={`progress__item${i < cur ? ' is-done' : ''}${i === cur ? ' is-current' : ''}`}>
            <button type="button" className="progress__btn" aria-current={i === cur ? 'step' : undefined} onClick={() => dispatch({ type: 'step', step: st })}>
              <span className="progress__num">{i + 1}</span>
              <span className="progress__label">{st === 'ajanlat' ? 'Ajánlat' : STEP_LABELS[st]}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="progress__compact" aria-hidden="true">
        <span className="progress__count">
          {cur + 1}/{steps.length}
        </span>
        <span>{STEP_LABELS[s.step]}</span>
      </p>
    </nav>
  );
}

export function Configurator({ brand, s, dispatch }: Props) {
  const steps = stepsFor(productOf(brand, s.productId));
  const i = steps.indexOf(s.step);
  const copy = STEP_COPY[s.step];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const [ref, inView] = useInView<HTMLElement>();

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    // ha a lépés közepén jártál, az új lépés a tetejéről induljon (a 3D és a fejléc alatt)
    const panel = panelRef.current;
    if (!panel) return;
    const root = getComputedStyle(document.documentElement);
    const hh = parseFloat(root.getPropertyValue('--header-h')) || 64;
    const mobile = window.matchMedia('(max-width: 920px)').matches;
    const viewerH = mobile ? (panel.parentElement?.querySelector<HTMLElement>('.viewer')?.offsetHeight ?? 0) : 0;
    const target = panel.getBoundingClientRect().top + window.scrollY - hh - viewerH;
    if (window.scrollY > target + 2) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
    }
  }, [s.step]);

  const next = () => {
    if (s.step === 'ajanlat') {
      dispatch({ type: 'submit' });
      return;
    }
    dispatch({ type: 'step', step: steps[Math.min(i + 1, steps.length - 1)] });
  };
  const back = () => dispatch({ type: 'step', step: steps[Math.max(0, i - 1)] });

  return (
    <section id="osszeallito" className={`configurator${inView ? ' is-in-view' : ''}`} ref={ref} aria-labelledby="cfg-title">
      <h2 id="cfg-title" className="sr-only">
        Ablak- és párkány-összeállító
      </h2>
      <ViewerStage brand={brand} s={s} dispatch={dispatch} />
      <div className="panel" ref={panelRef}>
        <Progress brand={brand} s={s} dispatch={dispatch} />
        <div className="panel__body">
          <div key={s.step} className={`step step--${s.stepDir > 0 ? 'fwd' : 'back'}`}>
            <p className="step__eyebrow">
              {i + 1} / {steps.length} · {STEP_LABELS[s.step]}
            </p>
            <h3 className="step__title" tabIndex={-1} ref={headingRef}>
              {copy.title}
            </h3>
            <p className="step__lead">{copy.lead}</p>
            <StepBody brand={brand} s={s} dispatch={dispatch} />
          </div>
        </div>
        <div className="panel__nav">
          <button type="button" className="btn btn--ghost" onClick={back} disabled={i === 0}>
            <Icon name="arrow-left" />
            <span className="btn__label-long">Vissza</span>
          </button>
          <button type={s.step === 'ajanlat' ? 'submit' : 'button'} form={s.step === 'ajanlat' ? 'request-form' : undefined} className="btn btn--primary" onClick={s.step === 'ajanlat' ? undefined : next}>
            {nextLabel(brand, s)}
            <Icon name="arrow-right" />
          </button>
        </div>
      </div>
      {s.sheetOpen && <SpecSheet brand={brand} s={s} dispatch={dispatch} />}
    </section>
  );
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setV(e[0].isIntersecting), { rootMargin: '-45% 0px -45% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, v] as const;
}
